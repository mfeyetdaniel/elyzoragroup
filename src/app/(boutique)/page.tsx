import Image from "next/image";
import Link from "next/link";
import CarteProduit from "@/components/boutique/CarteProduit";
import { listerProduits, type Produit } from "@/lib/catalogue";

export const revalidate = 60;

function Titre({ children, sur }: { children: React.ReactNode; sur?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 mb-10 text-center">
      {sur && <p className="text-xs tracking-[.3em] uppercase text-or-doux">✦ {sur}</p>}
      <div className="flex items-center gap-5 justify-center">
        <span className="w-12 md:w-20 h-px bg-or-doux" />
        <h2 className="font-serif font-medium text-3xl md:text-4xl tracking-[.12em] uppercase text-or">{children}</h2>
        <span className="w-12 md:w-20 h-px bg-or-doux" />
      </div>
    </div>
  );
}

const Courbe = ({ cote }: { cote: "g" | "d" }) => (
  <svg aria-hidden="true" viewBox="0 0 200 600" preserveAspectRatio="none"
    className={`absolute top-0 h-full w-[14%] pointer-events-none ${cote === "g" ? "left-0" : "right-0 -scale-x-100"}`}>
    <path d="M0 0 C120 120 140 380 30 600" fill="none" stroke="#BFAB82" strokeWidth="1.2" opacity=".7" />
    <path d="M0 40 C90 160 100 400 0 560" fill="none" stroke="#8F7E5B" strokeWidth="3" opacity=".5" />
  </svg>
);

const UNIVERS = [
  { cle: "mode", titre: "ÉLYSORA MODE", accroche: "Élégance & style pour tous", detail: "Femme · Homme · Enfant · Sacs · Chaussures · Sous-vêtements", sku: "MF-009",
    icone: <path d="M22 6a3 3 0 113 3c-1.5.5-3 1.5-3 3v1L3 24h38L22 13" /> },
  { cle: "hair", titre: "ÉLYSORA HAIR", accroche: "La beauté au naturel", detail: "Perruques · Mèches · Extensions · Soins capillaires", sku: "HA-001",
    icone: <><path d="M26 4c-7 0-12 5-11 12 1 5-2 9-5 12M26 4c5 0 8 4 7 9l-2 1 1 4-3 1v4c0 2-2 3-5 2" /><path d="M19 8c-3 4-3 10 0 15" /></> },
  { cle: "home", titre: "ÉLYSORA HOME", accroche: "Une atmosphère d'exception", detail: "Parfums d'intérieur · Diffuseurs · Bougies · Senteurs maison & voiture", sku: "HO-001",
    icone: <><path d="M8 16L22 4l14 12M11 13v17h22V13" /><path d="M22 27c-3 0-4-2-4-4 0-3 4-5 4-9 2 2 4 5 4 9 0 2-1 4-4 4z" /></> },
];

