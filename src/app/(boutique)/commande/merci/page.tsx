import Link from "next/link";
import type { Metadata } from "next";
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase/server";
import { prix } from "@/lib/format";
import ViderPanier from "@/components/boutique/ViderPanier";

export const metadata: Metadata = { title: "Merci pour votre commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Merci({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const id = (await searchParams).session_id ?? "";
  let email = "", total = 0, numero: string | null = null, paye = false;
  if (/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) {
    try {
      const s = await stripe().checkout.sessions.retrieve(id);
      paye = s.payment_status === "paid";
      email = s.customer_details?.email ?? "";
      total = s.amount_total ?? 0;
      const { data } = await supabaseService().from("commandes").select("numero").eq("stripe_session_id", id).maybeSingle();
      numero = data?.numero ?? null;
    } catch { /* session inconnue */ }
  }

  return (
    <main className="max-w-[760px] mx-auto px-6 py-20 text-center flex flex-col items-center gap-6">
      {paye && <ViderPanier />}
      <span aria-hidden="true" className="text-or text-4xl">✦</span>
      <h1 className="font-serif font-medium text-4xl md:text-5xl text-or">{paye ? "Merci pour votre commande" : "Commande introuvable"}</h1>
      {paye ? (
        <>
          <p className="text-lg leading-relaxed">Votre paiement de <strong className="text-or-clair">{prix(total)}</strong> a bien été reçu.
            {email && <> Une confirmation sera envoyée à <strong className="text-or-clair">{email}</strong>.</>}</p>
          <div className="border border-or-doux bg-noir-texture px-8 py-6 flex flex-col gap-2">
            <span className="text-xs tracking-[.26em] uppercase text-or-profond">Numéro de commande</span>
            <span className="font-serif text-3xl text-or-clair">{numero ?? "en cours d'attribution…"}</span>
            {!numero && <span className="text-sm text-or-doux">Actualisez la page dans quelques secondes.</span>}
          </div>
          <p className="text-sm">Conservez ce numéro : il vous permet de <Link href="/suivi">suivre votre commande</Link>.</p>
        </>
      ) : (
        <p>Si vous venez de payer, patientez quelques instants puis actualisez la page.</p>
      )}
      <Link href="/boutique" className="btn-or mt-4 px-8 py-4 text-[13px] tracking-[.25em] uppercase rounded-[2px]">Continuer mes achats</Link>
    </main>
  );
}
