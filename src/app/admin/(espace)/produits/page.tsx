import Link from "next/link";
import Image from "next/image";
import { exigerAdmin } from "@/lib/admin";
import { Titre, Pastille } from "@/components/admin/ui";
import { BRANCHES, prix } from "@/lib/format";

const PAR_PAGE = 40;
const FILTRES = [
  { v: "", l: "Tous" },
  { v: "publie", l: "Publiés" },
  { v: "brouillon", l: "Brouillons" },
  { v: "sans-prix", l: "Sans prix" },
  { v: "a-verifier", l: "À vérifier" },
  { v: "stock-bas", l: "Stock bas" },
  { v: "archive", l: "Archivés" },
];

type SP = { q?: string; branche?: string; filtre?: string; page?: string };

export default async function ListeProduits({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await exigerAdmin();
  const page = Math.max(1, Number(sp.page) || 1);

  let req = supabase.from("vue_produits_admin").select("*", { count: "exact" });
  const q = (sp.q ?? "").trim().slice(0, 80);
  if (q) req = req.or(`nom.ilike.%${q.replace(/[%,()]/g, "")}%,sku.ilike.%${q.replace(/[%,()]/g, "")}%`);
  if (sp.branche && sp.branche in BRANCHES) req = req.eq("branche", sp.branche);
  switch (sp.filtre) {
    case "publie": case "brouillon": case "archive": req = req.eq("statut", sp.filtre); break;
    case "sans-prix": req = req.is("prix_cents", null).neq("statut", "archive"); break;
    case "a-verifier": req = req.eq("a_verifier", true); break;
    case "stock-bas": req = req.gt("nb_alertes", 0); break;
    default: req = req.neq("statut", "archive");
  }
  const { data, count } = await req.order("sku").range((page - 1) * PAR_PAGE, page * PAR_PAGE - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAR_PAGE));
  const lien = (maj: Partial<SP>) => {
    const u = new URLSearchParams(Object.entries({ ...sp, ...maj }).filter(([, v]) => v) as [string, string][]);
    return `/admin/produits?${u}`;
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Titre sous={`${count ?? 0} produit(s)`}>Produits &amp; stock</Titre>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/admin/import" className="h-11 px-4 flex items-center border border-or-profond text-xs tracking-[.18em] uppercase">Import / export</Link>
          <Link href="/admin/produits/nouveau" className="btn-or h-11 px-5 flex items-center text-xs tracking-[.18em] uppercase">+ Ajouter un produit</Link>
        </div>
      </div>

      <section className="border border-or-doux/35 bg-[#0F0F0E]">
        <form className="flex flex-wrap gap-2.5 p-4 border-b border-or-doux/25 items-center" action="/admin/produits">
          <label className="grow basis-[220px]">
            <span className="sr-only">Rechercher</span>
            <input name="q" defaultValue={q} placeholder="Nom ou SKU…" className="champ" />
          </label>
          <label>
            <span className="sr-only">Branche</span>
            <select name="branche" defaultValue={sp.branche ?? ""} className="champ !w-auto">
              <option value="">Toutes branches</option>
              {Object.entries(BRANCHES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          {sp.filtre && <input type="hidden" name="filtre" value={sp.filtre} />}
          <button className="h-11 px-4 border border-or text-or text-xs tracking-[.18em] uppercase">Rechercher</button>
        </form>
        <nav aria-label="Filtres" className="flex flex-wrap gap-2 px-4 py-3 border-b border-or-doux/25">
          {FILTRES.map((f) => {
            const actif = (sp.filtre ?? "") === f.v;
            return (
              <Link key={f.v} href={lien({ filtre: f.v, page: "" })} aria-current={actif ? "true" : undefined}
                className={`h-9 px-3.5 flex items-center text-xs tracking-[.14em] uppercase border ${actif ? "bg-or text-noir border-or" : "border-[#4A4334] text-argent"}`}>
                {f.l}
              </Link>
            );
          })}
        </nav>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="text-left">
                {["Produit", "SKU", "Branche", "Prix", "Stock", "Statut"].map((h) => (
                  <th key={h} scope="col" className="etiquette font-medium px-3.5 py-3 border-b border-or-doux/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-[#141310] border-b border-or-doux/10">
                  <td className="px-3.5 py-2.5">
                    <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 text-or-clair">
                      {p.image ? <Image src={p.image} alt="" width={40} height={50} className="w-10 h-[50px] object-cover bg-ivoire" /> : <span className="w-10 h-[50px] bg-noir-texture" />}
                      {p.nom}
                    </Link>
                  </td>
                  <td className="px-3.5 text-or-doux tabular-nums">{p.sku}</td>
                  <td className="px-3.5">{BRANCHES[p.branche as keyof typeof BRANCHES]} · {p.categorie}</td>
                  <td className="px-3.5">{p.prix_cents == null ? <span className="text-or-profond">— à saisir</span> : prix(p.prix_cents)}</td>
                  <td className="px-3.5 tabular-nums">
                    {p.stock_total} <span className="text-or-profond">/ {p.nb_variantes} var.</span>
                    {p.nb_alertes > 0 && <span className="ml-2 text-xs text-[#F0B9AD]">⚠ {p.nb_alertes}</span>}
                  </td>
                  <td className="px-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {p.statut === "publie" ? <Pastille ton="ok">Publié</Pastille> : p.statut === "archive" ? <Pastille ton="doux">Archivé</Pastille> : <Pastille ton="doux">Brouillon</Pastille>}
                      {p.a_verifier && <Pastille ton="alerte">Marque à vérifier</Pastille>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data ?? []).length === 0 && <p className="p-6 text-sm text-or-profond">Aucun produit ne correspond.</p>}
        </div>
        {pages > 1 && (
          <nav aria-label="Pagination" className="flex justify-center gap-2 p-4">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={lien({ page: String(n) })} aria-current={n === page ? "page" : undefined}
                className={`w-11 h-11 flex items-center justify-center border ${n === page ? "bg-or text-noir border-or" : "border-or-profond text-argent"}`}>{n}</Link>
            ))}
          </nav>
        )}
      </section>
    </>
  );
}
