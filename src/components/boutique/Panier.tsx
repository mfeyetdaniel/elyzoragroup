"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type LignePanier = {
  varianteId: string; slug: string; nom: string; taille: string; couleur: string;
  prix_cents: number; image: string | null; quantite: number; stockMax: number;
};

type Ctx = {
  lignes: LignePanier[];
  nombre: number;
  total: number;
  ajouter: (l: Omit<LignePanier, "quantite">, q?: number) => void;
  changer: (varianteId: string, quantite: number) => void;
  retirer: (varianteId: string) => void;
  remplacer: (l: LignePanier[]) => void;
  vider: () => void;
};

const PanierCtx = createContext<Ctx | null>(null);
const CLE = "elysora-panier-v1";

export function PanierProvider({ children }: { children: React.ReactNode }) {
  const [lignes, setLignes] = useState<LignePanier[]>([]);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) setLignes(JSON.parse(brut));
    } catch { /* stockage indisponible */ }
  }, []);

  const enregistrer = useCallback((l: LignePanier[]) => {
    setLignes(l);
    try { localStorage.setItem(CLE, JSON.stringify(l)); } catch { /* ignore */ }
  }, []);

  const valeur = useMemo<Ctx>(() => ({
    lignes,
    nombre: lignes.reduce((s, l) => s + l.quantite, 0),
    total: lignes.reduce((s, l) => s + l.quantite * l.prix_cents, 0),
    ajouter: (l, q = 1) => {
      const ex = lignes.find((x) => x.varianteId === l.varianteId);
      if (ex) enregistrer(lignes.map((x) => x.varianteId === l.varianteId ? { ...x, ...l, quantite: Math.min(l.stockMax, x.quantite + q) } : x));
      else enregistrer([...lignes, { ...l, quantite: Math.min(l.stockMax, q) }]);
    },
    changer: (id, q) => enregistrer(lignes.map((x) => x.varianteId === id ? { ...x, quantite: Math.max(1, Math.min(x.stockMax, q)) } : x)),
    retirer: (id) => enregistrer(lignes.filter((x) => x.varianteId !== id)),
    remplacer: enregistrer,
    vider: () => enregistrer([]),
  }), [lignes, enregistrer]);

  return <PanierCtx.Provider value={valeur}>{children}</PanierCtx.Provider>;
}

export function usePanier() {
  const c = useContext(PanierCtx);
  if (!c) throw new Error("usePanier hors PanierProvider");
  return c;
}

export function PastillePanier() {
  const { nombre } = usePanier();
  if (!nombre) return null;
  return (
    <span className="absolute top-1.5 right-1 min-w-4 h-4 px-1 rounded-full bg-or text-noir text-[10px] font-medium flex items-center justify-center" aria-hidden="true">
      {nombre}
    </span>
  );
}
