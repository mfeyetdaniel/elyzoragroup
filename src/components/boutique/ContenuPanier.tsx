"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePanier } from "./Panier";
import { verifierPanier } from "@/app/(boutique)/actions";
import { prix } from "@/lib/format";

export default function ContenuPanier() {
  const { lignes, total, changer, retirer, remplacer } = usePanier();
  const [message, setMessage] = useState("");
  const [verifie, setVerifie] = useState(false);
  const cle = lignes.map((l) => l.varianteId).join();

  // Au chargement : mise à jour des prix et du stock réels
  useEffect(() => {
    if (!lignes.length) { setVerifie(true); return; }
    let actif = true;
    verifierPanier(lignes.map((l) => l.varianteId)).then((etats) => {
      if (!actif) return;
      const parId = new Map(etats.map((e) => [e.id, e]));
      let change = false;
      const maj = lignes.flatMap((l) => {
        const e = parId.get(l.varianteId);
        if (!e || !e.disponible) { change = true; return []; }
        const q = Math.min(l.quantite, e.stock);
        if (q !== l.quantite || e.prix_cents !== l.prix_cents || e.stock !== l.stockMax) change = true;
        return [{ ...l, quantite: q, prix_cents: e.prix_cents, stockMax: e.stock }];
      });
      if (change) { remplacer(maj); setMessage("Votre panier a été mis à jour selon les prix et le stock actuels."); }
      setVerifie(true);
    }).catch(() => { if (actif) setVerifie(true); /* hors ligne : on garde le panier tel quel */ });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  if (!lignes.length)
    return (
      <div className="text-center flex flex-col items-center gap-6 py-10">
        <p className="text-or-doux">Votre panier est vide.</p>
        <Link href="/boutique" className="btn-or px-8 py-4 text-[13px] tracking-[.25em] uppercase rounded-[2px]">Découvrir la boutique</Link>
      </div>
    );

  return (
    <div className="flex flex-wrap gap-8 items-start">
      <section aria-label="Articles" className="grow-[2] basis-[520px] min-w-0 flex flex-col">
        {message && <p role="status" className="mb-4 border border-or-doux text-or-clair text-sm p-3">{message}</p>}
        <ul>
          {lignes.map((l) => (
            <li key={l.varianteId} className="flex gap-4 py-5 border-b border-or-doux/20">
              <Link href={`/produit/${l.slug}`} className="relative w-24 h-[120px] shrink-0 bg-ivoire">
                {l.image && <Image src={l.image} alt={l.nom} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="grow flex flex-col gap-1.5 min-w-0">
                <Link href={`/produit/${l.slug}`} className="font-serif text-xl text-or-clair leading-tight">{l.nom}</Link>
                <span className="text-sm text-or-doux">{[l.couleur !== "—" && l.couleur, l.taille !== "Unique" && `Taille ${l.taille}`].filter(Boolean).join(" · ")}</span>
                <div className="flex flex-wrap items-center gap-4 mt-auto">
                  <div className="flex items-center border border-or-profond h-10">
                    <button type="button" aria-label={`Diminuer ${l.nom}`} onClick={() => changer(l.varianteId, l.quantite - 1)} className="w-10 h-full text-or">−</button>
                    <span className="w-8 text-center text-sm" aria-live="polite">{l.quantite}</span>
                    <button type="button" aria-label={`Augmenter ${l.nom}`} disabled={l.quantite >= l.stockMax} onClick={() => changer(l.varianteId, l.quantite + 1)} className="w-10 h-full text-or disabled:opacity-30">+</button>
                  </div>
                  <button type="button" onClick={() => retirer(l.varianteId)} className="text-xs underline text-or-profond">Retirer</button>
                </div>
              </div>
              <span className="tabular-nums text-argent">{prix(l.prix_cents * l.quantite)}</span>
            </li>
          ))}
        </ul>
        <Link href="/boutique" className="mt-6 text-xs tracking-[.2em] uppercase">← Continuer mes achats</Link>
      </section>

      <aside aria-label="Récapitulatif" className="grow basis-[300px] border border-or-doux bg-noir-texture p-6 flex flex-col gap-4 lg:sticky lg:top-28">
        <h2 className="text-xs tracking-[.28em] uppercase text-or">Récapitulatif</h2>
        <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
          <dt>Sous-total</dt><dd className="tabular-nums">{prix(total)}</dd>
          <dt>Livraison</dt><dd className="text-or-doux">calculée au paiement</dd>
          <dt>Taxes (TPS/TVQ)</dt><dd className="text-or-doux">calculées au paiement</dd>
        </dl>
        <div className="filet-or" />
        <p className="flex justify-between text-lg text-or-clair"><span>Total estimé</span><span className="tabular-nums">{prix(total)}</span></p>
        <button type="button" disabled className="btn-or h-14 text-[13px] tracking-[.24em] uppercase rounded-[2px]">
          {verifie ? "Paiement sécurisé — bientôt" : "Vérification…"}
        </button>
        <p className="text-xs text-or-profond text-center">Le paiement par carte (Stripe) ouvre très prochainement.</p>
      </aside>
    </div>
  );
}
