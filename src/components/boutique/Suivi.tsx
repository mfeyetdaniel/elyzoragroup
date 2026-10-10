"use client";
import { useActionState } from "react";
import { chercherCommande } from "@/app/(boutique)/actions";
import { date, STATUTS_COMMANDE, type StatutCommande } from "@/lib/format";

const ETAPES: StatutCommande[] = ["payee", "en_preparation", "expediee", "livree"];

export default function Suivi() {
  const [etat, envoyer, enCours] = useActionState(chercherCommande, null);
  const s = etat?.suivi;
  const idx = s ? ETAPES.indexOf(s.statut as StatutCommande) : -1;
  const dateEtape = (st: string) => s?.evenements.find((e) => e.statut === st)?.cree_le ?? (st === "payee" ? s?.cree_le : undefined);

  return (
    <>
      <form action={envoyer} className="flex flex-wrap gap-3.5 items-end p-7 border border-or-doux/45 bg-noir-texture">
        <label className="grow basis-[220px] flex flex-col gap-2 text-xs tracking-[.22em] uppercase text-or-doux">N° de commande
          <input name="numero" required placeholder="ELY-2026-0001" className="champ uppercase h-[52px]" autoComplete="off" />
        </label>
        <label className="grow basis-[260px] flex flex-col gap-2 text-xs tracking-[.22em] uppercase text-or-doux">Adresse e-mail
          <input name="email" type="email" required className="champ h-[52px]" autoComplete="email" />
        </label>
        <button className="btn-or h-[54px] px-8 text-[13px] tracking-[.24em] uppercase rounded-[2px]" disabled={enCours}>{enCours ? "Recherche…" : "Rechercher"}</button>
      </form>
      {etat?.erreur && <p role="alert" className="text-center text-[#F0B9AD]">{etat.erreur}</p>}

      {s && (
        <section aria-label={`Commande ${s.numero}`} className="border border-or-doux bg-[radial-gradient(ellipse_at_50%_0%,#1d1b16_0%,#0F0F0E_70%)] p-7 md:p-10 flex flex-col gap-9">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[.26em] uppercase text-or-profond">Commande</span>
              <span className="font-serif text-3xl text-or-clair">{s.numero}</span>
              <span className="text-sm">Passée le {date(s.cree_le)}</span>
            </div>
            <span className="self-start text-[13px] tracking-[.18em] uppercase bg-or text-noir px-3 py-1.5">{STATUTS_COMMANDE[s.statut as StatutCommande]}</span>
          </div>

          {idx >= 0 && (
            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-y-6">
              {ETAPES.map((e, i) => (
                <li key={e} className="relative flex flex-col items-center text-center gap-2.5 px-2">
                  {i < 3 && <span className={`hidden sm:block absolute top-[21px] left-1/2 w-full h-0.5 ${i < idx ? "bg-or" : "bg-[#4A4334]"}`} />}
                  <span className={`relative w-11 h-11 rounded-full flex items-center justify-center text-lg ${i < idx ? "bg-or text-noir" : i === idx ? "bg-noir border-2 border-or text-or shadow-[0_0_24px_rgba(232,203,144,.45)]" : "bg-noir border border-[#4A4334] text-[#6E6450]"}`}>✦</span>
                  <span className={`text-[13px] tracking-[.18em] uppercase ${i <= idx ? "text-or-clair" : "text-or-profond"}`}>{STATUTS_COMMANDE[e]}</span>
                  <span className="text-[13px] text-or-doux">{i <= idx && dateEtape(e) ? date(dateEtape(e)!) : "À venir"}</span>
                </li>
              ))}
            </ol>
          )}

          {s.numero_suivi && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 border border-or-doux/35 bg-noir">
              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-[.24em] uppercase text-or-profond">Transporteur</span>
                <span className="text-or-clair">{s.transporteur} · n° {s.numero_suivi}</span>
              </div>
              {s.url_suivi && <a href={s.url_suivi} target="_blank" rel="noopener noreferrer" className="px-6 py-3.5 border border-or-doux text-xs tracking-[.24em] uppercase">Suivre le colis ↗</a>}
            </div>
          )}

          {s.articles.length > 0 && (
            <ul className="flex flex-col gap-2 text-sm">
              {s.articles.map((a, i) => <li key={i}>✦ {a.nom} <span className="text-or-doux">· {a.taille} · {a.couleur} · ×{a.quantite}</span></li>)}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
