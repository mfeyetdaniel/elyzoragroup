-- ═══════════════════════════════════════════════════════════════════
--  ÉLYSORA Group — schéma de base (Phase 2)
--  À exécuter une seule fois dans Supabase › SQL Editor.
--  Tables : admins, produits, variantes, images, mouvements de stock,
--           commandes, lignes, événements, notifications, journal admin.
--  Sécurité : Row Level Security sur TOUTES les tables.
--  L'administration exige un compte admin ET la double authentification (aal2).
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Types ───────────────────────────────────────────────────────────
do $$ begin
  create type public.branche_t as enum ('mode', 'hair', 'home');
  create type public.statut_produit as enum ('brouillon', 'publie', 'archive');
  create type public.role_admin as enum ('administrateur', 'employe');
  create type public.statut_commande as enum ('payee', 'en_preparation', 'expediee', 'livree', 'annulee', 'remboursee');
  create type public.type_mouvement as enum ('vente', 'retour', 'reassort', 'correction', 'annulation', 'import');
exception when duplicate_object then null; end $$;

-- ── Utilitaire : date de mise à jour ────────────────────────────────
create or replace function public.maj_horodatage() returns trigger
language plpgsql as $$
begin
  new.maj_le := now();
  return new;
end $$;

-- ── Administrateurs ─────────────────────────────────────────────────
create table if not exists public.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  nom       text not null default '',
  role      public.role_admin not null default 'employe',
  cree_le   timestamptz not null default now()
);

-- Compte admin connecté AVEC double authentification
create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid())
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.est_administrateur() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'administrateur')
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- Compte admin (même sans 2FA encore) — sert uniquement à l'écran d'activation 2FA
create or replace function public.est_compte_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ── Produits ────────────────────────────────────────────────────────
create table if not exists public.produits (
  id                uuid primary key default gen_random_uuid(),
  sku               text not null unique,
  slug              text not null unique,
  nom               text not null check (char_length(nom) between 2 and 160),
  branche           public.branche_t not null,
  categorie         text not null,
  sous_categorie    text not null default '',
  description       text not null default '',
  prix_cents        integer check (prix_cents is null or prix_cents >= 0),
  prix_barre_cents  integer check (prix_barre_cents is null or prix_barre_cents >= 0),
  marque            text not null default '',
  a_verifier        boolean not null default false,  -- logo de marque tierce : authenticité à prouver
  statut            public.statut_produit not null default 'brouillon',
  note_interne      text not null default '',
  cree_le           timestamptz not null default now(),
  maj_le            timestamptz not null default now(),
  -- Un produit publié doit avoir un prix et ne pas être en attente de vérification
  constraint publie_avec_prix check (statut <> 'publie' or (prix_cents is not null and prix_cents > 0)),
  constraint publie_verifie  check (statut <> 'publie' or a_verifier = false)
);
create index if not exists produits_branche_idx on public.produits (branche, categorie);
create index if not exists produits_statut_idx on public.produits (statut);
drop trigger if exists produits_maj on public.produits;
create trigger produits_maj before update on public.produits for each row execute function public.maj_horodatage();

-- ── Variantes (taille × couleur) ────────────────────────────────────
create table if not exists public.variantes (
  id            uuid primary key default gen_random_uuid(),
  produit_id    uuid not null references public.produits (id) on delete cascade,
  sku           text not null unique,
  taille        text not null default 'Unique',
  couleur       text not null default '—',
  stock         integer not null default 0 check (stock >= 0),
  seuil_alerte  integer not null default 2 check (seuil_alerte >= 0),
  actif         boolean not null default true,
  maj_le        timestamptz not null default now(),
  unique (produit_id, taille, couleur)
);
create index if not exists variantes_produit_idx on public.variantes (produit_id);
drop trigger if exists variantes_maj on public.variantes;
create trigger variantes_maj before update on public.variantes for each row execute function public.maj_horodatage();

-- ── Images ──────────────────────────────────────────────────────────
create table if not exists public.images_produit (
  id          uuid primary key default gen_random_uuid(),
  produit_id  uuid not null references public.produits (id) on delete cascade,
  url         text not null,           -- /produits/xxx.webp (site) ou URL publique Supabase Storage
  chemin_stockage text,                -- chemin dans le bucket « produits » si téléversée
  alt         text not null default '',
  position    integer not null default 0
);
create index if not exists images_produit_idx on public.images_produit (produit_id, position);

-- ── Mouvements de stock (historique) ────────────────────────────────
create table if not exists public.mouvements_stock (
  id           bigint generated always as identity primary key,
  variante_id  uuid not null references public.variantes (id) on delete cascade,
  delta        integer not null,
  type         public.type_mouvement not null,
  motif        text not null default '',
  stock_apres  integer not null,
  commande_id  uuid,
  par          uuid references auth.users (id) on delete set null,
  cree_le      timestamptz not null default now()
);
create index if not exists mouvements_variante_idx on public.mouvements_stock (variante_id, cree_le desc);

