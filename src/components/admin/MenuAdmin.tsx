"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/produits", label: "Produits & stock" },
  { href: "/admin/commandes", label: "Commandes", badge: true },
  { href: "/admin/import", label: "Import / export" },
  { href: "/admin/journal", label: "Journal" },
];

export default function MenuAdmin({ aTraiter }: { aTraiter: number }) {
  const chemin = usePathname();
  return (
    <>
      {LIENS.map((l) => {
        const actif = l.exact ? chemin === l.href : chemin.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={actif ? "page" : undefined}
            className={`flex items-center gap-3 px-4 min-h-11 text-sm border-l-2 ${actif ? "bg-[#1a1916] text-or-clair border-or" : "text-argent border-transparent hover:bg-[#1a1916] hover:text-or-clair"}`}
          >
            {l.label}
            {l.badge && aTraiter > 0 && (
              <span className="ml-auto bg-or text-noir text-[11px] px-2 rounded-full">{aTraiter}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}
