import Image from "next/image";
import type { Metadata } from "next";
import Connexion from "./Connexion";

export const metadata: Metadata = { title: "Connexion administration", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ etape?: string; erreur?: string }> }) {
  const { etape, erreur } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_50%_30%,#1d1b16_0%,#0A0A0A_65%)]">
      <div className="w-full max-w-md border border-or-doux bg-noir-texture p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/monogramme.png" alt="" width={64} height={62} priority />
          <h1 className="font-serif text-3xl text-or tracking-[.12em]">ÉLYSORA</h1>
          <p className="etiquette">Administration sécurisée</p>
        </div>
        {erreur === "non-autorise" && (
          <p role="alert" className="border border-erreur text-[#F0B9AD] p-3 text-sm">
            Ce compte n&apos;a pas accès à l&apos;administration.
          </p>
        )}
        <Connexion etapeInitiale={etape === "code" ? "code" : etape === "activer" ? "activer" : "identifiants"} />
      </div>
    </main>
  );
}