-- ── Commandes ───────────────────────────────────────────────────────
create sequence if not exists public.numero_commande_seq;

create or replace function public.prochain_numero_commande() returns text
language sql volatile as $$
  select 'ELY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.numero_commande_seq')::text, 4, '0');
$$;

create table if not exists public.commandes (
  id                    uuid primary key default gen_random_uuid(),
  numero                text not null unique default public.prochain_numero_commande(),
  email                 text not null,
  nom_client            text not null default '',
  telephone             text not null default '',
  adresse               jsonb not null default '{}'::jsonb,
  sous_total_cents      integer not null default 0,
  livraison_cents       integer not null default 0,
  taxes_cents           integer not null default 0,
  total_cents           integer not null default 0,
  devise                text not null default 'cad',
  statut                public.statut_commande not null default 'payee',
  stripe_session_id     text unique,
  stripe_payment_intent text,
  transporteur          text,
  numero_suivi          text,
  url_suivi             text,
  accepte_notifications boolean not null default true,
  note_interne          text not null default '',
  cree_le               timestamptz not null default now(),
  maj_le                timestamptz not null default now()
);
create index if not exists commandes_statut_idx on public.commandes (statut, cree_le desc);
create index if not exists commandes_email_idx on public.commandes (lower(email));
drop trigger if exists commandes_maj on public.commandes;
create trigger commandes_maj before update on public.commandes for each row execute function public.maj_horodatage();

create table if not exists public.lignes_commande (
  id                   uuid primary key default gen_random_uuid(),
  commande_id          uuid not null references public.commandes (id) on delete cascade,
  produit_id           uuid references public.produits (id) on delete set null,
  variante_id          uuid references public.variantes (id) on delete set null,
  sku                  text not null,
  nom                  text not null,
  taille               text not null default '',
  couleur              text not null default '',
  quantite             integer not null check (quantite > 0),
  prix_unitaire_cents  integer not null check (prix_unitaire_cents >= 0)
);
create index if not exists lignes_commande_idx on public.lignes_commande (commande_id);

create table if not exists public.evenements_commande (
  id           bigint generated always as identity primary key,
  commande_id  uuid not null references public.commandes (id) on delete cascade,
  statut       public.statut_commande,
  message      text not null default '',
  par          uuid references auth.users (id) on delete set null,
  cree_le      timestamptz not null default now()
);
create index if not exists evenements_commande_idx on public.evenements_commande (commande_id, cree_le);

create table if not exists public.notifications (
  id            bigint generated always as identity primary key,
  commande_id   uuid references public.commandes (id) on delete cascade,
  destinataire  text not null,
  type          text not null,          -- confirmation, preparation, expedition, livraison, remboursement, admin_nouvelle_commande, stock_bas…
  canal         text not null default 'email',
  statut        text not null default 'envoye',
  erreur        text,
  cree_le       timestamptz not null default now()
);

