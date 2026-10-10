import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { Titre, Tuile, Pastille } from "@/components/admin/ui";
import { date, prix, STATUTS_COMMANDE, type StatutCommande } from "@/lib/format";

export default async function TableauDeBord() {
  const { supabase } = await exigerAdmin();
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const debutMois = new Date(debutJour.getFullYear(), debutJour.getMonth(), 1);

  const [{ data: produits }, { data: cmdMois }, { data: recentes }] = await Promise.all([
    supabase.from("vue_produits_admin").select("statut, stock_total, nb_alertes, prix_cents, a_verifier"),
    supabase.from("commandes").select("total_cents, cree_le, statut").gte("cree_le", debutMois.toISOString()).not("statut", "in", "(annulee,remboursee)"),
    supabase.from("commandes").select("id, numero, nom_client, total_cents, statut, cree_le").order("cree_le", { ascending: false }).limit(6),
  ]);

  const p = produits ?? [];
  const ventesMois = (cmdMois ?? []).reduce((s, c) => s + c.total_cents, 0);
  const ventesJour = (cmdMois ?? []).filter((c) => new Date(c.cree_le) >= debutJour).reduce((s, c) => s + c.total_cents, 0);
  const aTraiter = (cmdMois ?? []).filter((c) => c.statut === "payee" || c.statut === "en_preparation").length;

  return (
    <>
      <Titre sous="Vue d'ensemble de la boutique">Tableau de bord</Titre>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <Tuile label="Ventes du jour" valeur={prix(ventesJour)} />
        <Tuile label="Ventes du mois" valeur={prix(ventesMois)} />
        <Tuile label="Commandes à traiter" valeur={aTraiter} alerte={aTraiter > 0} />
        <Tuile label="Produits publiés" valeur={`${p.filter((x) => x.statut === "publie").length} / ${p.length}`} />
        <Tuile label="Pièces en stock" valeur={p.reduce((s, x) => s + x.stock_total, 0).toLocaleString("fr-CA")} />
        <Tuile label="Alertes réassort" valeur={p.reduce((s, x) => s + x.nb_alertes, 0)} alerte />
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section className="grow basis-[420px] border border-or-doux/35 bg-[#0F0F0E]">
          <div className="flex justify-between items-center p-4 border-b border-or-doux/25">
            <h2 className="etiquette !text-or">Dernières commandes</h2>
            <Link href="/admin/commandes" className="text-xs tracking-[.2em] uppercase">Tout voir</Link>
          </div>
          {(recentes ?? []).length === 0 ? (
            <p className="p-6 text-sm text-or-profond">Aucune commande pour l&apos;instant. Elles apparaîtront ici dès l&apos;ouverture du paiement (Phase 4).</p>
          ) : (
            <ul>
              {recentes!.map((c) => (
                <li key={c.id} className="border-b border-or-doux/10">
                  <Link href={`/admin/commandes/${c.id}`} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-argent hover:bg-[#141310]">
                    <span className="text-or-clair">{c.numero}</span>
                    <span className="text-sm">{c.nom_client}</span>
                    <span className="text-sm">{prix(c.total_cents)}</span>
                    <Pastille>{STATUTS_COMMANDE[c.statut as StatutCommande]}</Pastille>
                    <span className="w-full text-xs text-or-profond">{date(c.cree_le)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="grow basis-[300px] border border-or-doux bg-noir-texture p-5 flex flex-col gap-3 text-sm">
          <h2 className="etiquette !text-or">À faire avant l&apos;ouverture</h2>
          <p>✦ <strong className="text-or-clair">{p.filter((x) => x.prix_cents == null).length}</strong> produits sans prix</p>
          <p>✦ <strong className="text-or-clair">{p.filter((x) => x.a_verifier).length}</strong> produits avec logo de marque à vérifier</p>
          <p>✦ Remplacer le stock fictif par le stock réel (Import / export)</p>
          <Link href="/admin/produits?filtre=sans-prix" className="btn-or self-start mt-2 px-5 py-3 text-xs tracking-[.2em] uppercase">Saisir les prix</Link>
        </section>
      </div>
    </>
  );
}
