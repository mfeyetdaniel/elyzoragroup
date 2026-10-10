export function Titre({ children, sous }: { children: React.ReactNode; sous?: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-serif font-medium text-4xl text-or">{children}</h1>
      {sous && <p className="mt-1 text-sm text-or-profond">{sous}</p>}
    </div>
  );
}

export function Tuile({ label, valeur, alerte }: { label: string; valeur: React.ReactNode; alerte?: boolean }) {
  return (
    <div className={`p-4 flex flex-col gap-1 border ${alerte ? "border-erreur bg-[#1a1210]" : "border-or-doux/35 bg-noir-texture"}`}>
      <span className={`etiquette ${alerte ? "!text-[#E3A497]" : ""}`}>{label}</span>
      <span className={`font-serif text-4xl ${alerte ? "text-[#F0B9AD]" : "text-or-clair"}`}>{valeur}</span>
    </div>
  );
}

export function Pastille({ children, ton = "or" }: { children: React.ReactNode; ton?: "or" | "doux" | "ok" | "alerte" | "bleu" }) {
  const c = {
    or: "border-or text-or",
    doux: "border-dashed border-or-profond text-or-doux",
    ok: "border-succes text-[#9FC59A]",
    alerte: "border-erreur text-[#F0B9AD]",
    bleu: "border-[#8DB3E2] text-[#B5CFEE]",
  }[ton];
  return <span className={`inline-block whitespace-nowrap text-[11px] tracking-[.12em] uppercase px-2.5 py-1 border ${c}`}>{children}</span>;
}

export function Message({ r }: { r: { ok: boolean; message: string } | null }) {
  if (!r?.message) return null;
  return (
    <p role="status" className={`text-sm p-3 border ${r.ok ? "border-succes text-[#CFE3CC]" : "border-erreur text-[#F0B9AD]"}`}>
      {r.message}
    </p>
  );
}
