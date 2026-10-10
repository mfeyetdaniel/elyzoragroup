import ExcelJS from "exceljs";
import { exigerAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase } = await exigerAdmin();
  const [{ data: produits }, { data: variantes }] = await Promise.all([
    supabase.from("vue_produits_admin").select("id, sku, nom, branche, categorie, sous_categorie, description, prix_cents, statut, a_verifier, stock_total").order("sku"),
    supabase.from("variantes").select("sku, produit_id, taille, couleur, stock, seuil_alerte, prix_cents").order("sku"),
  ]);
  const skuParId = new Map((produits ?? []).map((p) => [p.id, p]));

  const wb = new ExcelJS.Workbook();
  wb.creator = "ÉLYSORA Group";
  const entete = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true, color: { argb: "FFE8CB90" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0A" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };

  const wp = wb.addWorksheet("Produits");
  wp.columns = [
    { header: "SKU", key: "sku", width: 12 }, { header: "Nom du produit", key: "nom", width: 40 },
    { header: "Branche", key: "branche", width: 10 }, { header: "Catégorie", key: "categorie", width: 14 },
    { header: "Sous-catégorie", key: "sous_categorie", width: 20 }, { header: "Description", key: "description", width: 50 },
    { header: "Prix CAD", key: "prix", width: 12 }, { header: "Statut", key: "statut", width: 12 },
    { header: "Marque à vérifier", key: "a_verifier", width: 16 }, { header: "Stock total", key: "stock_total", width: 12 },
  ];
  (produits ?? []).forEach((p) => wp.addRow({ ...p, prix: p.prix_cents == null ? "" : p.prix_cents / 100, a_verifier: p.a_verifier ? "Oui" : "" }));
  wp.getColumn("prix").numFmt = '#,##0.00 "$"';
  entete(wp);

  const wv = wb.addWorksheet("Variantes");
  wv.columns = [
    { header: "SKU variante", key: "sku", width: 26 }, { header: "SKU produit", key: "psku", width: 12 },
    { header: "Produit", key: "nom", width: 36 }, { header: "Taille", key: "taille", width: 9 },
    { header: "Couleur", key: "couleur", width: 18 }, { header: "Stock", key: "stock", width: 9 },
    { header: "Seuil d'alerte", key: "seuil_alerte", width: 13 }, { header: "Prix propre", key: "prix", width: 12 },
  ];
  (variantes ?? []).forEach((v) => {
    const p = skuParId.get(v.produit_id);
    wv.addRow({ ...v, psku: p?.sku ?? "", nom: p?.nom ?? "", prix: v.prix_cents == null ? "" : v.prix_cents / 100 });
  });
  entete(wv);

  const buf = await wb.xlsx.writeBuffer();
  const jour = new Date().toISOString().slice(0, 10);
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="catalogue-elysora-${jour}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
