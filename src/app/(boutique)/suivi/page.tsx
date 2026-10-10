import type { Metadata } from "next";
import Suivi from "@/components/boutique/Suivi";

export const metadata: Metadata = { title: "Suivre ma commande" };

export default function PageSuivi() {
  return (
    <main className="max-w-[1080px] mx-auto px-4 md:px-8 py-14 flex flex-col gap-10">
      <div className="flex flex-col items-center text-center gap-3">
        <span aria-hidden="true" className="text-or text-2xl">✦</span>
        <h1 className="font-serif font-medium text-4xl md:text-[52px] text-or">Suivre ma commande</h1>
        <p className="max-w-xl leading-relaxed">Entrez votre numéro de commande (reçu par e-mail) et l&apos;adresse e-mail utilisée lors de l&apos;achat.</p>
      </div>
      <Suivi />
    </main>
  );
}
