import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Client public (clé anon) : ne voit que ce que la RLS autorise (produits publiés). */
export function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Variante = { id: string; sku: string; taille: string; couleur: string; stock: number; prix_cents: number | null; actif: boolean };
export type Image = { url: string; alt: string; position: number };
export type Produit = {
  id: string; sku: string; slug: string; nom: string; branche: "mode" | "hair" | "home"; categorie: string; sous_categorie: string;
  description: string; prix_cents: number; prix_barre_cents: number | null; marque: string; cree_le: string;
  images_produit: Image[]; variantes: Variante[];
};

const CHAMPS = "id, sku, slug, nom, branche, categorie, sous_categorie, description, prix_cents, prix_barre_cents, marque, cree_le, images_produit(url, alt, position), variantes(id, sku, taille, couleur, stock, prix_cents, actif)";

function trier(p: Produit): Produit {
  return { ...p, images_produit: [...(p.images_produit ?? [])].sort((a, b) => a.position - b.position) };
}

export const UNIVERS = {
  mode: { nom: "ÉLYSORA Mode", accroche: "Élégance & style pour tous", categories: ["Femme", "Homme", "Enfant", "Noël", "Chaussures", "Sacs"] },
  hair: { nom: "ÉLYSORA Hair", accroche: "La beauté au naturel", categories: [] as string[] },
  home: { nom: "ÉLYSORA Home", accroche: "Une atmosphère d'exception", categories: [] as string[] },
} as const;

export type Filtres = { branche?: string; categorie?: string; q?: string; tri?: string };

export async function listerProduits(f: Filtres = {}, limite = 200): Promise<Produit[]> {
  let req = supabasePublic().from("produits").select(CHAMPS).eq("statut", "publie");
  if (f.branche && f.branche in UNIVERS) req = req.eq("branche", f.branche);
  if (f.categorie) req = req.eq("categorie", f.categorie.slice(0, 40));
  const q = (f.q ?? "").trim().replace(/[%,()]/g, "").slice(0, 60);
  if (q) req = req.or(`nom.ilike.%${q}%,description.ilike.%${q}%,sous_categorie.ilike.%${q}%`);
  if (f.tri === "prix-asc") req = req.order("prix_cents", { ascending: true });
  else if (f.tri === "prix-desc") req = req.order("prix_cents", { ascending: false });
  else req = req.order("cree_le", { ascending: false }).order("sku", { ascending: false });
  const { data, error } = await req.limit(limite);
  if (error) throw error;
  return (data as unknown as Produit[]).map(trier);
}

export async function produitParSlug(slug: string): Promise<Produit | null> {
  const { data } = await supabasePublic().from("produits").select(CHAMPS).eq("statut", "publie").eq("slug", slug.slice(0, 160)).maybeSingle();
  return data ? trier(data as unknown as Produit) : null;
}

export async function categoriesDisponibles(branche?: string): Promise<string[]> {
  let req = supabasePublic().from("produits").select("categorie").eq("statut", "publie");
  if (branche) req = req.eq("branche", branche);
  const { data } = await req;
  return [...new Set((data ?? []).map((d) => d.categorie as string))];
}

/** Prix « à partir de » et indicateurs utiles aux cartes produit */
export function resume(p: Produit) {
  const actives = p.variantes.filter((v) => v.actif);
  const prix = actives.map((v) => v.prix_cents ?? p.prix_cents);
  const min = prix.length ? Math.min(...prix) : p.prix_cents;
  const max = prix.length ? Math.max(...prix) : p.prix_cents;
  const stock = actives.reduce((s, v) => s + v.stock, 0);
  const couleurs = [...new Set(actives.map((v) => v.couleur))].filter((c) => c !== "—");
  return { min, varie: min !== max, stock, couleurs, epuise: stock === 0 };
}
