# ÉLYSORA Group — site e-commerce

> *L'art de sublimer votre quotidien* · Mode · Hair · Home

Site Next.js + Supabase + Stripe, hébergé sur Netlify.

| Phase | Contenu | État |
|---|---|---|
| 1 | Maquettes | ✅ validées |
| 2 | Base de données + administration (produits, stock, commandes, 2FA) | ✅ |
| 3 | Boutique publique (accueil, boutique, fiches produit, panier, suivi, pages d'information) | ✅ |
| 4 | Paiement Stripe + création des commandes | à venir |
| 5 | Suivi de commande + e-mails automatiques | à venir |

---

## Mise en route (à faire une seule fois)

### 1. Base de données Supabase — ✅ déjà installée

Schéma, sécurité (RLS) et catalogue initial ont été appliqués au projet `lqemkzctyfraxqrrhejq`
(83 produits, 1 078 variantes, 116 photos, bucket « produits »).
Pour un nouveau projet : exécuter dans l'ordre les fichiers de `supabase/migrations/` dans le SQL Editor.

### 2. Sécuriser l'authentification

Supabase → **Authentication** :
- **Sign In / Providers** → *Email* : désactivez **« Allow new users to sign up »** (personne ne peut créer de compte seul).
- **Multi-Factor** : vérifiez que **TOTP (App Authenticator)** est **activé**.
- **URL Configuration** → *Site URL* : l'adresse Netlify du site (ex. `https://elysora.netlify.app`).

### 3. Créer votre compte administrateur

1. **Authentication → Users → Add user → Create new user** : votre e-mail + un mot de passe solide (12 caractères minimum), cochez **Auto Confirm User**.
2. **SQL Editor**, nouvelle requête (remplacez l'e-mail) :
   ```sql
   insert into public.admins (user_id, nom, role)
   select id, 'Votre nom', 'administrateur' from auth.users where email = 'votre@email.com';
   ```
   Pour un employé : même chose avec `'employe'`.

### 4. Variables d'environnement dans Netlify

Netlify → votre site → **Site configuration → Environment variables** → *Add a variable* :

| Nom | Où la trouver | Secrète ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → *Project URL* | non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → *anon / public* | non |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → *service_role* | **OUI — jamais ailleurs que dans Netlify** |
| `NEXT_PUBLIC_SITE_URL` | l'adresse de votre site Netlify | non |

Puis **Deploys → Trigger deploy → Deploy site**.

### 5. Première connexion

Allez sur `https://votre-site.netlify.app/admin` → e-mail + mot de passe → scannez le QR code avec **Google Authenticator** ou **Microsoft Authenticator** → saisissez le code à 6 chiffres. Les fois suivantes, seul le code est demandé après le mot de passe.

---

## La boutique

- `/` accueil · `/boutique` (filtres univers, catégories, recherche, tri, en stock) · `/produit/<slug>` fiche produit
- `/panier` panier conservé dans le navigateur ; prix et stock revérifiés auprès de la base à chaque ouverture
- `/suivi` suivi de commande (n° + e-mail, via la fonction SQL `suivi_commande`)
- Pages d'information : `/a-propos`, `/contact`, `/faq`, `/livraison-retours`, `/cgv`, `/confidentialite`, `/mentions-legales`
  → les passages **[À COMPLÉTER]** sont à fournir par ÉLYSORA Group (fichier `src/app/(boutique)/[page]/page.tsx`).

## L'administration (`/admin`)

- **Tableau de bord** : ventes, commandes à traiter, alertes de stock, ce qu'il reste à faire.
- **Produits & stock** : recherche, filtres (sans prix, à vérifier, stock bas…), fiche produit complète, photos (téléversement, photo principale), variantes taille × couleur avec boutons **+ / −**, inventaire (taper un nombre), seuil d'alerte, historique des mouvements.
- **Publier un produit** : saisir le prix → statut *Publié*. La base refuse la publication sans prix, ou si la case « marque à vérifier » est cochée.
- **Import / export** : téléchargez le catalogue en Excel, modifiez prix et stocks, ré-importez. Chaque changement de stock est tracé.
- **Commandes** : liste, détail, avancement Payée → En préparation → Expédiée (transporteur + n° de suivi → lien automatique) → Livrée, notes internes.
- **Journal** : qui a fait quoi, et quand.

## Sécurité

- Accès admin = compte autorisé **+ double authentification** obligatoire, vérifiée par le serveur **et** par la base (Row Level Security, niveau `aal2`).
- RLS activée sur toutes les tables : le public ne voit que les produits publiés.
- Stock modifié uniquement via des fonctions SQL atomiques qui écrivent l'historique ; stock négatif impossible.
- Clés secrètes uniquement dans les variables Netlify (voir `.env.example`).
- En-têtes de sécurité (HSTS, CSP, anti-iframe…) dans `netlify.toml` ; `/admin` jamais indexé ni mis en cache.
- Polices hébergées sur le site (aucun appel à Google Fonts).

## Développement local (facultatif)

```bash
cp .env.example .env.local   # puis remplir les valeurs
npm install
npm run dev                  # http://localhost:3000
```

## Arborescence

```
supabase/migrations/   schéma SQL + catalogue initial
public/produits/       photos optimisées du catalogue initial (WebP)
src/app/admin/         administration
src/components/admin/  composants de l'administration
src/lib/               Supabase, formats, garde d'accès
netlify.toml           build + en-têtes de sécurité
```
