import "server-only";
import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";

/**
 * Garde d'accès de l'administration : utilisateur connecté + compte admin
 * + double authentification validée (aal2). Redirige sinon.
 */
export async function exigerAdmin() {
  const supabase = await supabaseServeur();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect("/admin/connexion");

  const { data: admin } = await supabase.from("admins").select("nom, role").eq("user_id", u.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/connexion?erreur=non-autorise");
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    redirect(aal?.nextLevel === "aal2" ? "/admin/connexion?etape=code" : "/admin/connexion?etape=activer");
  }

  return { supabase, user: u.user, admin };
}

export async function journaliser(action: string, cible: string, details: Record<string, unknown> = {}) {
  const { supabase, user } = await exigerAdmin();
  await supabase.from("journal_admin").insert({ par: user.id, action, cible, details });
}
