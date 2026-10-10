import type { Metadata } from "next";
import { Suspense } from "react";
import ContenuPanier from "@/components/boutique/ContenuPanier";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function PagePanier() {
  return (
    <main className="max-w-[1100px] mx-auto px-4 md:px-8 py-12">
      <h1 className="font-serif font-medium text-4xl md:text-5xl text-or text-center mb-10">Votre panier</h1>
      <Suspense><ContenuPanier /></Suspense>
    </main>
  );
}
