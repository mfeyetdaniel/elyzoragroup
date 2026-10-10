import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CarteProduit from "@/components/boutique/CarteProduit";
import Achat from "@/components/boutique/Achat";
import Galerie from "@/components/boutique/Galerie";
import { listerProduits, produitParSlug, UNIVERS } from "@/lib/catalogue";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await produitParSlug((await params).slug);
  if (!p) return { title: "Produit introuvable" };
  return {
    title: p.nom,
    description: p.description.slice(0, 160),
    openGraph: { title: p.nom, description: p.description.slice(0, 160), images: p.images_produit[0] ? [p.images_produit[0].url] : [] },
  };
}

export default async function FicheProduit({ params }: { params: Promise<{ slug: string }> }) {
  const p = await produitParSlug((await params).slug);
  if (!p) notFound();
  const similaires = (await listerProduits({ categorie: p.categorie }, 12)).filter((x) => x.id !== p.id).slice(0, 4);
  const univers = UNIVERS[p.branche];

  return (
    <main className="max-w-[1320px] mx-auto px-4 md:px-8 pt-7 pb-20">
      <nav aria-label="Fil d'Ariane" className="text-xs tracking-[.2em] uppercase text-or-profond mb-7 flex flex-wrap gap-x-2">
        <Link href="/" className="text-or-profond">Accueil</Link><span aria-hidden="true">✦</span>
        <Link href={`/boutique?branche=${p.branche}`} className="text-or-profond">{univers.nom.replace("ÉLYSORA ", "")}</Link><span aria-hidden="true">✦</span>
        <Link href={`/boutique?categorie=${encodeURIComponent(p.categorie)}`} className="text-or-profond">{p.categorie}</Link>
      </nav>

      <div className="flex flex-wrap gap-10 lg:gap-14 items-start">
        <div className="grow basis-[480px] min-w-0"><Galerie images={p.images_produit} nom={p.nom} /></div>
        <div className="grow basis-[400px] min-w-0 flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs tracking-[.3em] uppercase text-or-doux">{univers.nom} · {p.categorie}{p.marque ? ` · ${p.marque.replace(/\s*\(.*\)/, "")}` : ""}</span>
            <h1 className="font-serif font-medium text-4xl md:text-[46px] leading-[1.1] text-or">{p.nom}</h1>
          </div>
          <Achat produit={p} />
          <div className="border-t border-or-doux/25">
            <details open className="border-b border-or-doux/25 py-4">
              <summary className="cursor-pointer text-[13px] tracking-[.24em] uppercase text-or">Description</summary>
              <p className="mt-3.5 leading-relaxed whitespace-pre-line">{p.description}</p>
            </details>
            <details className="border-b border-or-doux/25 py-4">
              <summary className="cursor-pointer text-[13px] tracking-[.24em] uppercase text-or">Livraison &amp; retours</summary>
              <p className="mt-3.5 leading-relaxed">Livraison partout au Canada et à l&apos;international. Consultez nos <Link href="/livraison-retours">conditions de livraison et de retour</Link>.</p>
            </details>
            <p className="pt-4 text-xs text-or-profond">Réf. {p.sku}</p>
          </div>
        </div>
      </div>

      {similaires.length > 0 && (
        <section className="mt-24">
          <div className="flex items-center gap-5 justify-center mb-10">
            <span className="w-12 md:w-20 h-px bg-or-doux" />
            <h2 className="font-serif font-medium text-2xl md:text-[32px] tracking-[.12em] uppercase text-or">Vous aimerez aussi</h2>
            <span className="w-12 md:w-20 h-px bg-or-doux" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
            {similaires.map((x) => <CarteProduit key={x.id} p={x} />)}
          </div>
        </section>
      )}
    </main>
  );
}
