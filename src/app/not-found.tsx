import Link from "next/link";

export default function Introuvable() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <span aria-hidden="true" className="text-or text-3xl">✦</span>
      <h1 className="font-serif text-5xl text-or">Page introuvable</h1>
      <p>Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="btn-or px-8 py-4 text-[13px] tracking-[.25em] uppercase rounded-[2px]">Retour à l&apos;accueil</Link>
    </main>
  );
}
