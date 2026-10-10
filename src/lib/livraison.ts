/**
 * Tarifs de livraison — VALEURS PROVISOIRES à confirmer par ÉLYSORA Group.
 * Modifier ici puis redéployer (montants en cents CAD).
 */
export type Zone = "CA" | "US" | "INT";

export const ZONES: Record<Zone, { libelle: string; pays: string[] }> = {
  CA: { libelle: "Canada", pays: ["CA"] },
  US: { libelle: "États-Unis", pays: ["US"] },
  INT: {
    libelle: "International",
    pays: ["FR", "BE", "CH", "LU", "MC", "GB", "IE", "DE", "IT", "ES", "PT", "NL", "SE", "DK", "NO", "FI", "AT", "PL",
      "CI", "SN", "CM", "GA", "CG", "CD", "BJ", "TG", "BF", "ML", "MA", "TN", "DZ", "HT", "MX", "BR", "AE", "AU", "NZ", "JP"],
  },
};

export type Option = { nom: string; montant: number; minJours: number; maxJours: number; gratuitDes?: number };

export const OPTIONS: Record<Zone, Option[]> = {
  CA: [
    { nom: "Livraison standard", montant: 1299, minJours: 3, maxJours: 8, gratuitDes: 15000 },
    { nom: "Livraison express", montant: 2499, minJours: 1, maxJours: 3 },
  ],
  US: [{ nom: "Livraison standard", montant: 2499, minJours: 5, maxJours: 10 }],
  INT: [{ nom: "Livraison internationale", montant: 3999, minJours: 7, maxJours: 21 }],
};

export function optionsPour(zone: Zone, sousTotal: number) {
  return OPTIONS[zone].map((o) => ({ ...o, montant: o.gratuitDes && sousTotal >= o.gratuitDes ? 0 : o.montant }));
}
