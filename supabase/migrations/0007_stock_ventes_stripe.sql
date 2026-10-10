-- Fonctions appelées par le webhook Stripe (clé serveur uniquement)
create function public.enregistrer_vente(p_variante uuid, p_quantite integer, p_commande uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_stock integer; v_retire integer;
begin
  select stock into v_stock from public.variantes where id = p_variante for update;
  if v_stock is null then return p_quantite; end if;
  v_retire := least(v_stock, p_quantite);
  update public.variantes set stock = stock - v_retire where id = p_variante;
  insert into public.mouvements_stock (variante_id, delta, type, motif, stock_apres, commande_id)
  values (p_variante, -v_retire, 'vente', 'Commande payée', v_stock - v_retire, p_commande);
  return p_quantite - v_retire;
end $$;

create function public.remettre_en_stock(p_commande uuid, p_type public.type_mouvement)
returns void language plpgsql security definer set search_path = public as $$
declare l record; v_stock integer;
begin
  if exists (select 1 from public.mouvements_stock where commande_id = p_commande and type in ('retour', 'annulation')) then return; end if;
  for l in select variante_id, quantite from public.lignes_commande where commande_id = p_commande and variante_id is not null loop
    update public.variantes set stock = stock + l.quantite where id = l.variante_id returning stock into v_stock;
    insert into public.mouvements_stock (variante_id, delta, type, motif, stock_apres, commande_id)
    values (l.variante_id, l.quantite, p_type, 'Remise en stock automatique', v_stock, p_commande);
  end loop;
end $$;

revoke execute on function public.enregistrer_vente(uuid, integer, uuid) from public, anon, authenticated;
revoke execute on function public.remettre_en_stock(uuid, public.type_mouvement) from public, anon, authenticated;
grant execute on function public.enregistrer_vente(uuid, integer, uuid) to service_role;
grant execute on function public.remettre_en_stock(uuid, public.type_mouvement) to service_role;

alter table public.commandes add column if not exists pays_livraison text;
alter table public.commandes add column if not exists mode_livraison text;
alter table public.commandes add column if not exists stock_manquant boolean not null default false;
