import { NextResponse } from "next/server";
import { z } from "zod";
import { supabasePublic } from "@/lib/catalogue";
import { stripe } from "@/lib/stripe";
import { optionsPour, ZONES, type Zone } from "@/lib/livraison";

const Corps = z.object({
  zone: z.enum(["CA", "US", "INT"]),
  articles: z.array(z.object({ varianteId: z.string().uuid(), quantite: z.number().int().min(1).max(20) })).min(1).max(40),
});

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://elysoragroup.netlify.app").replace(/\/$/, "");

export async function POST(req: Request) {
  let corps: z.infer<typeof Corps>;
  try {
    corps = Corps.parse(await req.json());
  } catch {
    return NextResponse.json({ erreur: "Panier invalide." }, { status: 400 });
  }

  // Prix et stock relus dans la base — jamais ceux envoyés par le navigateur
  const ids = [...new Set(corps.articles.map((a) => a.varianteId))];
  const { data, error } = await supabasePublic()
    .from("variantes")
    .select("id, sku, taille, couleur, stock, actif, prix_cents, produits!inner(id, nom, slug, prix_cents, statut, images_produit(url, position))")
    .in("id", ids);
  if (error) return NextResponse.json({ erreur: "Service momentanément indisponible." }, { status: 503 });

  type Ligne = { id: string; sku: string; taille: string; couleur: string; stock: number; actif: boolean; prix_cents: number | null;
    produits: { id: string; nom: string; slug: string; prix_cents: number; statut: string; images_produit: { url: string; position: number }[] } };
  const parId = new Map((data as unknown as Ligne[]).map((v) => [v.id, v]));

  const problemes: string[] = [];
  const quantites = new Map<string, number>();
  for (const a of corps.articles) quantites.set(a.varianteId, (quantites.get(a.varianteId) ?? 0) + a.quantite);

  let sousTotal = 0;
  const lignes = [...quantites].flatMap(([id, q]) => {
    const v = parId.get(id);
    if (!v || !v.actif || v.produits.statut !== "publie") { problemes.push("Un article n'est plus disponible."); return []; }
    if (v.stock < q) { problemes.push(`${v.produits.nom} (${v.taille}) : il reste ${v.stock} pièce(s).`); return []; }
    const prix = v.prix_cents ?? v.produits.prix_cents;
    sousTotal += prix * q;
    const img = [...v.produits.images_produit].sort((x, y) => x.position - y.position)[0]?.url;
    const details = [v.couleur !== "—" ? v.couleur : null, v.taille !== "Unique" ? `Taille ${v.taille}` : null].filter(Boolean).join(" · ");
    return [{
      quantity: q,
      price_data: {
        currency: "cad",
        unit_amount: prix,
        tax_behavior: "exclusive" as const,
        product_data: {
          name: v.produits.nom,
          description: details || undefined,
          images: img ? [img.startsWith("http") ? img : site() + img] : undefined,
          metadata: { variante_id: v.id, produit_id: v.produits.id, sku: v.sku, taille: v.taille, couleur: v.couleur },
        },
      },
    }];
  });
  if (problemes.length) return NextResponse.json({ erreur: problemes.join(" ") }, { status: 409 });

  const zone = corps.zone as Zone;
  const taxeAuto = process.env.STRIPE_TAX_AUTOMATIQUE === "true";
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr-CA",
      currency: "cad",
      line_items: lignes,
      shipping_address_collection: { allowed_countries: ZONES[zone].pays as never },
      shipping_options: optionsPour(zone, sousTotal).map((o) => ({
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: o.montant === 0 ? `${o.nom} (offerte)` : o.nom,
          fixed_amount: { amount: o.montant, currency: "cad" },
          tax_behavior: "exclusive",
          delivery_estimate: { minimum: { unit: "business_day", value: o.minJours }, maximum: { unit: "business_day", value: o.maxJours } },
        },
      })),
      phone_number_collection: { enabled: true },
      automatic_tax: { enabled: taxeAuto },
      billing_address_collection: "auto",
      metadata: { zone, source: "elysora-site" },
      payment_intent_data: { metadata: { zone } },
      success_url: `${site()}/commande/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site()}/panier?annule=1`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout", e instanceof Error ? e.message : e);
    return NextResponse.json({ erreur: "Le paiement est momentanément indisponible. Réessayez dans un instant." }, { status: 502 });
  }
}
