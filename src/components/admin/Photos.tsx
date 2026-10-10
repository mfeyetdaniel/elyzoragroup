"use client";
import Image from "next/image";
import { useActionState, useTransition } from "react";
import { Message } from "./ui";
import { supprimerImage, definirImagePrincipale, type Resultat } from "@/app/admin/(espace)/actions";

type Img = { id: string; url: string; alt: string; position: number };

export default function Photos({ produitId, images, action }: {
  produitId: string;
  images: Img[];
  action: (p: Resultat | null, fd: FormData) => Promise<Resultat>;
}) {
  const [etat, envoyer, envoi] = useActionState(action, null);
  const [enCours, demarrer] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        {images.map((img, i) => (
          <figure key={img.id} className={`flex flex-col gap-1.5 ${enCours ? "opacity-60" : ""}`}>
            <div className={`relative aspect-[4/5] bg-ivoire border ${i === 0 ? "border-or" : "border-or-doux/30"}`}>
              <Image src={img.url} alt={img.alt} fill sizes="160px" className="object-cover" />
              {i === 0 && <span className="absolute top-1.5 left-1.5 bg-noir text-or text-[10px] tracking-[.16em] uppercase px-1.5 py-0.5">Principale</span>}
            </div>
            <figcaption className="flex justify-between text-xs">
              {i > 0 ? <button type="button" className="underline text-or-doux" onClick={() => demarrer(() => definirImagePrincipale(img.id, produitId))}>Principale</button> : <span />}
              <button type="button" className="underline text-[#E3A497]" onClick={() => { if (confirm("Retirer cette photo ?")) demarrer(() => supprimerImage(img.id, produitId)); }}>Retirer</button>
            </figcaption>
          </figure>
        ))}
      </div>
      <form action={envoyer} className="flex flex-wrap gap-3 items-center border border-dashed border-or-doux p-4">
        <label className="grow text-sm flex flex-col gap-1.5">
          <span className="etiquette">Ajouter des photos (JPG, PNG, WebP — 8 Mo max chacune)</span>
          <input type="file" name="photos" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="text-sm file:mr-3 file:h-10 file:px-4 file:border file:border-or file:bg-transparent file:text-or file:uppercase file:text-xs file:tracking-[.14em]" />
        </label>
        <button className="btn-or h-11 px-5 text-xs tracking-[.18em] uppercase" disabled={envoi}>{envoi ? "Envoi…" : "Téléverser"}</button>
        <div className="basis-full"><Message r={etat} /></div>
      </form>
    </div>
  );
}
