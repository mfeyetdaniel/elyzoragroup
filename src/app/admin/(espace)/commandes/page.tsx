import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { Titre, Pastille } from "@/components/admin/ui";
import { date, prix, STATUTS_COMMANDE, type StatutCommande } from "@/lib/format";

const TON: Record<StatutCommande, "or" | "doux" | "ok" | "alerte" | "bleu"> = {
  payee: "or", en_preparation: "doux", expediee: "bleu", livree: "ok", annulee: "alerte", remboursee: "alerte",
};

export default async function Commandes({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await exigerAdmin();
  let req = supabase.from("commandes").select("id, numero, nom_client, email, total_cents, statut, cree_le, adresse").order("cree_le", { ascending: false }).limit(100);
  if (sp.statut && sp.statut in STATUTS_COMMANDE) req = req.eq("statut", sp.statut);
  const q = (sp.q ?? "").trim().replace(/[%,()]/g, "").slice(0, 80);
  if (q) req = req.or(`numero.ilike.%${q}%,email.ilike.%${q}%,nom_client.ilike.%${q}%`);
  const { data } = await req;

  return (
    <>
      <Titre sous="Les commandes payées arrivent ici automatiquement (Phase 4)">Commandes</Titre>
      <section className="border border-or-doux/35 bg-[#0F0F0E]">
        <form className="flex flex-wrap gap-2.5 p-4 border-b border-or-doux/25">
          <label className="grow basis-[220px]"><span className="sr-only">Rechercher</span><input name="q" defaultValue={q} placeholder="N° de commande, e-mail, nom…" className="champ" /></label>
          <label><span className="sr-only">Statut</span>
            <select name="statut" defaultValue={sp.statut ?? ""} className="champ !w-auto">
              <option value="">Tous statuts</option>
              {Object.entries(STATUTS_COMMANDE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <button className="h-11 px-4 border border-or text-or text-xs tracking-[.18em] uppercase">Filtrer</button>
        </form>
        {(data ?? []).length === 0 ? (
          <p className="p-6 text-sm text-or-profond">Aucune commande.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm border-collapse">
              <thead><tr className="text-left">{["N°", "Date", "Client", "Destination", "Total", "Statut"].map((h) => <th key={h} scope="col" className="etiquette font-medium px-3.5 py-3 border-b border-or-doux/30">{h}</th>)}</tr></thead>
              <tbody>
                {data!.map((c) => (
                  <tr key={c.id} className="border-b border-or-doux/10 hover:bg-[#141310]">
                    <td className="px-3.5 py-3"><Link href={`/admin/commandes/${c.id}`} className="text-or-clair">{c.numero}</Link></td>
                    <td className="px-3.5 text-or-profond">{date(c.cree_le)}</td>
                    <td className="px-3.5">{c.nom_client || c.email}</td>
                    <td className="px-3.5">{(c.adresse as { ville?: string })?.ville ?? "—"}</td>
                    <td className="px-3.5 tabular-nums">{prix(c.total_cents)}</td>
                    <td className="px-3.5"><Pastille ton={TON[c.statut as StatutCommande]}>{STATUTS_COMMANDE[c.statut as StatutCommande]}</Pastille></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
