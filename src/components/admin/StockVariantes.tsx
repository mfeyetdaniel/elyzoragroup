"use client";
import { useState, useTransition } from "react";
import { ajusterStock, definirStock, modifierSeuil, basculerVariante } from "@/app/admin/(espace)/actions";

type V = { id: string; sku: string; taille: string; couleur: string; stock: number; seuil_alerte: number; actif: boolean };

export default function StockVariantes({ variantes }: { variantes: V[] }) {
  const [liste, setListe] = useState(variantes);
  const [erreur, setErreur] = useState("");
  const [enCours, demarrer] = useTransition();

  const maj = (id: string, stock: number) => setListe((l) => l.map((v) => (v.id === id ? { ...v, stock } : v)));

  function delta(v: V, d: number) {
    setErreur("");
    demarrer(async () => {
      const r = await ajusterStock(v.id, d);
      if (r.ok && r.stock != null) maj(v.id, r.stock);
      else setErreur(r.message);
    });
  }

  function fixer(v: V, valeur: string) {
    const n = Number(valeur);
    if (!Number.isInteger(n) || n < 0 || n === v.stock) return;
    setErreur("");
    demarrer(async () => {
      const r = await definirStock(v.id, n);
      if (r.ok && r.stock != null) maj(v.id, r.stock);
      else setErreur(r.message);
    });
  }

  const total = liste.reduce((s, v) => s + v.stock, 0);
  const btn = "w-9 h-9 border border-or-profond text-or text-lg leading-none disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3">
      <p className="etiquette">Stock par variante · total <span className="text-or-clair">{total}</span>{enCours && " · enregistrement…"}</p>
      {erreur && <p role="alert" className="text-sm text-[#F0B9AD]">{erreur}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm border-collapse">
          <thead>
            <tr className="text-left">
              {["Taille", "Couleur", "Stock", "Alerte si ≤", "En vente"].map((h) => <th key={h} scope="col" className="etiquette font-medium py-2 pr-3 border-b border-or-doux/25">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {liste.map((v) => (
              <tr key={v.id} className={`border-b border-or-doux/10 ${v.actif ? "" : "opacity-50"}`}>
                <td className="py-2 pr-3 text-or">{v.taille}</td>
                <td className="py-2 pr-3">{v.couleur}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className={btn} disabled={enCours || v.stock === 0} onClick={() => delta(v, -1)} aria-label={`Retirer 1 — ${v.taille} ${v.couleur}`}>−</button>
                    <input
                      key={v.stock}
                      defaultValue={v.stock}
                      inputMode="numeric"
                      aria-label={`Stock ${v.taille} ${v.couleur}`}
                      className={`w-14 h-9 text-center bg-noir border tabular-nums ${v.stock <= v.seuil_alerte ? "border-erreur text-[#F0B9AD]" : "border-or-profond text-or-clair"}`}
                      onBlur={(e) => fixer(v, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    />
                    <button type="button" className={btn} disabled={enCours} onClick={() => delta(v, 1)} aria-label={`Ajouter 1 — ${v.taille} ${v.couleur}`}>+</button>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <input
                    defaultValue={v.seuil_alerte}
                    inputMode="numeric"
                    aria-label={`Seuil d'alerte ${v.taille} ${v.couleur}`}
                    className="w-12 h-9 text-center bg-noir border border-or-profond/60"
                    onBlur={(e) => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 0 && n !== v.seuil_alerte) demarrer(() => modifierSeuil(v.id, n)); }}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input type="checkbox" defaultChecked={v.actif} className="w-4 h-4 accent-[#E8CB90]" aria-label={`Variante ${v.taille} ${v.couleur} en vente`}
                    onChange={(e) => demarrer(() => basculerVariante(v.id, e.target.checked))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-or-profond">Chaque modification est tracée dans l&apos;historique ci-dessous. Tapez un nombre puis Entrée pour un inventaire.</p>
    </div>
  );
}
