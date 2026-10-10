import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Client lié à la session de l'utilisateur connecté (respecte la RLS). */
export async function supabaseServeur() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (liste) => {
          try {
            liste.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component : le middleware rafraîchit la session.
          }
        },
      },
    },
  );
}

/**
 * Client « service » : contourne la RLS. À n'utiliser QUE côté serveur, pour
 * les opérations système (webhook Stripe, suivi de commande public).
 */
export function supabaseService() {
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cle) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
