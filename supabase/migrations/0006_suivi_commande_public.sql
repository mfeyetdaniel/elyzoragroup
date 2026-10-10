-- Suivi de commande public : renvoie le statut seulement si n° de commande ET e-mail correspondent.
create function public.suivi_commande(p_numero text, p_email text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'numero', c.numero, 'statut', c.statut, 'cree_le', c.cree_le,
    'transporteur', c.transporteur, 'numero_suivi', c.numero_suivi, 'url_suivi', c.url_suivi,
    'evenements', coalesce((select jsonb_agg(jsonb_build_object('statut', e.statut, 'cree_le', e.cree_le) order by e.cree_le)
                            from public.evenements_commande e where e.commande_id = c.id and e.statut is not null), '[]'::jsonb),
    'articles', coalesce((select jsonb_agg(jsonb_build_object('nom', l.nom, 'taille', l.taille, 'couleur', l.couleur, 'quantite', l.quantite))
                          from public.lignes_commande l where l.commande_id = c.id), '[]'::jsonb))
  from public.commandes c
  where c.numero = upper(trim(p_numero)) and lower(c.email) = lower(trim(p_email))
    and char_length(trim(p_email)) between 5 and 254;
$$;
revoke execute on function public.suivi_commande(text, text) from public;
grant execute on function public.suivi_commande(text, text) to anon, authenticated;
