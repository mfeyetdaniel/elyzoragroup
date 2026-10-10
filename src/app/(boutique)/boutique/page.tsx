import Link from "next/link";
import type { Metadata } from "next";
import CarteProduit from "@/components/boutique/CarteProduit";
import { categoriesDisponibles, listerProduits, resume, UNIVERS, type Filtres } from "@/lib/catalogue";

export const revalidate = 60;

type SP = Filtres & { dispo?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const u = sp.branche && sp.branche in UNIVERS ? UNIVERS[sp.branche as keyof typeof UNIVERS] : null;
  const titre = sp.categorie ?? u?.nom ?? "Boutique";
  return { title: titre, description: u?.accroche ?? "Mode, cheveux et parfums d'intérieur — ÉLYSORA Group." };
}

export default async function Boutique({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const branche = sp.branche && sp.branche in UNIVERS ? (sp.branche as keyof typeof UNIVERS) : undefined;
  const [produitsBruts, categories] = await Promise.all([
    listerProduits({ branche, categorie: sp.categorie, q: sp.q, tri: sp.tri }),
    categoriesDisponibles(branche),
  ]);
  const produits = sp.dispo === "1" ? produitsBruts.filter((p) => !resume(p).epuise) : produitsBruts;
  const u = branche ? UNIVERS[branche] : null;

  const lien = (maj: Partial<SP>) => {
    const o = { ...sp, ...maj } as Record<string, string | undefined>;
    const q = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]);
    const s = q.toString();
    return s ? `/boutique?${s}` : "/boutique";
  };
  const puce = (actif: boolean) =>
    `min-h-11 px-5 flex items-center text-xs tracking-[.24em] uppercase rounded-[2px] border ${actif ? "bg-or text-noir border-or hover:text-noir" : "border-or-profond text-argent hover:text-or-clair"}`;

  return (
    <main>
      <section className="border-b border-or-doux/25 bg-[radial-gradient(ellipse_at_50%_0%,#1d1b16_0%,#0A0A0A_70%)]">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 pt-12 pb-10 flex flex-col items-center text-center gap-3">
          <nav aria-label="Fil d'Ariane" className="text-xs tracking-[.2em] uppercase text-or-profond">
            <Link href="/" className="text-or-profond">Accueil</Link> <span aria-hidden="true">✦</span> {sp.categorie ?? u?.nom ?? "Boutique"}
          </nav>
          <h1 className="font-serif font-medium text-4xl md:text-[56px] tracking-[.1em] text-or uppercase">{sp.categorie ?? u?.nom ?? "La boutique"}</h1>
          {u && <p className="font-serif italic text-xl text-or-doux">{u.accroche}</p>}
          <nav aria-label="Univers" className="flex flex-wrap justify-center gap-2.5 mt-5">
            <Link href={lien({ branche: undefined, categorie: undefined })} className={puce(!branche && !sp.categorie)}>Tout</Link>
            {Object.entries(UNIVERS).map(([k, v]) => (
              <Link key={k} href={lien({ branche: k, categorie: undefined })} className={puce(branche === k && !sp.categorie)}>{v.nom.replace("ÉLYSORA ", "")}</Link>
            ))}
          </nav>
          {categories.length > 1 && (
            <nav aria-label="Catégories" className="flex flex-wrap justify-center gap-2 mt-1">
              {categories.sort().map((c) => (
                <Link key={c} href={lien({ categorie: sp.categorie === c ? undefined : c })}
                  className={`min-h-10 px-4 flex items-center text-[11px] tracking-[.2em] uppercase border ${sp.categorie === c ? "border-or text-or" : "border-[#3a352a] text-argent"}`}>{c}</Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-10">
        <form className="flex flex-wrap items-end justify-between gap-3 pb-5 mb-8 border-b border-or-doux/25" action="/boutique">
          {branche && <input type="hidden" name="branche" value={branche} />}
          {sp.categorie && <input type="hidden" name="categorie" value={sp.categorie} />}
          <label className="grow basis-[240px] max-w-md">
            <span className="sr-only">Rechercher un produit</span>
            <input name="q" defaultValue={sp.q} placeholder="Rechercher : lin, perruque, pyjama…" className="champ" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm min-h-11">
              <input type="checkbox" name="dispo" value="1" defaultChecked={sp.dispo === "1"} className="w-4 h-4 accent-[#E8CB90]" /> En stock
            </label>
            <label className="flex items-center gap-2 text-xs tracking-[.14em] uppercase">Trier
              <select name="tri" defaultValue={sp.tri ?? ""} className="champ !w-auto">
                <option value="">Nouveautés</option>
                <option value="prix-asc">Prix croissant</option>
                <option value="prix-desc">Prix décroissant</option>
              </select>
            </label>
            <button className="h-11 px-5 border border-or text-or text-xs tracking-[.2em] uppercase">Appliquer</button>
          </div>
        </form>

        <p className="text-sm text-or-doux mb-6">{produits.length} article{produits.length > 1 ? "s" : ""}</p>
        {produits.length === 0 ? (
          <p className="py-16 text-center text-or-doux">Aucun article ne correspond. <Link href="/boutique">Voir toute la boutique</Link></p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
            {produits.map((p, i) => <CarteProduit key={p.id} p={p} priorite={i < 4} />)}
          </div>
        )}
      </div>
    </main>
  );
}
