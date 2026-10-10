-- Prix propre à une variante (ex. pyjama adulte vs enfant). Vide = prix du produit.
alter table public.variantes add column if not exists prix_cents integer check (prix_cents is null or prix_cents >= 0);
