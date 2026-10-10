import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Section = { titre: string; texte: string[] };
type Page = { titre: string; intro?: string; sections: Section[]; brouillon?: boolean };

const A_COMPLETER = "[À COMPLÉTER par ÉLYSORA Group]";

const PAGES: Record<string, Page> = {
  "a-propos": {
    titre: "À propos",
    intro: "ÉLYSORA Group — l'art de sublimer votre quotidien.",
    sections: [
      { titre: "Notre maison", texte: ["ÉLYSORA Group réunit trois univers autour d'une même exigence : élégance, modernité et ouverture sur le monde."] },
      { titre: "ÉLYSORA Mode — Élégance & style pour tous", texte: ["Vêtements femme, homme et enfant, sacs, chaussures, sous-vêtements et bijoux."] },
      { titre: "ÉLYSORA Hair — La beauté au naturel", texte: ["Perruques, mèches, extensions et soins capillaires."] },
      { titre: "ÉLYSORA Home — Une atmosphère d'exception", texte: ["Parfums d'intérieur, diffuseurs, bougies parfumées et senteurs pour le bureau, la maison et la voiture."] },
      { titre: "Nos engagements", texte: ["Qualité premium · Livraison partout au Canada et à l'international · Service client dédié · Votre satisfaction, notre priorité."] },
    ],
  },
  contact: {
    titre: "Contact",
    intro: "Une question sur un produit, une taille ou une commande ? Notre service client vous répond.",
    sections: [
      { titre: "Par e-mail", texte: ["elysoragroup@gmail.com"] },
      { titre: "Délai de réponse", texte: [A_COMPLETER] },
      { titre: "Suivi de commande", texte: ["Retrouvez l'avancement de votre commande sur la page « Suivre ma commande »."] },
    ],
  },
  faq: {
    titre: "Questions fréquentes",
    brouillon: true,
    sections: [
      { titre: "Comment choisir ma taille ?", texte: [A_COMPLETER] },
      { titre: "Quels sont les délais de livraison ?", texte: [A_COMPLETER] },
      { titre: "Puis-je retourner un article ?", texte: ["Voir notre page Livraison & retours."] },
      { titre: "Le paiement est-il sécurisé ?", texte: ["Oui. Le paiement est traité par Stripe sur une page sécurisée ; ÉLYSORA Group n'a jamais accès à vos données de carte bancaire."] },
      { titre: "Comment suivre ma commande ?", texte: ["Rendez-vous sur « Suivre ma commande » avec votre numéro (ELY-…) et votre adresse e-mail."] },
    ],
  },
  "livraison-retours": {
    titre: "Livraison & retours",
    brouillon: true,
    sections: [
      { titre: "Zones de livraison", texte: ["Partout au Canada et à l'international."] },
      { titre: "Tarifs et délais", texte: [A_COMPLETER] },
      { titre: "Retours et échanges", texte: [A_COMPLETER + " — délai accepté, état des articles, frais de retour, articles exclus (ex. sous-vêtements, perruques)."] },
      { titre: "Remboursements", texte: [A_COMPLETER] },
    ],
  },
  cgv: {
    titre: "Conditions générales de vente",
    brouillon: true,
    sections: [
      { titre: "Vendeur", texte: [A_COMPLETER + " — raison sociale, adresse, NEQ, numéros de TPS/TVQ."] },
      { titre: "Prix et paiement", texte: ["Les prix sont indiqués en dollars canadiens (CAD). Les taxes applicables (TPS/TVQ ou TVH) et les frais de livraison sont calculés lors du paiement. Le paiement est traité de façon sécurisée par Stripe."] },
      { titre: "Commande et disponibilité", texte: [A_COMPLETER] },
      { titre: "Livraison, retours et garanties", texte: ["Voir la page Livraison & retours. " + A_COMPLETER] },
      { titre: "Droit applicable", texte: [A_COMPLETER] },
    ],
  },
  confidentialite: {
    titre: "Politique de confidentialité",
    brouillon: true,
    sections: [
      { titre: "Responsable de la protection des renseignements personnels", texte: [A_COMPLETER + " — nom, titre et coordonnées (exigé par la Loi 25 au Québec)."] },
      { titre: "Renseignements recueillis", texte: ["Lors d'une commande : nom, adresse de livraison, adresse e-mail, téléphone. Les données de carte bancaire sont traitées uniquement par Stripe et ne sont jamais stockées par ÉLYSORA Group."] },
      { titre: "Utilisation", texte: ["Traitement et livraison des commandes, suivi de commande, service client et, avec votre consentement, envoi d'offres."] },
      { titre: "Prestataires", texte: ["Hébergement (Netlify), base de données (Supabase), paiement (Stripe), envoi d'e-mails. " + A_COMPLETER + " — préciser les pays où les données sont hébergées."] },
      { titre: "Conservation et droits", texte: [A_COMPLETER + " — durée de conservation ; droit d'accès, de rectification et de retrait du consentement, et comment l'exercer."] },
      { titre: "Témoins (cookies)", texte: ["Le site n'utilise que les témoins nécessaires à son fonctionnement (panier, connexion à l'administration)."] },
    ],
  },
  "mentions-legales": {
    titre: "Mentions légales",
    brouillon: true,
    sections: [
      { titre: "Éditeur du site", texte: [A_COMPLETER + " — ÉLYSORA Group, adresse, NEQ, courriel."] },
      { titre: "Hébergement", texte: ["Netlify, Inc. — San Francisco, Californie, États-Unis."] },
      { titre: "Propriété intellectuelle", texte: ["Le nom ÉLYSORA Group, le logo et les contenus du site sont protégés. Les marques citées appartiennent à leurs propriétaires respectifs."] },
    ],
  },
};

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const p = PAGES[(await params).page];
  return p ? { title: p.titre } : {};
}

export default async function PageInfo({ params }: { params: Promise<{ page: string }> }) {
  const p = PAGES[(await params).page];
  if (!p) notFound();
  return (
    <main className="max-w-[860px] mx-auto px-4 md:px-8 py-14">
      <nav aria-label="Fil d'Ariane" className="text-xs tracking-[.2em] uppercase text-or-profond mb-6"><Link href="/" className="text-or-profond">Accueil</Link> ✦ {p.titre}</nav>
      <h1 className="font-serif font-medium text-4xl md:text-5xl text-or mb-4">{p.titre}</h1>
      {p.intro && <p className="font-serif italic text-xl text-or-doux mb-8">{p.intro}</p>}
      <div className="filet-or mb-10" />
      <div className="flex flex-col gap-8">
        {p.sections.map((s) => (
          <section key={s.titre} className="flex flex-col gap-2.5">
            <h2 className="text-[13px] tracking-[.24em] uppercase text-or">✦ {s.titre}</h2>
            {s.texte.map((t, i) => <p key={i} className={`leading-relaxed ${t.includes("[À COMPLÉTER") ? "text-or-profond italic" : ""}`}>{t}</p>)}
          </section>
        ))}
      </div>
    </main>
  );
}
