import Image from "next/image";
import Link from "next/link";

const COLONNES = [
  { titre: "Boutique", liens: [["/boutique?branche=mode", "ÉLYSORA Mode"], ["/boutique?branche=hair", "ÉLYSORA Hair"], ["/boutique?branche=home", "ÉLYSORA Home"], ["/boutique?categorie=No%C3%ABl", "Collection Noël"]] },
  { titre: "Service client", liens: [["/suivi", "Suivre ma commande"], ["/livraison-retours", "Livraison & retours"], ["/faq", "FAQ"], ["/contact", "Contact"]] },
  { titre: "Informations", liens: [["/a-propos", "À propos"], ["/cgv", "Conditions générales de vente"], ["/confidentialite", "Politique de confidentialité"], ["/mentions-legales", "Mentions légales"]] },
];

export default function PiedDePage() {
  return (
    <footer className="border-t border-or-doux/25 bg-noir-profond mt-auto">
      <div className="max-w-[1320px] mx-auto px-4 md:px-8 pt-14 pb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
        <div className="flex flex-col gap-3.5">
          <Image src="/logo.png" alt="ÉLYSORA Group" width={200} height={45} className="w-[200px] h-auto" />
          <p className="italic text-[13px] tracking-[.14em] text-or-doux">L&apos;art de sublimer votre quotidien</p>
        </div>
        {COLONNES.map((c) => (
          <nav key={c.titre} aria-label={c.titre} className="flex flex-col gap-2.5 text-sm">
            <span className="text-xs tracking-[.28em] uppercase text-or mb-1">{c.titre}</span>
            {c.liens.map(([href, label]) => <Link key={href} href={href} className="text-argent hover:text-or-clair">{label}</Link>)}
          </nav>
        ))}
      </div>
      <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-5 border-t border-or-doux/15 flex flex-wrap justify-between gap-3 text-xs text-or-profond">
        <span>© {new Date().getFullYear()} ÉLYSORA Group · Tous droits réservés</span>
        <span>Paiement sécurisé par Stripe · Prix en CAD</span>
      </div>
    </footer>
  );
}
