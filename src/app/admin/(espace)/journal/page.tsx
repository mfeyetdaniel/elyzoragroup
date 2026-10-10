import { exigerAdmin } from "@/lib/admin";
import { Titre } from "@/components/admin/ui";
import { date } from "@/lib/format";

export default async function Journal() {
  const { supabase } = await exigerAdmin();
  const { data } = await supabase.from("journal_admin").select("*").order("cree_le", { ascending: false }).limit(200);
  return (
    <>
      <Titre sous="Les 200 dernières actions réalisées dans l'administration">Journal des modifications</Titre>
      <section className="border border-or-doux/35 bg-[#0F0F0E] p-4 text-sm">
        {(data ?? []).length === 0 ? <p className="text-or-profond">Aucune action enregistrée.</p> : (
          <ul>
            {data!.map((j) => (
              <li key={j.id} className="flex flex-wrap gap-x-4 py-2 border-b border-or-doux/10">
                <span className="text-or-profond w-44">{date(j.cree_le)}</span>
                <span className="text-or w-44">{j.action}</span>
                <span>{j.cible}</span>
                {Object.keys(j.details ?? {}).length > 0 && <span className="text-or-profond">{JSON.stringify(j.details)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
