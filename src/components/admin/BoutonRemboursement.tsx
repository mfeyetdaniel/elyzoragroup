"use client";
import { useState, useTransition } from "react";
import { Message } from "./ui";
import type { Resultat } from "@/app/admin/(espace)/actions";

export default function BoutonRemboursement({ action, montant }: { action: () => Promise<Resultat>; montant: string }) {
  const [etat, setEtat] = useState<Resultat | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={enCours}
        onClick={() => { if (confirm(`Rembourser intégralement ${montant} au client ? Cette action est irréversible.`)) demarrer(async () => setEtat(await action())); }}
        className="self-start h-11 px-4 border border-erreur text-[#E3A497] text-xs tracking-[.16em] uppercase">
        {enCours ? "Remboursement…" : `Rembourser ${montant}`}
      </button>
      <Message r={etat} />
    </div>
  );
}