export default async function Accueil() {
  const tous = await listerProduits({}, 300);
  const par = (f: (p: Produit) => boolean, n: number) => tous.filter(f).slice(0, n);
  const parSku = new Map(tous.map((p) => [p.sku, p]));
  const noel = par((p) => p.categorie === "Noël", 4);
  const nouveautes = par((p) => p.categorie === "Femme" && !!p.images_produit.length, 8).slice(0, 4);
  const enfants = par((p) => p.categorie === "Enfant", 4);
  const lin = ["MH-001", "MH-002"].map((s) => parSku.get(s)).filter(Boolean) as Produit[];

  return (
    <main>
      {/* Héros */}
      <section className="relative overflow-hidden border-b border-or-doux/25 bg-[radial-gradient(ellipse_at_50%_40%,#1d1b16_0%,#0A0A0A_65%)]">
        <Courbe cote="g" /><Courbe cote="d" />
        <div className="relative max-w-[980px] mx-auto px-6 pt-20 pb-24 md:pt-24 md:pb-28 flex flex-col items-center text-center gap-5">
          <Image src="/monogramme.png" alt="" width={120} height={116} priority className="w-24 md:w-[120px] h-auto" />
          <h1 className="font-serif font-medium text-[clamp(48px,8vw,92px)] leading-none tracking-[.08em] text-or">ÉLYSORA</h1>
          <div className="flex items-center gap-5 w-full max-w-[520px]">
            <span className="flex-1 h-px bg-or-doux" /><span className="text-lg tracking-[.6em] pl-[.6em] text-or">GROUP</span><span className="flex-1 h-px bg-or-doux" />
          </div>
          <p className="mt-1 italic font-light uppercase tracking-[.3em] text-sm">L&apos;art de sublimer votre quotidien</p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Link href="/boutique" className="btn-or px-8 py-4 text-[13px] tracking-[.25em] uppercase rounded-[2px]">Découvrir la collection</Link>
            <Link href="/boutique?categorie=No%C3%ABl" className="px-8 py-[15px] text-[13px] tracking-[.25em] uppercase border border-or-doux rounded-[2px] hover:bg-or/10">Collection Noël</Link>
          </div>
        </div>
      </section>

      {/* Univers */}
      <section className="max-w-[1320px] mx-auto px-4 md:px-8 pt-20 md:pt-24 pb-10">
        <Titre>Nos univers</Titre>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {UNIVERS.map((u) => {
            const img = parSku.get(u.sku)?.images_produit[0];
            return (
              <Link key={u.cle} href={`/boutique?branche=${u.cle}`} className="group flex flex-col border border-or-doux/45 bg-noir-texture overflow-hidden text-argent hover:text-argent">
                <div className="relative h-[300px] md:h-[340px] overflow-hidden">
                  {img && <Image src={img.url} alt={u.titre} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
                </div>
                <div className="p-7 flex flex-col items-center gap-2.5 text-center">
                  <svg width="44" height="34" viewBox="0 0 44 34" fill="none" stroke="#E8CB90" strokeWidth="1.3" aria-hidden="true">{u.icone}</svg>
                  <h3 className="font-serif font-medium text-[26px] tracking-[.14em] text-or">{u.titre}</h3>
                  <p className="font-serif italic text-[19px] text-or-doux">{u.accroche}</p>
                  <p className="mt-1 text-sm leading-relaxed">{u.detail}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Noël */}
      {noel.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 md:px-8 py-16">
          <Titre sur="Pyjamas assortis pour toute la famille">Collection Noël</Titre>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
            {noel.map((p, i) => <CarteProduit key={p.id} p={p} priorite={i < 2} />)}
          </div>
          <div className="text-center mt-10"><Link href="/boutique?categorie=No%C3%ABl" className="text-[13px] tracking-[.22em] uppercase border-b border-or-doux pb-2">Voir toute la collection</Link></div>
        </section>
      )}

      {/* Lin homme */}
      {lin.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 md:px-8 py-10">
          <div className="flex flex-wrap border border-or-doux/45 bg-noir-texture">
            <div className="grow basis-[520px] min-h-[380px] grid grid-cols-3 gap-0.5 bg-noir">
              {(lin[0]?.images_produit ?? []).slice(0, 3).map((im) => (
                <div key={im.url} className="relative"><Image src={im.url} alt={im.alt} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover" /></div>
              ))}
            </div>
            <div className="grow basis-[360px] p-10 md:p-14 flex flex-col justify-center gap-4">
              <p className="text-xs tracking-[.3em] uppercase text-or-doux">✦ Homme</p>
              <h2 className="font-serif font-medium text-4xl md:text-[44px] leading-tight text-or">La chemise en lin,<br />col officier</h2>
              <p className="leading-relaxed">100 % lin, coupe droite et poches fendues. Trois coloris pour une élégance naturelle, du bureau aux soirées d&apos;été.</p>
              <Link href={`/produit/${lin[0].slug}`} className="btn-or self-start mt-2 px-8 py-4 text-[13px] tracking-[.25em] uppercase rounded-[2px]">Découvrir</Link>
            </div>
          </div>
        </section>
      )}

      {/* Nouveautés femme */}
      <section className="max-w-[1320px] mx-auto px-4 md:px-8 py-16">
        <Titre sur="Femme">Sélection de la saison</Titre>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
          {nouveautes.map((p) => <CarteProduit key={p.id} p={p} />)}
        </div>
      </section>

      {/* Enfant */}
      <section className="max-w-[1320px] mx-auto px-4 md:px-8 pb-20">
        <Titre>Collection enfant</Titre>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
          {enfants.map((p) => <CarteProduit key={p.id} p={p} />)}
        </div>
        <div className="text-center mt-10"><Link href="/boutique?categorie=Enfant" className="text-[13px] tracking-[.22em] uppercase border-b border-or-doux pb-2">Tout l&apos;univers enfant</Link></div>
      </section>

      {/* Engagements */}
      <section className="border-y border-or-doux/25 bg-noir-texture">
        <ul className="max-w-[1320px] mx-auto px-4 md:px-8 py-10 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {[
            ["Qualité premium", <path key="a" d="M5 25L3 10l8 6 6-10 6 10 8-6-2 15zM6 29h22" />],
            ["Livraison partout au Canada et à l'international", <g key="b"><circle cx="17" cy="17" r="13" /><path d="M4 17h26M17 4c4 4 5 9 5 13s-1 9-5 13c-4-4-5-9-5-13s1-9 5-13z" /></g>],
            ["Service client dédié · Paiement sécurisé", <path key="c" d="M17 3l11 4v9c0 7-5 12-11 15C11 28 6 23 6 16V7zM12 17l4 4 7-8" />],
            ["Votre satisfaction, notre priorité", <path key="d" d="M17 29S4 21 4 12a6.5 6.5 0 0113-2 6.5 6.5 0 0113 2c0 9-13 17-13 17z" />],
          ].map(([t, ic]) => (
            <li key={t as string} className="flex items-center gap-4 text-[15px]">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#E8CB90" strokeWidth="1.3" aria-hidden="true" className="shrink-0">{ic}</svg>
              {t}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
