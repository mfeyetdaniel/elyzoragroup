import Image from "next/image";
import Link from "next/link";
import { prix } from "@/lib/format";
import { resume, type Produit } from "@/lib/catalogue";

export default function CarteProduit({ p, priorite = false }: { p: Produit; priorite?: boolean }) {
  const r = resume(p);
  const img = p.images_produit[0];
  return (
    <Link href={`/produit/${p.slug}`} className="group flex flex-col gap-3.5 text-argent hover:text-argent">
      <div className="relative aspect-[4/5] overflow-hidden bg-ivoire">
        {img && (
          <Image src={img.url} alt={img.alt || p.nom} fill priority={priorite} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${r.epuise ? "opacity-50" : ""}`} />
        )}
        {r.epuise ? (
          <span className="absolute top-3 left-3 bg-noir text-or-doux text-[10px] tracking-[.2em] uppercase px-2.5 py-1.5 border border-or-profond">Épuisé</span>
        ) : p.prix_barre_cents ? (
          <span className="absolute top-3 left-3 bg-noir text-or text-[10px] tracking-[.2em] uppercase px-2.5 py-1.5 border border-or-doux">Offre</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] tracking-[.24em] uppercase text-or-profond">{p.categorie}{p.marque ? ` · ${p.marque.replace(/\s*\(.*\)/, "")}` : ""}</span>
        <span className="font-serif text-xl md:text-[22px] leading-tight text-or-clair">{p.nom}</span>
        {r.couleurs.length > 1 && <span className="text-[13px] text-or-doux">{r.couleurs.length} coloris</span>}
        <span className="text-[15px]">
          {r.varie && <span className="text-or-profond text-[13px]">dès </span>}
          {prix(r.min)}
          {p.prix_barre_cents ? <s className="ml-2 text-or-profond text-[13px]">{prix(p.prix_barre_cents)}</s> : null}
        </span>
      </div>
    </Link>
  );
}