-- ── Journal des actions admin ───────────────────────────────────────
create table if not exists public.journal_admin (
  id       bigint generated always as identity primary key,
  par      uuid references auth.users (id) on delete set null,
  action   text not null,
  cible    text not null default '',
  details  jsonb not null default '{}'::jsonb,
  cree_le  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════
--  Fonctions métier
-- ═══════════════════════════════════════════════════════════════════

-- Ajustement de stock atomique (+ historique). Réservé aux admins (2FA).
create or replace function public.ajuster_stock(
  p_variante uuid, p_delta integer, p_type public.type_mouvement, p_motif text default ''
) returns integer
language plpgsql security definer set search_path = public as $$
declare v_stock integer;
begin
  if not public.est_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.variantes
     set stock = stock + p_delta
   where id = p_variante
  returning stock into v_stock;
  if v_stock is null then raise exception 'Variante introuvable'; end if;
  if v_stock < 0 then raise exception 'Le stock ne peut pas être négatif'; end if;
  insert into public.mouvements_stock (variante_id, delta, type, motif, stock_apres, par)
  values (p_variante, p_delta, p_type, left(coalesce(p_motif, ''), 300), v_stock, auth.uid());
  return v_stock;
end $$;

-- Fixer le stock à une valeur (inventaire). Réservé aux admins.
create or replace function public.definir_stock(
  p_variante uuid, p_stock integer, p_motif text default 'Inventaire'
) returns integer
language plpgsql security definer set search_path = public as $$
declare v_avant integer;
begin
  if not public.est_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if p_stock < 0 then raise exception 'Le stock ne peut pas être négatif'; end if;
  select stock into v_avant from public.variantes where id = p_variante for update;
  if v_avant is null then raise exception 'Variante introuvable'; end if;
  if v_avant = p_stock then return p_stock; end if;
  update public.variantes set stock = p_stock where id = p_variante;
  insert into public.mouvements_stock (variante_id, delta, type, motif, stock_apres, par)
  values (p_variante, p_stock - v_avant, 'correction', left(coalesce(p_motif, ''), 300), p_stock, auth.uid());
  return p_stock;
end $$;

-- Vue de synthèse pour l'admin (stock total, alertes, image principale)
create or replace view public.vue_produits_admin
with (security_invoker = true) as
select p.*,
       coalesce(sum(v.stock), 0)::int                               as stock_total,
       count(v.id)::int                                             as nb_variantes,
       count(v.id) filter (where v.stock <= v.seuil_alerte)::int    as nb_alertes,
       (select i.url from public.images_produit i
         where i.produit_id = p.id order by i.position limit 1)     as image
from public.produits p
left join public.variantes v on v.produit_id = p.id
group by p.id;

-- ═══════════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════════
alter table public.admins              enable row level security;
alter table public.produits            enable row level security;
alter table public.variantes           enable row level security;
alter table public.images_produit      enable row level security;
alter table public.mouvements_stock    enable row level security;
alter table public.commandes           enable row level security;
alter table public.lignes_commande     enable row level security;
alter table public.evenements_commande enable row level security;
alter table public.notifications       enable row level security;
alter table public.journal_admin       enable row level security;

-- Admins : chacun voit sa propre fiche ; seuls les administrateurs gèrent l'équipe
drop policy if exists admins_lecture on public.admins;
create policy admins_lecture on public.admins for select to authenticated
  using (user_id = auth.uid() or public.est_admin());
drop policy if exists admins_gestion on public.admins;
create policy admins_gestion on public.admins for all to authenticated
  using (public.est_administrateur()) with check (public.est_administrateur());

-- Catalogue : le public ne voit que les produits publiés
drop policy if exists produits_public on public.produits;
create policy produits_public on public.produits for select to anon, authenticated
  using (statut = 'publie' or public.est_admin());
drop policy if exists produits_admin on public.produits;
create policy produits_admin on public.produits for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

drop policy if exists variantes_public on public.variantes;
create policy variantes_public on public.variantes for select to anon, authenticated
  using (public.est_admin() or exists (select 1 from public.produits p where p.id = produit_id and p.statut = 'publie'));
drop policy if exists variantes_admin on public.variantes;
create policy variantes_admin on public.variantes for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

drop policy if exists images_public on public.images_produit;
create policy images_public on public.images_produit for select to anon, authenticated
  using (public.est_admin() or exists (select 1 from public.produits p where p.id = produit_id and p.statut = 'publie'));
drop policy if exists images_admin on public.images_produit;
create policy images_admin on public.images_produit for all to authenticated
  using (public.est_admin()) with check (public.est_admin());

-- Données internes : admins uniquement (le paiement Stripe écrit via la clé serveur)
drop policy if exists mouvements_admin on public.mouvements_stock;
create policy mouvements_admin on public.mouvements_stock for select to authenticated using (public.est_admin());

drop policy if exists commandes_admin on public.commandes;
create policy commandes_admin on public.commandes for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists lignes_admin on public.lignes_commande;
create policy lignes_admin on public.lignes_commande for select to authenticated using (public.est_admin());
drop policy if exists evenements_admin on public.evenements_commande;
create policy evenements_admin on public.evenements_commande for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists notifications_admin on public.notifications;
create policy notifications_admin on public.notifications for select to authenticated using (public.est_admin());
drop policy if exists journal_admin_lecture on public.journal_admin;
create policy journal_admin_lecture on public.journal_admin for select to authenticated using (public.est_admin());
drop policy if exists journal_admin_ecriture on public.journal_admin;
create policy journal_admin_ecriture on public.journal_admin for insert to authenticated
  with check (public.est_admin() and par = auth.uid());

-- Droits d'exécution des fonctions
revoke all on function public.ajuster_stock(uuid, integer, public.type_mouvement, text) from public, anon;
revoke all on function public.definir_stock(uuid, integer, text) from public, anon;
grant execute on function public.ajuster_stock(uuid, integer, public.type_mouvement, text) to authenticated;
grant execute on function public.definir_stock(uuid, integer, text) to authenticated;
grant execute on function public.est_admin() to anon, authenticated;
grant execute on function public.est_compte_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════════
--  Stockage des photos (bucket public « produits »)
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produits', 'produits', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists produits_photos_lecture on storage.objects;
create policy produits_photos_lecture on storage.objects for select to anon, authenticated
  using (bucket_id = 'produits');
drop policy if exists produits_photos_ajout on storage.objects;
create policy produits_photos_ajout on storage.objects for insert to authenticated
  with check (bucket_id = 'produits' and public.est_admin());
drop policy if exists produits_photos_modif on storage.objects;
create policy produits_photos_modif on storage.objects for update to authenticated
  using (bucket_id = 'produits' and public.est_admin());
drop policy if exists produits_photos_suppr on storage.objects;
create policy produits_photos_suppr on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and public.est_admin());
