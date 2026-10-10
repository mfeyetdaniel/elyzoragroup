"use client";
import { useActionState } from "react";
import { Message } from "./ui";
import type { Resultat } from "@/app/admin/(espace)/actions";

export default function AjoutVariante({ action }: { action: (p: Resultat | null, fd: FormData) => Promise<Resultat> }) {
  const [etat, envoyer, enCours] = useActionState(action, null);
  return (
    <form action={envoyer} className="flex flex-wrap gap-2.5 items-end">
      <label className="etiquette flex flex-col gap-1.5 basis-24 grow">Taille<input name="taille" className="champ" required placeholder="M, 42, Unique…" /></label>
      <label className="etiquette flex flex-col gap-1.5 basis-32 grow">Couleur<input name="couleur" className="champ" required /></label>
      <label className="etiquette flex flex-col gap-1.5 basis-20">Stock<input name="stock" className="champ" inputMode="numeric" defaultValue="0" /></label>
      <label className="etiquette flex flex-col gap-1.5 basis-20">Alerte ≤<input name="seuil" className="champ" inputMode="numeric" defaultValue="2" /></label>
      <button className="h-11 px-4 border border-or text-or text-xs tracking-[.16em] uppercase" disabled={enCours}>+ Ajouter</button>
      <div className="basis-full"><Message r={etat} /></div>
    </form>
  );
}
