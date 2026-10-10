"use client";
import { useActionState } from "react";
import { Message } from "./ui";
import type { Resultat } from "@/app/admin/(espace)/actions";

type Produit = {
  sku?: string; nom?: string; branche?: string; categorie?: string; sous_categorie?: string; description?: string;
  prix_cents?: number | null; prix_barre_cents?: number | null; marque?: string; a_verifier?: boolean; statut?: string; note_interne?: string;
};

const enSaisie = (c?: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

export default function FormProduit({ action, produit = {}, creation = false }: {
  action: (p: Resultat | null, fd: FormData) => Promise<Resultat>;
  produit?: Produit;
  creation?: boolean;
}) {
  const [etat, envoyer, enCours] = useActionState(action, null);
  const l = "etiquette flex flex-col gap-1.5";
  return (
    <form action={envoyer} className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {creation && (
          <label className={l}>SKU (code unique)
            <input name="sku" className="champ uppercase" required placeholder="ex. MF-027" />
          </label>
        )}
        <label className={`${l} col-span-full`}>Nom du produit
          <input name="nom" className="champ" required defaultValue={produit.nom} maxLength={160} />
        </label>
        <label className={l}>Branche
          <select name="branche" className="champ" defaultValue={produit.branche ?? "mode"}>
            <option value="mode">ÉLYSORA Mode</option>
            <option value="hair">ÉLYSORA Hair</option>
            <option value="home">ÉLYSORA Home</option>
          </select>
        </label>
        <label className={l}>Catégorie
          <input name="categorie" className="champ" required defaultValue={produit.categorie} list="categories" />
        </label>
        <label className={l}>Sous-catégorie
          <input name="sous_categorie" className="champ" defaultValue={produit.sous_categorie} />
        </label>
        <label className={l}>Prix CAD
          <input name="prix" className="champ !border-or" inputMode="decimal" placeholder="0,00" defaultValue={enSaisie(produit.prix_cents)} />
        </label>
        <label className={l}>Prix barré (promo, facultatif)
          <input name="prix_barre" className="champ" inputMode="decimal" placeholder="0,00" defaultValue={enSaisie(produit.prix_barre_cents)} />
        </label>
        <label className={l}>Marque
          <input name="marque" className="champ" defaultValue={produit.marque} />
        </label>
        {!creation && (
          <label className={l}>Statut
            <select name="statut" className="champ" defaultValue={produit.statut ?? "brouillon"}>
              <option value="brouillon">Brouillon (invisible)</option>
              <option value="publie">Publié (visible sur le site)</option>
              <option value="archive">Archivé</option>
            </select>
          </label>
        )}
        <label className={`${l} col-span-full`}>Description
          <textarea name="description" rows={4} className="champ" defaultValue={produit.description} maxLength={4000} />
        </label>
        <label className={`${l} col-span-full`}>Note interne (jamais visible par les clients)
          <textarea name="note_interne" rows={2} className="champ" defaultValue={produit.note_interne} maxLength={1000} />
        </label>
        <label className="col-span-full flex items-center gap-3 text-sm min-h-11">
          <input type="checkbox" name="a_verifier" defaultChecked={produit.a_verifier} className="w-4 h-4 accent-[#E8CB90]" />
          Logo de marque tierce : authenticité à confirmer (bloque la publication)
        </label>
      </div>
      <datalist id="categories">
        {["Femme", "Homme", "Enfant", "Chaussures", "Sacs", "Bijoux", "Sous-vêtements", "Hair", "Home"].map((c) => <option key={c} value={c} />)}
      </datalist>
      <Message r={etat} />
      <button className="btn-or self-start h-12 px-8 text-xs tracking-[.22em] uppercase" disabled={enCours}>
        {enCours ? "Enregistrement…" : creation ? "Créer le produit" : "Enregistrer"}
      </button>
    </form>
  );
}
