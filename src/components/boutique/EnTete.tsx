import Image from "next/image";
import Link from "next/link";
import { PastillePanier } from "./Panier";

const NAV = [
  { href: "/boutique?branche=mode", label: "Mode" },
  { href: "/boutique?branche=hair", label: "Hair" },
  { href: "/boutique?branche=home", label: "Home" },
  { href: "/boutique?categorie=No%C3%ABl", label: "Noël" },
];

const Icone = ({ d }: { d: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{d}</svg>
);

export default function EnTete() {
  return (
    <>
      <div className="bg-noir-texture border-b border-or-doux/25 px-4 py-2.5 text-center text-[11px] md:text-xs tracking-[.22em] uppercase text-or-doux">
        ✦ Livraison partout au Canada et à l&apos;international ✦
      </div>
      <header className="border-b border-or-doux/25 bg-noir/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <details className="md:hidden relative">
            <summary className="list-none w-11 h-11 flex items-center justify-center text-or cursor-pointer" aria-label="Menu">
              <Icone d={<path d="M4 7h16M4 12h16M4 17h16" />} />
            </summary>
            <nav aria-label="Navigation mobile" className="absolute left-0 top-12 w-56 bg-noir-texture border border-or-doux p-2 flex flex-col">
              {NAV.map((n) => <Link key={n.href} href={n.href} className="px-3 py-3 text-sm tracking-[.24em] uppercase text-argent">{n.label}</Link>)}
              <Link href="/suivi" className="px-3 py-3 text-sm tracking-[.16em] uppercase text-argent">Suivre ma commande</Link>
            </nav>
          </details>
          <Link href="/" aria-label="ÉLYSORA Group — accueil" className="shrink-0">
            <Image src="/logo.png" alt="ÉLYSORA Group" width={235} height={53} priority className="h-10 md:h-[52px] w-auto" />
          </Link>
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-7">
            {NAV.map((n, i) => (
              <span key={n.href} className="flex items-center gap-7">
                {i > 0 && <span aria-hidden="true" className="text-or-profond">·</span>}
                <Link href={n.href} className="text-argent hover:text-or-clair text-[13px] tracking-[.28em] uppercase py-3">{n.label}</Link>
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/boutique" aria-label="Rechercher" className="w-11 h-11 flex items-center justify-center"><Icone d={<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>} /></Link>
            <Link href="/suivi" aria-label="Suivre ma commande" className="w-11 h-11 hidden sm:flex items-center justify-center"><Icone d={<><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></>} /></Link>
            <Link href="/panier" aria-label="Panier" className="w-11 h-11 flex items-center justify-center relative">
              <Icone d={<><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6a3 3 0 016 0v2" /></>} />
              <PastillePanier />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
