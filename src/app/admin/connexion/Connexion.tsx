"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavigateur } from "@/lib/supabase/client";

type Etape = "identifiants" | "code" | "activer";

export default function Connexion({ etapeInitiale }: { etapeInitiale: Etape }) {
  const supabase = supabaseNavigateur();
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>(etapeInitiale);
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [qr, setQr] = useState<{ facteur: string; image: string; secret: string } | null>(null);

  // Après identifiants : faut-il saisir un code ou activer la 2FA ?
  async function etapeSuivante() {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel === "aal2") return terminer();
    setEtape(data?.nextLevel === "aal2" ? "code" : "activer");
  }

  function terminer() {
    router.replace("/admin");
    router.refresh();
  }

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setOccupe(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp });
    setOccupe(false);
    if (error) return setErreur("Identifiants incorrects ou trop de tentatives. Réessayez dans un instant.");
    setMdp("");
    await etapeSuivante();
  }

  // Activation 2FA : création d'un facteur TOTP et affichage du QR code
  useEffect(() => {
    if (etape !== "activer" || qr) return;
    (async () => {
      const { data: liste } = await supabase.auth.mfa.listFactors();
      // Nettoie un éventuel facteur non vérifié d'une tentative précédente
      for (const f of liste?.all ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "ÉLYSORA admin " + Date.now() });
      if (error || !data) return setErreur("Impossible de démarrer l'activation : " + (error?.message ?? ""));
      setQr({ facteur: data.id, image: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, [etape, qr, supabase]);

  async function verifierCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setOccupe(true);
    let factorId = qr?.facteur;
    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      factorId = data?.totp.find((f) => f.status === "verified")?.id;
    }
    if (!factorId) {
      setOccupe(false);
      return setEtape("activer");
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
    setOccupe(false);
    if (error) return setErreur("Code invalide ou expiré. Vérifiez l'heure de votre téléphone et réessayez.");
    terminer();
  }

  const bouton = "btn-or h-12 w-full text-xs tracking-[.24em] uppercase rounded-[2px]";

  if (etape === "identifiants")
    return (
      <form onSubmit={seConnecter} className="flex flex-col gap-4">
        <label className="etiquette flex flex-col gap-2">Adresse e-mail
          <input className="champ" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="etiquette flex flex-col gap-2">Mot de passe
          <input className="champ" type="password" autoComplete="current-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} />
        </label>
        {erreur && <p role="alert" className="text-sm text-[#F0B9AD]">{erreur}</p>}
        <button className={bouton} disabled={occupe}>{occupe ? "Connexion…" : "Se connecter"}</button>
      </form>
    );

  return (
    <form onSubmit={verifierCode} className="flex flex-col gap-4">
      {etape === "activer" ? (
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <p className="text-or">✦ Première connexion : activez la double authentification.</p>
          <ol className="list-decimal pl-5 flex flex-col gap-1">
            <li>Installez <strong>Google Authenticator</strong> ou <strong>Microsoft Authenticator</strong> sur votre téléphone.</li>
            <li>Scannez ce QR code avec l&apos;application.</li>
            <li>Saisissez le code à 6 chiffres affiché.</li>
          </ol>
          {qr ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.image} alt="QR code d'activation de la double authentification" width={200} height={200} className="bg-white p-2" />
              <p className="text-xs text-or-profond break-all">Clé manuelle : {qr.secret}</p>
            </div>
          ) : (
            <p className="text-or-doux">Préparation du QR code…</p>
          )}
        </div>
      ) : (
        <p className="text-sm">Saisissez le code à 6 chiffres de votre application d&apos;authentification.</p>
      )}
      <label className="etiquette flex flex-col gap-2">Code de vérification
        <input className="champ text-center tracking-[.5em] text-xl" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
      </label>
      {erreur && <p role="alert" className="text-sm text-[#F0B9AD]">{erreur}</p>}
      <button className={bouton} disabled={occupe}>{occupe ? "Vérification…" : "Valider"}</button>
      <button type="button" className="text-xs text-or-profond underline" onClick={async () => { await supabase.auth.signOut(); setEtape("identifiants"); setQr(null); }}>
        Changer de compte
      </button>
    </form>
  );
}
