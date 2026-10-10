"use client";
import { useActionState, useState } from "react";
import { Message } from "./ui";
import type { Resultat } from "@/app/admin/(espace)/actions";

const SUIVANT: Record<string, { v: string; l: string } | undefined> = {
  payee: { v: "en_preparation", l: "En préparation" },
  en_preparation: { v: "expediee", l: "Expédiée" },
  expediee: { v: "livree", l: "Livrée" },
};

export default function StatutCommandeForm({ action, statut, transporteur, numeroSuivi }: {
  action: (p: Resultat | null, fd: FormData) => Promise<Resultat>;
  statut: string;
  transporteur: string | null;
  numeroSuivi: string | null;
}) {
  const [etat, envoyer, enCours] = useActionState(action, null);
  const suivant = SUIVANT[statut];
  const [cible, setCible] = useState(suivant?.v ?? "");
  if (!suivant) return <p className="text-sm text-or-doux">Commande {statut === "livree" ? "livrée ✓" : "clôturée"}.</p>;
  return (
    <form action={envoyer} className="flex flex-col gap-3">
      <input type="hidden" name="statut" value={cible} />
      {cible === "expediee" && (
        <div className="flex flex-wrap gap-3 p-4 border border-dashed border-or-doux">
          <label className="etiquette flex flex-col gap-1.5 grow basis-40">Transporteur
            <select name="transporteur" className="champ" defaultValue={transporteur ?? "Postes Canada"}>
              {["Postes Canada", "Purolator", "UPS", "FedEx", "Autre"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="etiquette flex flex-col gap-1.5 grow-[2] basis-56">N° de suivi
            <input name="numero_suivi" className="champ" required defaultValue={numeroSuivi ?? ""} />
          </label>
        </div>
      )}
      <label className="etiquette flex flex-col gap-1.5">Message (facultatif, ajouté à l&apos;historique)
        <input name="message" className="champ" maxLength={300} />
      </label>
      <Message r={etat} />
      <div className="flex flex-wrap gap-3">
        <button className="btn-or h-12 px-6 text-xs tracking-[.2em] uppercase" disabled={enCours} onClick={() => setCible(suivant.v)}>
          Passer à « {suivant.l} »
        </button>
        <button className="h-12 px-4 border border-erreur text-[#E3A497] text-xs tracking-[.16em] uppercase" disabled={enCours}
          onClick={(e) => { if (!confirm("Annuler cette commande ?")) e.preventDefault(); else setCible("annulee"); }}>
          Annuler
        </button>
      </div>
    </form>
  );
}
