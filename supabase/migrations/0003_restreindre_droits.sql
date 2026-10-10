-- Restreint l'exécution des fonctions internes (recommandation du conseiller de sécurité Supabase)
revoke execute on function public.ajuster_stock(uuid, integer, public.type_mouvement, text) from public, anon;
revoke execute on function public.definir_stock(uuid, integer, text) from public, anon;
revoke execute on function public.est_administrateur() from public, anon;
revoke execute on function public.est_compte_admin() from public, anon;
revoke execute on function public.prochain_numero_commande() from public, anon, authenticated;
-- est_admin() reste exécutable par anon : il est utilisé dans les politiques RLS publiques
-- et ne renvoie que « vrai/faux » pour l'utilisateur courant.
