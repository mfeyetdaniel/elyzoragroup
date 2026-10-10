"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePanier } from "./Panier";
import { prix } from "@/lib/format";
import type { Produit } from "@/lib/catalogue";

const ORDRE = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
function rangTaille(t: string) {
  const i = ORDRE.indexOf(t);
  if (i >= 0) return 1000 + i;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 5000;
}

export default function Achat({ produit: p }: { produit: Produit }) {
  const { ajouter } = usePanier();
  const variantes = useMemo(() => p.variantes.filter((v) => v.actif), [p.variantes]);
  const couleurs = useMemo(() => [...new Set(variantes.map((v) => v.couleur))], [variantes]);
  const tailles = useMemo(() => [...new Set(variantes.map((v) => v.taille))].sort((a, b) => rangTaille(a) - rangTaille(b)), [variantes]);
  const premiereDispo = variantes.find((v) => v.stock > 0);
  const [couleur, setCouleur] = useState(premiereDispo?.couleur ?? couleurs[0]);
  const [taille, setTaille] = useState<string | null>(tailles.length === 1 ? tailles[0] : null);
  const [qte, setQte] = useState(1);
  const [ajoute, setAjoute] = useState(false);

  const v = variantes.find((x) => x.couleur === couleur && x.taille === taille);
  const stockDe = (t: string) => variantes.find((x) => x.couleur === couleur && x.taille === t)?.stock ?? 0;
  const prixAffiche = v?.prix_cents ?? (taille ? p.prix_cents : Math.min(...variantes.filter((x) => x.couleur === couleur).map((x) => x.prix_cents ?? p.prix_cents)));
  const varie = new Set(variantes.map((x) => x.prix_cents ?? p.prix_cents)).size > 1;
  const unique = tailles.length === 1 && tailles[0] === "Unique";
  const libelleCouleur = couleurs.length > 1 || couleurs[0] !== "—";

  let etat: { texte: string; couleur: string } = { texte: unique ? "" : "Choisissez une taille", couleur: "text-or-doux" };
  if (v) {
    if (v.stock === 0) etat = { texte: "Épuisé dans cette taille", couleur: "text-[#D98B7D]" };
    else if (v.stock <= 2) etat = { texte: `Plus que ${v.stock} pièce${v.stock > 1 ? "s" : ""}`, couleur: "text-or-clair" };
    else etat = { texte: "En stock — expédié sous 48 h", couleur: "text-[#9FC59A]" };
  }

  function ajouterAuPanier() {
    if (!v || v.stock === 0) return;
    ajouter({
      varianteId: v.id, slug: p.slug, nom: p.nom, taille: v.taille, couleur: v.couleur,
      prix_cents: v.prix_cents ?? p.prix_cents, image: p.images_produit[0]?.url ?? null, stockMax: v.stock,
    }, qte);
    setAjoute(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl text-or-clair">
        {!v && varie && <span className="text-sm text-or-profond">dès </span>}
        {prix(prixAffiche)}
        {p.prix_barre_cents ? <s className="ml-3 text-base text-or-profond">{prix(p.prix_barre_cents)}</s> : null}
        <span className="block text-[13px] text-or-profond mt-1">CAD · taxes calculées au paiement</span>
      </p>
      <div className="filet-or" />

      {libelleCouleur && couleurs.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[13px] tracking-[.2em] uppercase mb-3">Coloris : <span className="text-or">{couleur}</span></legend>
          <div className="flex flex-wrap gap-2">
            {couleurs.map((c) => (
              <button key={c} type="button" aria-pressed={c === couleur} onClick={() => { setCouleur(c); setAjoute(false); setQte(1); }}
                className={`min-h-11 px-4 text-sm border ${c === couleur ? "border-or text-or bg-or/10" : "border-or-profond text-argent"}`}>{c}</button>
            ))}
          </div>
        </fieldset>
      )}

      {!unique && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[13px] tracking-[.2em] uppercase mb-3">Taille</legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-2.5">
            {tailles.map((t) => {
              const s = stockDe(t);
              const choisie = t === taille;
              return (
                <button key={t} type="button" disabled={s === 0} aria-pressed={choisie} onClick={() => { setTaille(t); setAjoute(false); setQte(1); }}
                  aria-label={s === 0 ? `${t} — épuisé` : t}
                  className={`h-12 text-[15px] border ${choisie ? "bg-or text-noir border-or" : s === 0 ? "border-dashed border-[#4A4334] text-[#6E6450] line-through" : "border-or-profond text-argent hover:border-or"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {etat.texte && <p className={`text-sm ${etat.couleur}`}>✦ {etat.texte}</p>}

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center border border-or-profond h-14">
          <button type="button" aria-label="Diminuer la quantité" onClick={() => setQte((q) => Math.max(1, q - 1))} className="w-12 h-full text-or text-xl">−</button>
          <span aria-live="polite" className="w-9 text-center">{qte}</span>
          <button type="button" aria-label="Augmenter la quantité" onClick={() => setQte((q) => Math.min(v?.stock || 1, q + 1))} className="w-12 h-full text-or text-xl">+</button>
        </div>
        <button type="button" onClick={ajouterAuPanier} disabled={!v || v.stock === 0}
          className="btn-or grow basis-[220px] h-14 text-[13px] tracking-[.26em] uppercase rounded-[2px]">
          {!v ? (unique ? "Indisponible" : "Choisissez une taille") : v.stock === 0 ? "Épuisé" : "Ajouter au panier"}
        </button>
      </div>
      {ajoute && (
        <p role="status" className="border border-succes text-[#CFE3CC] px-4 py-3.5 text-sm">
          ✓ Ajouté au panier — <Link href="/panier">Voir le panier</Link>
        </p>
      )}
      <ul className="flex flex-col gap-2 text-sm p-5 bg-noir-texture border border-or-doux/25">
        <li>✦ Livraison partout au Canada et à l&apos;international</li>
        <li>✦ Paiement 100 % sécurisé par Stripe</li>
        <li>✦ Service client dédié</li>
      </ul>
    </div>
  );
}
