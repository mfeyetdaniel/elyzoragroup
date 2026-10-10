import Image from "next/image";

// Page d'accueil provisoire — la vraie boutique arrive en Phase 3.
export default function Accueil() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-[radial-gradient(ellipse_at_50%_40%,#1d1b16_0%,#0A0A0A_65%)]">
      <Image src="/monogramme.png" alt="" width={120} height={116} priority />
      <h1 className="font-serif text-or text-6xl md:text-8xl tracking-[.08em] font-medium">ÉLYSORA</h1>
      <div className="flex items-center gap-5 w-full max-w-md">
        <span className="flex-1 h-px bg-or-doux" />
        <span className="text-or tracking-[.6em] pl-[.6em]">GROUP</span>
        <span className="flex-1 h-px bg-or-doux" />
      </div>
      <p className="italic font-light uppercase tracking-[.3em] text-sm">L&apos;art de sublimer votre quotidien</p>
      <p className="mt-8 text-or-doux tracking-[.25em] uppercase text-xs">✦ Boutique en préparation ✦</p>
    </main>
  );
}
