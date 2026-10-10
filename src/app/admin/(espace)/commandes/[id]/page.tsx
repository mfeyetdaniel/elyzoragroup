import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin";
import { Titre } from "@/components/admin/ui";
import StatutCommandeForm from "@/components/admin/StatutCommandeForm";
import BoutonRemboursement from "@/components/admin/BoutonRemboursement";
import { changerStatutCommande, enregistrerNoteCommande, rembourserCommande } from "../../actions";
import { date, prix, STATUTS_COMMANDE, type StatutCommande } from "@/lib/format";

const ETAPES: StatutCommande[] = ["payee", "en_preparation", "expediee", "livree"];

export default async function DetailCommande({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, admin } = await exigerAdmin();
  const [{ data: c }, { data: lignes }, { data: evts }, { data: notifs }] = await Promise.all([
    supabase.from("commandes").select("*").eq("id", id).maybeSingle(),
    supabase.from("lignes_commande").select("*").eq("commande_id", id),
    supabase.from("evenements_commande").select("*").eq("commande_id", id).order("cree_le"),
    supabase.from("notifications").select("*").eq("commande_id", id).order("cree_le"),
  ]);
  if (!c) notFound();
  const idx = ETAPES.indexOf(c.statut as StatutCommande);
  const a = c.adresse as Record<string, string>;

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="etiquette"><Link href="/admin/commandes" className="!text-or-profond">Commandes</Link> ✦ {c.numero}</nav>
      <Titre sous={`${c.nom_client} · ${c.email} · passée le ${date(c.cree_le)}`}>{c.numero}</Titre>

      {c.stock_manquant && <p role="alert" className="border border-erreur text-[#F0B9AD] p-3 text-sm">⚠ Stock insuffisant au moment du paiement pour au moins un article : vérifiez avant d&apos;expédier (remboursement partiel possible depuis Stripe).</p>}
      <ol className="grid grid-cols-4 gap-2" aria-label="Avancement">
        {ETAPES.map((e, i) => (
          <li key={e} className="flex flex-col gap-2">
            <span className={`h-[3px] ${i <= idx ? "bg-or" : "bg-[#2A2721]"}`} />
            <span className={`text-xs tracking-[.14em] uppercase ${i <= idx ? "text-or-clair" : "text-[#6E6450]"}`}>✦ {STATUTS_COMMANDE[e]}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-6 items-start">
        <section className="grow-[2] basis-[460px] border border-or-doux bg-noir-texture p-6 flex flex-col gap-5">
          <StatutCommandeForm action={changerStatutCommande.bind(null, id)} statut={c.statut} transporteur={c.transporteur} numeroSuivi={c.numero_suivi} />
          {c.url_suivi && <a href={c.url_suivi} target="_blank" rel="noopener noreferrer" className="text-sm underline">Lien de suivi {c.transporteur} ↗</a>}
          <div className="filet-or" />
          <h2 className="etiquette !text-or">Articles</h2>
          <ul className="text-sm flex flex-col gap-2">
            {(lignes ?? []).map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>{l.nom} <span className="text-or-profond">· {l.taille} · {l.couleur} · ×{l.quantite}</span></span>
                <span className="tabular-nums">{prix(l.prix_unitaire_cents * l.quantite)}</span>
              </li>
            ))}
          </ul>
          <dl className="text-sm grid grid-cols-[1fr_auto] gap-y-1 border-t border-or-doux/20 pt-3">
            <dt>Sous-total</dt><dd className="tabular-nums">{prix(c.sous_total_cents)}</dd>
            <dt>Livraison</dt><dd className="tabular-nums">{prix(c.livraison_cents)}</dd>
            <dt>Taxes</dt><dd className="tabular-nums">{prix(c.taxes_cents)}</dd>
            <dt className="text-or">Total</dt><dd className="text-or tabular-nums">{prix(c.total_cents)}</dd>
          </dl>
        </section>
        <aside className="grow basis-[300px] flex flex-col gap-6">
          <section className="border border-or-doux/35 bg-noir-texture p-5 text-sm flex flex-col gap-1">
            <h2 className="etiquette !text-or mb-2">Livraison</h2>
            <span>{c.nom_client}</span>
            <span>{a?.ligne1} {a?.ligne2}</span>
            <span>{a?.ville} {a?.province} {a?.code_postal}</span>
            <span>{a?.pays}</span>
            {c.telephone && <span>{c.telephone}</span>}
          </section>
          <section className="border border-or-doux/35 bg-noir-texture p-5 text-sm flex flex-col gap-2">
            <h2 className="etiquette !text-or mb-1">Historique</h2>
            {(evts ?? []).map((e) => <p key={e.id}><span className="text-or-profond">{date(e.cree_le)}</span> · {e.statut ? STATUTS_COMMANDE[e.statut as StatutCommande] : ""} {e.message}</p>)}
            <h2 className="etiquette !text-or mt-3 mb-1">Notifications</h2>
            {(notifs ?? []).length === 0 ? <p className="text-or-profond">Les e-mails automatiques arrivent en Phase 5.</p> :
              notifs!.map((n) => <p key={n.id}><span className={n.statut === "envoye" ? "text-[#9FC59A]" : "text-[#F0B9AD]"}>{n.statut === "envoye" ? "✓" : "✗"}</span> {n.type} → {n.destinataire}</p>)}
          </section>
          {admin.role === "administrateur" && c.stripe_payment_intent && c.statut !== "remboursee" && (
            <BoutonRemboursement action={rembourserCommande.bind(null, id)} montant={prix(c.total_cents)} />
          )}
          {c.stripe_payment_intent && <p className="text-xs text-or-profond break-all">Paiement Stripe : {c.stripe_payment_intent}</p>}
          <form action={enregistrerNoteCommande.bind(null, id)} className="flex flex-col gap-2">
            <label className="etiquette flex flex-col gap-1.5">Note interne
              <textarea name="note" rows={3} className="champ" defaultValue={c.note_interne} />
            </label>
            <button className="self-start h-10 px-4 border border-or text-or text-xs tracking-[.16em] uppercase">Enregistrer la note</button>
          </form>
        </aside>
      </div>
    </>
  );
}
