import { exigerAdmin } from "@/lib/admin";
import { Titre } from "@/components/admin/ui";
import FormImport from "@/components/admin/FormImport";

export default async function ImportExport() {
  await exigerAdmin();
  return (
    <>
      <Titre sous="Mettez à jour prix et stock en masse depuis Excel">Import / export</Titre>
      <div className="flex flex-wrap gap-6 items-start">
        <section className="grow basis-[340px] border border-or-doux bg-noir-texture p-6 flex flex-col gap-4 text-sm leading-relaxed">
          <h2 className="etiquette !text-or">1 · Exporter</h2>
          <p>Téléchargez le catalogue actuel (produits + variantes avec leur stock réel).</p>
          <a href="/admin/export" className="btn-or self-start h-11 px-5 flex items-center text-xs tracking-[.18em] uppercase">Télécharger le fichier Excel</a>
        </section>
        <section className="grow basis-[340px] border border-or-doux bg-noir-texture p-6 flex flex-col gap-4 text-sm leading-relaxed">
          <h2 className="etiquette !text-or">2 · Importer</h2>
          <ul className="flex flex-col gap-1.5">
            <li>✦ Onglet <strong>Produits</strong> : colonne <em>Prix CAD</em> (ex. 89,90), nom et description.</li>
            <li>✦ Onglet <strong>Variantes</strong> : colonne <em>Stock</em> = quantité réelle en boutique.</li>
            <li>✦ Les lignes sont reconnues par leur <strong>SKU</strong> : ne modifiez pas cette colonne.</li>
            <li>✦ Chaque changement de stock est tracé dans l&apos;historique.</li>
          </ul>
          <FormImport />
        </section>
      </div>
    </>
  );
}
