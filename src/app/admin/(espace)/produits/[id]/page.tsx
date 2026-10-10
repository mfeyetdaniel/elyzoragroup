import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin";
import { Titre, Pastille } from "@/components/admin/ui";
import FormProduit from "@/components/admin/FormProduit";
import StockVariantes from "@/components/admin/StockVariantes";
import AjoutVariante from "@/components/admin/AjoutVariante";
import Photos from "@/components/admin/Photos";
import { enregistrerProduit, ajouterVariante, televerserImages, supprimerProduit } from "../../actions";
import { date } from "@/lib/format";

const TYPES: Record<string, string> = { vente: "Vente", retour: "Retour", reassort: "Réassort", correction: "Correction", annulation: "Annulation", import: "Import" };

export default async function FicheProduit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, admin } = await exigerAdmin();

  const [{ data: p }, { data: variantes }, { data: images }] = await Promise.all([
    supabase.from("produits").select("*").eq("id", id).maybeSingle(),
    supabase.from("variantes").select("id, sku, taille, couleur, stock, seuil_alerte, actif").eq("produit_id", id).order("taille").order("couleur"),
    supabase.from("images_produit").select("id, url, alt, position").eq("produit_id", id).order("position"),
  ]);
  if (!p) notFound();
  const ids = (variantes ?? []).map((v) => v.id);
  const { data: mouvements } = ids.length
    ? await supabase.from("mouvements_stock").select("id, delta, type, motif, stock_apres, cree_le, variante_id").in("variante_id", ids).order("cree_le", { ascending: false }).limit(15)
    : { data: [] };
  const nomVar = new Map((variantes ?? []).map((v) => [v.id, `${v.taille} · ${v.couleur}`]));

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="etiquette"><Link href="/admin/produits" className="!text-or-profond">Produits</Link> ✦ {p.sku}</nav>
      <div className="flex flex-wrap justify-between items-start gap-4">
        <Titre sous={`${p.sku} · mis à jour le ${date(p.maj_le)}`}>{p.nom}</Titre>
        <div className="flex flex-wrap gap-2">
          {p.statut === "publie" ? <Pastille ton="ok">Publié</Pastille> : <Pastille ton="doux">{p.statut === "archive" ? "Archivé" : "Brouillon"}</Pastille>}
          {p.a_verifier && <Pastille ton="alerte">Marque à vérifier</Pastille>}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <section aria-label="Informations" className="grow-[3] basis-[520px] min-w-0 border border-or-doux/35 bg-noir-texture p-6">
          <FormProduit action={enregistrerProduit.bind(null, id)} produit={p} />
        </section>
        <section aria-label="Photos" className="grow-[2] basis-[340px] min-w-0 border border-or-doux/35 bg-noir-texture p-6 flex flex-col gap-3">
          <h2 className="etiquette !text-or">Photos</h2>
          <Photos produitId={id} images={images ?? []} action={televerserImages.bind(null, id)} />
        </section>
      </div>

      <section aria-label="Stock" className="border border-or-doux bg-noir-texture p-6 flex flex-col gap-5">
        <h2 className="etiquette !text-or">Variantes &amp; stock</h2>
        <StockVariantes key={ids.join()} variantes={variantes ?? []} />
        <div className="filet-or" />
        <AjoutVariante action={ajouterVariante.bind(null, id)} />
      </section>

      <section aria-label="Historique" className="border border-or-doux/35 bg-[#0F0F0E] p-6 flex flex-col gap-3">
        <h2 className="etiquette !text-or">Historique des mouvements</h2>
        {(mouvements ?? []).length === 0 ? <p className="text-sm text-or-profond">Aucun mouvement pour l&apos;instant.</p> : (
          <ul className="text-sm flex flex-col">
            {mouvements!.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2 border-b border-or-doux/10">
                <span className="text-or-profond w-44">{date(m.cree_le)}</span>
                <span className="w-28">{TYPES[m.type] ?? m.type}</span>
                <span className="w-32 text-or">{nomVar.get(m.variante_id)}</span>
                <span className={`w-12 tabular-nums ${m.delta > 0 ? "text-[#9FC59A]" : "text-[#F0B9AD]"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</span>
                <span className="text-or-profond">→ {m.stock_apres}</span>
                {m.motif && <span className="text-or-profond">· {m.motif}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {admin.role === "administrateur" && p.statut !== "archive" && (
        <form action={supprimerProduit.bind(null, id)}>
          <button className="text-xs underline text-[#E3A497]">Archiver ce produit (le retirer du site sans perdre l&apos;historique)</button>
        </form>
      )}
    </>
  );
}
