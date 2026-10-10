import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { Titre } from "@/components/admin/ui";
import FormProduit from "@/components/admin/FormProduit";
import { creerProduit } from "../../actions";

export default async function NouveauProduit() {
  await exigerAdmin();
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="etiquette"><Link href="/admin/produits" className="!text-or-profond">Produits</Link> ✦ Nouveau</nav>
      <Titre sous="Le produit est créé en brouillon. Vous ajouterez ensuite les photos, les variantes et le stock.">Nouveau produit</Titre>
      <section className="border border-or-doux/35 bg-noir-texture p-6 max-w-4xl">
        <FormProduit action={creerProduit} creation />
      </section>
    </>
  );
}
