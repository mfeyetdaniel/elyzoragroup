const fmt = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });

export const prix = (cents: number | null | undefined) =>
  cents == null ? "—" : fmt.format(cents / 100);

/** « 49,90 » ou « 49.90 » → 4990 ; vide → null */
export function versCents(saisie: string | null | undefined): number | null {
  if (!saisie) return null;
  const n = Number(String(saisie).replace(/\s|\$/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("Prix invalide");
  return Math.round(n * 100);
}

export const date = (iso: string) =>
  new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" }).format(new Date(iso));

export const BRANCHES = { mode: "ÉLYSORA Mode", hair: "ÉLYSORA Hair", home: "ÉLYSORA Home" } as const;
export const STATUTS_PRODUIT = { brouillon: "Brouillon", publie: "Publié", archive: "Archivé" } as const;
export const STATUTS_COMMANDE = {
  payee: "Payée",
  en_preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
  remboursee: "Remboursée",
} as const;
export type StatutCommande = keyof typeof STATUTS_COMMANDE;
