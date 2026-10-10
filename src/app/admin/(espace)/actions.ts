"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import ExcelJS from "exceljs";
import { exigerAdmin } from "@/lib/admin";
import { supabaseServeur } from "@/lib/supabase/server";
import { versCents, type StatutCommande } from "@/lib/format";

export type Resultat = { ok: boolean; message: string };

const texte = (max: number) => z.string().trim().max(max);
const slugifier = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Session ─────────────────────────────────────────────────────────
export async function seDeconnecter() {
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
  redirect("/admin/connexion");
}

// ── Produits ────────────────────────────────────────────────────────
const SchemaProduit = z.object({
  nom: texte(160).min(2, "Nom trop court"),
  branche: z.enum(["mode", "hair", "home"]),
  categorie: texte(60).min(1, "Catégorie requise"),
  sous_categorie: texte(60),
  description: texte(4000),
  prix: texte(20),
  prix_barre: texte(20),
  marque: texte(80),
  a_verifier: z.boolean(),
  statut: z.enum(["brouillon", "publie", "archive"]),
  note_interne: texte(1000),
});

function lireProduit(fd: FormData) {
  return SchemaProduit.parse({
    nom: fd.get("nom") ?? "",
    branche: fd.get("branche"),
    categorie: fd.get("categorie") ?? "",
    sous_categorie: fd.get("sous_categorie") ?? "",
    description: fd.get("description") ?? "",
    prix: fd.get("prix") ?? "",
    prix_barre: fd.get("prix_barre") ?? "",
    marque: fd.get("marque") ?? "",
    a_verifier: fd.get("a_verifier") === "on",
    statut: fd.get("statut") ?? "brouillon",
    note_interne: fd.get("note_interne") ?? "",
  });
}

function messageErreur(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues.map((i) => i.message).join(" · ");
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("publie_avec_prix")) return "Impossible de publier : saisissez d'abord un prix.";
  if (m.includes("publie_verifie")) return "Impossible de publier : l'authenticité de ce produit (logo de marque) doit d'abord être confirmée.";
  if (m.includes("duplicate key")) return "Ce SKU ou cette variante existe déjà.";
  return m;
}

