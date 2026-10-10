import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Configuration manquante", { status: 400 });

  let evt: Stripe.Event;
  try {
    // Vérification de la signature : seuls les appels réellement envoyés par Stripe sont acceptés
    evt = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  try {
    switch (evt.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = evt.data.object as Stripe.Checkout.Session;
        if (s.payment_status === "paid") await creerCommande(s.id);
        break;
      }
      case "charge.refunded": {
        const c = evt.data.object as Stripe.Charge;
        if (c.refunded && typeof c.payment_intent === "string") await marquerRemboursee(c.payment_intent);
        break;
      }
    }
  } catch (e) {
    console.error("Webhook", evt.type, e instanceof Error ? e.message : e);
    return new Response("Erreur de traitement", { status: 500 }); // Stripe réessaiera
  }
  return new Response("ok");
}

async function creerCommande(sessionId: string) {
  const db = supabaseService();
  // Idempotence : un même paiement ne crée jamais deux commandes
  const { data: existe } = await db.from("commandes").select("id").eq("stripe_session_id", sessionId).maybeSingle();
  if (existe) return;

  const s = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["line_items.data.price.product"] });
  const livraison = (s as unknown as { collected_information?: { shipping_details?: Stripe.Checkout.Session.CollectedInformation.ShippingDetails } })
    .collected_information?.shipping_details;
  const adr = livraison?.address ?? s.customer_details?.address;
  const email = s.customer_details?.email ?? "";

  const { data: cmd, error } = await db.from("commandes").insert({
    email,
    nom_client: livraison?.name ?? s.customer_details?.name ?? "",
    telephone: s.customer_details?.phone ?? "",
    adresse: { ligne1: adr?.line1 ?? "", ligne2: adr?.line2 ?? "", ville: adr?.city ?? "", province: adr?.state ?? "", code_postal: adr?.postal_code ?? "", pays: adr?.country ?? "" },
    pays_livraison: adr?.country ?? null,
    mode_livraison: s.shipping_cost?.shipping_rate ? String(s.metadata?.zone ?? "") : null,
    sous_total_cents: s.amount_subtotal ?? 0,
    livraison_cents: s.shipping_cost?.amount_total ?? 0,
    taxes_cents: s.total_details?.amount_tax ?? 0,
    total_cents: s.amount_total ?? 0,
    devise: s.currency ?? "cad",
    statut: "payee",
    stripe_session_id: s.id,
    stripe_payment_intent: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null,
  }).select("id, numero").single();
  if (error) {
    if (error.code === "23505") return; // créée entre-temps par un autre appel
    throw error;
  }

  let manque = false;
  for (const li of s.line_items?.data ?? []) {
    const prod = li.price?.product as Stripe.Product | undefined;
    const m = prod?.metadata ?? {};
    const quantite = li.quantity ?? 1;
    await db.from("lignes_commande").insert({
      commande_id: cmd.id,
      produit_id: m.produit_id || null,
      variante_id: m.variante_id || null,
      sku: m.sku ?? "",
      nom: prod?.name ?? li.description ?? "",
      taille: m.taille ?? "",
      couleur: m.couleur ?? "",
      quantite,
      prix_unitaire_cents: li.price?.unit_amount ?? Math.round((li.amount_subtotal ?? 0) / quantite),
    });
    if (m.variante_id) {
      const { data: manquant } = await db.rpc("enregistrer_vente", { p_variante: m.variante_id, p_quantite: quantite, p_commande: cmd.id });
      if ((manquant as number) > 0) manque = true;
    }
  }
  if (manque) await db.from("commandes").update({ stock_manquant: true, note_interne: "⚠ Stock insuffisant au moment du paiement : vérifier avant expédition." }).eq("id", cmd.id);
  await db.from("evenements_commande").insert({ commande_id: cmd.id, statut: "payee", message: "Paiement confirmé par Stripe" });
  // Phase 5 : e-mail de confirmation au client + alerte à l'administratrice
}

async function marquerRemboursee(paymentIntent: string) {
  const db = supabaseService();
  const { data: c } = await db.from("commandes").select("id, statut").eq("stripe_payment_intent", paymentIntent).maybeSingle();
  if (!c || c.statut === "remboursee") return;
  await db.from("commandes").update({ statut: "remboursee" }).eq("id", c.id);
  await db.rpc("remettre_en_stock", { p_commande: c.id, p_type: "retour" });
  await db.from("evenements_commande").insert({ commande_id: c.id, statut: "remboursee", message: "Remboursement total effectué (Stripe)" });
}
