"use client";
import { useActionState } from "react";
import { Message } from "./ui";
import { importerCatalogue } from "@/app/admin/(espace)/actions";

export default function FormImport() {
  const [etat, envoyer, enCours] = useActionState(importerCatalogue, null);
  return (
    <form action={envoyer} className="flex flex-col gap-3">
      <input type="file" name="fichier" required accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        aria-label="Fichier Excel à importer"
        className="text-sm file:mr-3 file:h-10 file:px-4 file:border file:border-or file:bg-transparent file:text-or file:uppercase file:text-xs file:tracking-[.14em]" />
      <button className="btn-or self-start h-11 px-5 text-xs tracking-[.18em] uppercase" disabled={enCours}>{enCours ? "Import en cours…" : "Importer"}</button>
      <Message r={etat} />
    </form>
  );
}
