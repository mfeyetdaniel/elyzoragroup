import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin";
import { seDeconnecter } from "./actions";
import MenuAdmin from "@/components/admin/MenuAdmin";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const { supabase, admin, user } = await exigerAdmin();
  const { count: aTraiter } = await supabase
    .from("commandes")
    .select("id", { count: "exact", head: true })
    .in("statut", ["payee", "en_preparation"]);

  return (
    <div className="min-h-screen flex flex-wrap bg-noir">
      <nav aria-label="Administration" className="basis-[220px] grow max-w-[240px] max-md:max-w-none bg-noir-profond border-r border-or-doux/25 py-6 flex flex-col gap-1">
        <Link href="/admin" className="px-5 pb-6 flex items-center gap-3">
          <Image src="/monogramme.png" alt="" width={40} height={39} />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-xl tracking-[.14em] text-or">ÉLYSORA</span>
            <span className="text-[10px] tracking-[.3em] text-or-profond">ADMINISTRATION</span>
          </span>
        </Link>
        <MenuAdmin aTraiter={aTraiter ?? 0} />
        <div className="mt-auto px-5 pt-6 text-xs text-or-profond flex flex-col gap-2">
          <span>{admin.nom || user.email}</span>
          <span>{admin.role === "administrateur" ? "Administrateur" : "Employé"} · 2FA ✓</span>
          <form action={seDeconnecter}>
            <button className="underline text-or-doux hover:text-or-clair">Se déconnecter</button>
          </form>
        </div>
      </nav>
      <main className="basis-[640px] grow-[999] min-w-0 px-6 md:px-8 py-7 pb-12 flex flex-col gap-6">{children}</main>
    </div>
  );
}
