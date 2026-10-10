import type { MetadataRoute } from "next";
import { listerProduits } from "@/lib/catalogue";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elysoragroup.netlify.app";
  const statiques = ["", "/boutique", "/boutique?branche=mode", "/boutique?branche=hair", "/boutique?branche=home", "/suivi", "/a-propos", "/contact", "/faq", "/livraison-retours", "/cgv", "/confidentialite", "/mentions-legales"];
  let produits: { slug: string }[] = [];
  try { produits = await listerProduits({}, 1000); } catch { /* base indisponible au build */ }
  return [
    ...statiques.map((s) => ({ url: base + s })),
    ...produits.map((p) => ({ url: `${base}/produit/${p.slug}` })),
  ];
}