export async function enregistrerProduit(id: string, _p: Resultat | null, fd: FormData): Promise<Resultat> {
  try {
    const { supabase } = await exigerAdmin();
    const d = lireProduit(fd);
    const { error } = await supabase
      .from("produits")
      .update({
        nom: d.nom,
        branche: d.branche,
        categorie: d.categorie,
        sous_categorie: d.sous_categorie,
        description: d.description,
        prix_cents: versCents(d.prix),
        prix_barre_cents: versCents(d.prix_barre),
        marque: d.marque,
        a_verifier: d.a_verifier,
        statut: d.statut,
        note_interne: d.note_interne,
      })
      .eq("id", id);
    if (error) throw error;
    await journal(supabase, "produit.modifie", id, { statut: d.statut });
    revalidatePath("/admin/produits");
    revalidatePath(`/admin/produits/${id}`);
    return { ok: true, message: "Produit enregistré ✓" };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function creerProduit(_p: Resultat | null, fd: FormData): Promise<Resultat> {
  let nouvelId = "";
  try {
    const { supabase } = await exigerAdmin();
    const d = lireProduit(fd);
    const sku = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, "SKU : lettres, chiffres et tirets uniquement").parse(fd.get("sku") ?? "");
    const { data, error } = await supabase
      .from("produits")
      .insert({
        sku,
        slug: `${slugifier(d.nom)}-${sku.toLowerCase()}`,
        nom: d.nom,
        branche: d.branche,
        categorie: d.categorie,
        sous_categorie: d.sous_categorie,
        description: d.description,
        prix_cents: versCents(d.prix),
        prix_barre_cents: versCents(d.prix_barre),
        marque: d.marque,
        a_verifier: d.a_verifier,
        statut: "brouillon",
        note_interne: d.note_interne,
      })
      .select("id")
      .single();
    if (error) throw error;
    nouvelId = data.id;
    await journal(supabase, "produit.cree", sku);
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${nouvelId}`);
}

export async function supprimerProduit(id: string) {
  const { supabase, admin } = await exigerAdmin();
  if (admin.role !== "administrateur") throw new Error("Réservé aux administrateurs");
  // On archive plutôt que supprimer : l'historique des commandes reste intact.
  await supabase.from("produits").update({ statut: "archive" }).eq("id", id);
  await journal(supabase, "produit.archive", id);
  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

// ── Stock ───────────────────────────────────────────────────────────
export async function ajusterStock(varianteId: string, delta: number, motif = ""): Promise<Resultat & { stock?: number }> {
  try {
    const { supabase } = await exigerAdmin();
    const d = z.number().int().min(-1000).max(1000).refine((n) => n !== 0).parse(delta);
    const { data, error } = await supabase.rpc("ajuster_stock", {
      p_variante: z.string().uuid().parse(varianteId),
      p_delta: d,
      p_type: d > 0 ? "reassort" : "correction",
      p_motif: texte(300).parse(motif) || (d > 0 ? "Ajout manuel" : "Retrait manuel"),
    });
    if (error) throw error;
    revalidatePath("/admin/produits", "layout");
    return { ok: true, message: "Stock mis à jour", stock: data as number };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function definirStock(varianteId: string, valeur: number): Promise<Resultat & { stock?: number }> {
  try {
    const { supabase } = await exigerAdmin();
    const { data, error } = await supabase.rpc("definir_stock", {
      p_variante: z.string().uuid().parse(varianteId),
      p_stock: z.number().int().min(0).max(100000).parse(valeur),
      p_motif: "Inventaire",
    });
    if (error) throw error;
    revalidatePath("/admin/produits", "layout");
    return { ok: true, message: "Stock mis à jour", stock: data as number };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function ajouterVariante(produitId: string, _p: Resultat | null, fd: FormData): Promise<Resultat> {
  try {
    const { supabase } = await exigerAdmin();
    const taille = texte(20).min(1).parse(fd.get("taille") ?? "Unique");
    const couleur = texte(40).min(1).parse(fd.get("couleur") ?? "—");
    const stock = z.coerce.number().int().min(0).max(100000).parse(fd.get("stock") || 0);
    const seuil = z.coerce.number().int().min(0).max(1000).parse(fd.get("seuil") || 2);
    const { data: p } = await supabase.from("produits").select("sku").eq("id", produitId).single();
    if (!p) throw new Error("Produit introuvable");
    const code = couleur.normalize("NFKD").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "UNI";
    const { data: v, error } = await supabase
      .from("variantes")
      .insert({ produit_id: produitId, sku: `${p.sku}-${taille.replace(/"/g, "")}-${code}`, taille, couleur, stock: 0, seuil_alerte: seuil })
      .select("id")
      .single();
    if (error) throw error;
    if (stock > 0) await supabase.rpc("ajuster_stock", { p_variante: v.id, p_delta: stock, p_type: "reassort", p_motif: "Stock initial" });
    revalidatePath(`/admin/produits/${produitId}`);
    return { ok: true, message: `Variante ${taille} · ${couleur} ajoutée ✓` };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function modifierSeuil(varianteId: string, seuil: number) {
  const { supabase } = await exigerAdmin();
  await supabase.from("variantes").update({ seuil_alerte: z.number().int().min(0).max(1000).parse(seuil) }).eq("id", varianteId);
  revalidatePath("/admin/produits", "layout");
}

export async function basculerVariante(varianteId: string, actif: boolean) {
  const { supabase } = await exigerAdmin();
  await supabase.from("variantes").update({ actif }).eq("id", varianteId);
  revalidatePath("/admin/produits", "layout");
}

// ── Photos ──────────────────────────────────────────────────────────
const TYPES_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function televerserImages(produitId: string, _p: Resultat | null, fd: FormData): Promise<Resultat> {
  try {
    const { supabase } = await exigerAdmin();
    const fichiers = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    if (!fichiers.length) throw new Error("Choisissez au moins une photo");
    const { data: dernieres } = await supabase.from("images_produit").select("position").eq("produit_id", produitId).order("position", { ascending: false }).limit(1);
    let pos = (dernieres?.[0]?.position ?? -1) + 1;
    const { data: p } = await supabase.from("produits").select("nom").eq("id", produitId).single();
    for (const f of fichiers) {
      if (!TYPES_IMAGE.includes(f.type)) throw new Error(`${f.name} : format non accepté (JPG, PNG, WebP, AVIF)`);
      if (f.size > 8 * 1024 * 1024) throw new Error(`${f.name} : 8 Mo maximum`);
      const ext = f.type.split("/")[1].replace("jpeg", "jpg");
      const chemin = `${produitId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("produits").upload(chemin, f, { contentType: f.type, cacheControl: "31536000" });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("produits").getPublicUrl(chemin);
      await supabase.from("images_produit").insert({ produit_id: produitId, url: pub.publicUrl, chemin_stockage: chemin, alt: p?.nom ?? "", position: pos++ });
    }
    revalidatePath(`/admin/produits/${produitId}`);
    return { ok: true, message: `${fichiers.length} photo(s) ajoutée(s) ✓` };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function supprimerImage(imageId: string, produitId: string) {
  const { supabase } = await exigerAdmin();
  const { data: img } = await supabase.from("images_produit").select("chemin_stockage").eq("id", imageId).single();
  if (img?.chemin_stockage) await supabase.storage.from("produits").remove([img.chemin_stockage]);
  await supabase.from("images_produit").delete().eq("id", imageId);
  revalidatePath(`/admin/produits/${produitId}`);
}

export async function definirImagePrincipale(imageId: string, produitId: string) {
  const { supabase } = await exigerAdmin();
  const { data: imgs } = await supabase.from("images_produit").select("id").eq("produit_id", produitId).order("position");
  const ordre = [imageId, ...(imgs ?? []).map((i) => i.id).filter((i) => i !== imageId)];
  for (let i = 0; i < ordre.length; i++) await supabase.from("images_produit").update({ position: i }).eq("id", ordre[i]);
  revalidatePath(`/admin/produits/${produitId}`);
}

// ── Commandes ───────────────────────────────────────────────────────
const SUIVI: Record<string, (n: string) => string> = {
  "Postes Canada": (n) => `https://www.canadapost-postescanada.ca/track-reperage/fr#/search?searchFor=${encodeURIComponent(n)}`,
  Purolator: (n) => `https://www.purolator.com/fr/expedition/suivi?pin=${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?loc=fr_CA&tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
};

export async function changerStatutCommande(commandeId: string, _p: Resultat | null, fd: FormData): Promise<Resultat> {
  try {
    const { supabase, user } = await exigerAdmin();
    const statut = z.enum(["payee", "en_preparation", "expediee", "livree", "annulee"]).parse(fd.get("statut")) as StatutCommande;
    const maj: Record<string, unknown> = { statut };
    if (statut === "expediee") {
      const transporteur = z.enum(["Postes Canada", "Purolator", "UPS", "FedEx", "Autre"]).parse(fd.get("transporteur"));
      const numero = texte(60).min(4, "Numéro de suivi requis").parse(fd.get("numero_suivi") ?? "");
      maj.transporteur = transporteur;
      maj.numero_suivi = numero;
      maj.url_suivi = SUIVI[transporteur]?.(numero) ?? null;
    }
    const { error } = await supabase.from("commandes").update(maj).eq("id", commandeId);
    if (error) throw error;
    await supabase.from("evenements_commande").insert({ commande_id: commandeId, statut, message: texte(300).parse(fd.get("message") ?? ""), par: user.id });
    // Phase 5 : envoi automatique de l'e-mail au client ici.
    revalidatePath("/admin/commandes", "layout");
    return { ok: true, message: "Statut mis à jour ✓" };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function enregistrerNoteCommande(commandeId: string, fd: FormData) {
  const { supabase } = await exigerAdmin();
  await supabase.from("commandes").update({ note_interne: texte(2000).parse(fd.get("note") ?? "") }).eq("id", commandeId);
  revalidatePath(`/admin/commandes/${commandeId}`);
}

// ── Import Excel ────────────────────────────────────────────────────
export async function importerCatalogue(_p: Resultat | null, fd: FormData): Promise<Resultat> {
  try {
    const { supabase } = await exigerAdmin();
    const f = fd.get("fichier");
    if (!(f instanceof File) || !f.size) throw new Error("Choisissez un fichier Excel (.xlsx)");
    if (f.size > 5 * 1024 * 1024) throw new Error("Fichier trop volumineux (5 Mo max)");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await f.arrayBuffer());

    const lignes = (nom: string) => {
      const ws = wb.getWorksheet(nom);
      if (!ws) return [];
      const entetes: string[] = [];
      ws.getRow(1).eachCell((c, i) => (entetes[i] = String(c.value ?? "").trim()));
      const res: Record<string, string>[] = [];
      ws.eachRow((row, n) => {
        if (n === 1) return;
        const o: Record<string, string> = {};
        row.eachCell({ includeEmpty: true }, (c, i) => {
          const v = c.value as unknown;
          const val = v && typeof v === "object" && "result" in (v as object) ? (v as { result: unknown }).result : v;
          o[entetes[i]] = val == null ? "" : String(val).trim();
        });
        res.push(o);
      });
      return res;
    };

    // Produits : on met à jour prix, nom et description des SKU existants
    let nbPrix = 0;
    for (const l of lignes("Produits")) {
      const sku = l["SKU"];
      if (!sku) continue;
      const maj: Record<string, unknown> = {};
      const prix = l["Prix CAD (à remplir)"] ?? l["Prix CAD"];
      if (prix) { maj.prix_cents = versCents(prix); nbPrix++; }
      if (l["Nom du produit"]) maj.nom = l["Nom du produit"].slice(0, 160);
      if (l["Description"]) maj.description = l["Description"].slice(0, 4000);
      if (Object.keys(maj).length) await supabase.from("produits").update(maj).eq("sku", sku);
    }

    // Variantes : le stock du fichier devient le stock réel (tracé en « correction »)
    let nbStock = 0;
    const { data: vs } = await supabase.from("variantes").select("id, sku, stock");
    const parSku = new Map((vs ?? []).map((v) => [v.sku, v]));
    for (const l of lignes("Variantes")) {
      const v = parSku.get(l["SKU variante"]);
      const s = Number(l["Stock (fictif)"] ?? l["Stock"]);
      if (!v || !Number.isInteger(s) || s < 0 || s === v.stock) continue;
      const { error } = await supabase.rpc("definir_stock", { p_variante: v.id, p_stock: s, p_motif: "Import Excel" });
      if (!error) nbStock++;
    }
    await journal(supabase, "catalogue.import", f.name, { nbPrix, nbStock });
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Import terminé ✓ ${nbPrix} prix et ${nbStock} stocks mis à jour.` };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

// ── Journal ─────────────────────────────────────────────────────────
async function journal(
  supabase: Awaited<ReturnType<typeof supabaseServeur>>,
  action: string,
  cible: string,
  details: Record<string, unknown> = {},
) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("journal_admin").insert({ par: data.user?.id, action, cible, details });
}
