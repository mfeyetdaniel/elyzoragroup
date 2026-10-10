"use server";
import { z } from "zod";
import { supabasePublic } from "@/lib/catalogue";

export type EtatVariante = { id: string; stock: number; prix_cents: number; disponible: boolean };

/** Recalcule prix et stock réels des articles du panier (jamais confiance au navigateur). */
export async function verifierPanier(ids: string[]): Promise<EtatVariante[]> {
  const liste = z.array(z.string().uuid()).max(50).parse(ids);
  if (!liste.length) return [];
  const { data } = await supabasePublic()
    .from("variantes")
    .select("id, stock, actif, prix_cents, produits!inner(prix_cents, statut)")
    .in("id", liste);
  return (data ?? []).map((v) => {
    const p = v.produits as unknown as { prix_cents: number; statut: string };
    return { id: v.id, stock: v.stock, prix_cents: v.prix_cents ?? p.prix_cents, disponible: v.actif && p.statut === "publie" && v.stock > 0 };
  });
}

export type Suivi = {
  numero: string; statut: string; cree_le: string; transporteur: string | null; numero_suivi: string | null; url_suivi: string | null;
  evenements: { statut: string; cree_le: string }[]; articles: { nom: string; taille: string; couleur: string; quantite: number }[];
};

export async function chercherCommande(_p: { suivi?: Suivi; erreur?: string } | null, fd: FormData): Promise<{ suivi?: Suivi; erreur?: string }> {
  const numero = z.string().trim().toUpperCase().regex(/^ELY-\d{4}-\d{4,}$/).safeParse(fd.get("numero"));
  const email = z.string().trim().email().max(254).safeParse(fd.get("email"));
  if (!numero.success || !email.success) return { erreur: "Vérifiez le numéro (ex. ELY-2026-0042) et l'adresse e-mail." };
  const { data } = await supabasePublic().rpc("suivi_commande", { p_numero: numero.data, p_email: email.data });
  if (!data) return { erreur: "Aucune commande ne correspond à ce numéro et cette adresse e-mail." };
  return { suivi: data as Suivi };
}
