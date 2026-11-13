# Agendo

Espace pro de prise de rendez-vous pour indépendantes, en français. La cible de cette V1 est la prothésiste ongulaire : inscription courte, cinq onglets (Aujourd’hui, Agenda, Clientes, Ma page, Réglages), invitation sur des créneaux précis, page vitrine `/{slug}`, lien iCal.

L’application est en **Next.js** (App Router, TypeScript, Tailwind) avec **Supabase** (auth e-mail et Postgres). Elle se déploie sur **Cloudflare Workers** via `@opennextjs/cloudflare` et Wrangler, dans un **projet Cloudflare distinct** de tout site déjà hébergé sur le compte.

La maquette HTML d’origine est conservée dans [`/maquette`](maquette/README.md).

## Projet Supabase

Le projet est déjà créé :

| | |
|---|---|
| URL | `https://dilkyofvugsaoqrawnwm.supabase.co` |
| Référence | `dilkyofvugsaoqrawnwm` |
| Région | `eu-west-3` |

Cette URL est publique. Elle est déjà dans [`.env.example`](.env.example). **Aucune clé** (anon, service role, Google, Resend) ne doit être commitée.

## 1. Appliquer la base

1. Ouvrir [le SQL Editor Supabase](https://supabase.com/dashboard/project/dilkyofvugsaoqrawnwm/sql/new) du projet `dilkyofvugsaoqrawnwm`.
2. Coller **tout** le fichier [`supabase/migrations/20261113120000_init.sql`](supabase/migrations/20261113120000_init.sql).
3. Lancer la requête une fois.

Le script crée les tables, la RLS, le trigger d’inscription, les fonctions de réservation et le bucket de photos `vitrine`. Il peut être relancé : les objets déjà là sont recréés ou laissés en place.

Tables attendues : `profiles`, `services`, `opening_hours`, `clients`, `appointments`, `time_off`, `invitations`, `photos`, `email_outbox`, `google_calendar_connections`.

## 2. Auth e-mail

Dans **Authentication → Sign In / Providers → Email** :

- Laisser le provider Email activé.
- **Décocher « Confirm email »** pour que l’inscription ouvre l’espace pro tout de suite. Si la case reste cochée, le compte est créé mais la connexion n’est possible qu’après le clic dans l’e-mail.

Dans **Authentication → URL Configuration**, au moment du déploiement :

- Site URL : `http://localhost:3000` en local, puis l’URL `*.workers.dev` du worker Agendo.
- Redirect URLs :
  - `http://localhost:3000/auth/callback`
  - `https://agendo.<sous-domaine>.workers.dev/auth/callback`

## 3. Lancer en local

```bash
cp .env.example .env.local
```

Dans `.env.local`, coller la clé **anon / public** (Project Settings → API). Ne pas remplir la clé `service_role` pour le parcours inscription → espace pro : elle ne sert qu’à la route de rappels.

```bash
npm install
npm run dev
```

Ouvrir <http://localhost:3000/inscription>, créer le compte (nom, métier, ville, téléphone, prestations, horaires), puis arriver sur **Aujourd’hui**.

`npm test` vérifie le calcul des créneaux (fuseau Europe/Paris). `npm run typecheck` vérifie TypeScript.

## 4. Déployer sur Cloudflare (projet séparé)

Le compte Cloudflare héberge déjà un autre site. **Ne pas l’ouvrir, ne pas modifier son domaine, ses DNS, ses routes ni son worker.** Agendo est un worker nouveau, nommé `agendo` (champ `name` de [`wrangler.jsonc`](wrangler.jsonc)). Ce nom ne doit pas être celui de l’autre site. Le fichier ne déclare **aucune route ni domaine personnalisé** : le déploiement crée seulement une adresse `https://agendo.<sous-domaine>.workers.dev`.

### Variables

Les variables `NEXT_PUBLIC_*` sont figées **au moment du build**. Il faut les fournir au build **et** au runtime.

| Variable | Où | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | build + runtime | `https://dilkyofvugsaoqrawnwm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build + runtime | clé anon, jamais dans Git |
| `NEXT_PUBLIC_APP_URL` | build + runtime | URL du worker, sans slash final |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime, optionnel | seulement `/api/cron/rappels` |
| `REMINDERS_CRON_SECRET` | runtime, optionnel | protège cette route |

### Depuis la machine, avec Wrangler

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` enchaîne le build OpenNext et `wrangler deploy --keep-vars`, pour le worker **`agendo`** uniquement. `--keep-vars` conserve les variables déjà saisies dans le tableau de bord.

Avant le premier `npm run deploy`, créer le worker vide si besoin : **Workers & Pages → Create → Workers → nom `agendo`**. Ne pas choisir le projet existant. Puis **Settings → Variables and Secrets** de **ce** worker, et coller les variables runtime. Pour le build local, `.env.local` suffit : Next.js l’embarque dans le bundle.

### Depuis Git (Workers Builds)

1. **Workers & Pages → Create application → Import a repository**.
2. Choisir `carflowauto/agendo` et créer un **nouveau** projet nommé `agendo`. Ne pas le rattacher à l’autre site.
3. Build command : `npm run cf:build`
4. Deploy command : `npm run cf:deploy`
5. Dans **Build variables and secrets** et dans les variables **runtime** du même projet, renseigner les trois `NEXT_PUBLIC_*`.
6. Ne pas ajouter le domaine de l’autre site.

Après le déploiement : ouvrir l’URL `workers.dev` → **Créer mon espace** → l’espace pro.

Mettre à jour la Site URL et la Redirect URL Supabase avec cette adresse.

## 5. Données de démonstration

Une fois connectée, **Aujourd’hui → Charger un exemple de journée** (aussi dans Réglages). Cela appelle `seed_demo_data()` : pose, pause, remplissage, dépose, un rendez-vous demain, et une pose datée du nombre de semaines de remplissage pour la suggestion WhatsApp.

Depuis le SQL Editor, avec l’UUID du compte (Authentication → Users) :

```sql
select public.seed_demo_for_profile('uuid-du-compte');
```

Le détail est dans [`supabase/seed.sql`](supabase/seed.sql).

## Fonctionnalités V1

- Inscription : nom, métier, ville, téléphone, prestations (nom, durée, prix), horaires. Un slug unique est généré pour la vitrine.
- Aujourd’hui : rendez-vous du jour, liens `tel:` et `wa.me`, chiffre d’affaires, relance « c’est l’heure du remplissage ».
- Agenda : semaine, glisser pour déplacer, bloquer un créneau, rendez-vous manuel.
- Clientes : fiches, historique, notes.
- Ma page : prestations, horaires, photos (fichier ou URL), lien et QR code.
- Réglages : congés, délai minimum, délai de rappel, semaines avant remplissage, lien iCal.
- Invitation : **Inviter une cliente** crée un lien vers un ou plusieurs créneaux. La cliente saisit nom et téléphone, le rendez-vous est confirmé.
- Vitrine publique `/{slug}` : prestations et réservation d’un créneau libre, sans compte.
- Abonnement calendrier : `https://…/ical/{jeton}` (ou `webcal://`).

## Préparé, pas branché

- **E-mails** : chaque rendez-vous confirmé ajoute une confirmation et un rappel dans `email_outbox` (`src/lib/email/reminders.ts`). Sans e-mail de cliente, la ligne est `skipped`. `GET /api/cron/rappels` avec `Authorization: Bearer $REMINDERS_CRON_SECRET` compte les messages en attente et n’envoie rien.
- **Google Agenda** : table `google_calendar_connections`, module `src/lib/google/sync.ts`, routes `/api/google/connect` et `/api/google/callback` (réponse 501). Aucun appel Google.

## Maquette et GitHub Pages

Les HTML, captures et générateurs sont dans `/maquette`. L’app Next occupe la racine, donc Pages ne peut plus publier la racine du dépôt.

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) publie le dossier `maquette` quand il change sur `main`. Une fois : **Settings → Pages → Build and deployment → Source : GitHub Actions**. L’adresse reste <https://carflowauto.github.io/agendo/>.

En local : ouvrir `maquette/index.html` (la police et Tailwind sont chargés depuis internet).

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Next.js en local |
| `npm run build` | Build Next.js |
| `npm run cf:build` | Build OpenNext pour Cloudflare |
| `npm run deploy` | Build + déploiement du worker `agendo` |
| `npm test` | Créneaux et fuseau horaire |
