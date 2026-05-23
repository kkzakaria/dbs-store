# Spec — Plan « Quick Wins » (#0, #1, #6)

**Date** : 2026-05-23
**Branche** : `fix/quick-wins-indexes-otptype-images`
**Source** : issues priorisées dans `docs/TECHNICAL_ANALYSIS.md` (+ bug TS découvert pendant l'analyse)

Trois correctifs indépendants, faible risque, livrés dans un seul PR. Ordre imposé : **#0 d'abord** (débloque les commits via le hook pre-commit), puis #1, puis #6.

---

## #0 — Fix TypeScript `OtpType` (débloque le pre-commit)

### Problème

`getAuth()` (`lib/auth.ts:69`) passe le paramètre `type` du callback `sendVerificationOTP` — typé par better-auth comme `"sign-in" | "email-verification" | "forget-password" | "change-email"` — à `sendOtpEmail()`, qui attend `OtpType` (`lib/email/types.ts`) ne couvrant que les 3 premières valeurs. D'où :

```
lib/auth.ts(69,42): error TS2345: '"change-email"' is not assignable to type 'OtpType'.
```

Le hook husky pre-commit lance le typecheck → **tout commit normal est actuellement bloqué**. Le flux `change-email` n'est utilisé nulle part dans l'app (vérifié : aucune occurrence de `changeEmail`/`change-email` dans `app/`, `lib/`, `components/`).

### Approche retenue — narrow + garde explicite

Pas d'extension de `OtpType` (YAGNI : éviter un template email mort). Ajouter une garde dans le callback qui rétrécit l'union avant l'appel :

```ts
emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    // L'app ne supporte pas le flux change-email — garde explicite pour la sûreté de type.
    if (type === "change-email") return;
    if (!env.RESEND_API_KEY) {
      console.log(`[emailOTP DEV] type=${type} email=${email} otp=${otp}`);
      return;
    }
    await sendOtpEmail(email, otp, type); // `type` est désormais OtpType
  },
  otpLength: 6,
  expiresIn: 300,
}),
```

### Vérification

- Le typecheck (hook pre-commit) passe — plus d'erreur TS2345.
- Les commits suivants (#1, #6) passent le hook sans `--no-verify`.

### Fichiers touchés

- `lib/auth.ts`

---

## #1 — Index DB de production

### Problème

Le schéma applicatif (`lib/db/schema.ts`) ne définit **aucun index** hors contraintes `unique` (slug) et les index `failed_emails`. Les requêtes de filtrage/tri (catégorie, marque, promo, commandes par user/statut, hero, sous-catégories) font des full table scans en production.

### Approche retenue — migration SQL hand-written

Nouvelle migration `migrations/0004_add_production_indexes.sql`, suivant la convention du repo (`0003` utilise `CREATE INDEX IF NOT EXISTS`). **Pas** de modification de `schema.ts` : les index `failed_emails` existants n'y figurent pas non plus → convention SQL-only respectée. Migrations D1 immuables → nouveau fichier numéroté.

### Les 10 index (colonnes vérifiées contre `schema.ts`)

```sql
-- migrations/0004_add_production_indexes.sql
CREATE INDEX IF NOT EXISTS idx_products_category_is_active    ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_is_active ON products(subcategory_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at            ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_brand                 ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_old_price             ON products(old_price) WHERE old_price > 0;
CREATE INDEX IF NOT EXISTS idx_orders_user_id                 ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id           ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort        ON hero_slides(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id           ON categories(parent_id);
```

Notes :
- `created_at` sans `DESC` : SQLite parcourt un index mono-colonne dans les deux sens, le `DESC` n'apporte rien ici.
- `old_price > 0` : index partiel ; `NULL > 0` est faux en SQLite, donc les produits sans promo sont exclus (comportement voulu).

### Application

- `bun run db:migrate:dev` → `dev.db` (better-sqlite3, via `scripts/migrate-dev.ts`)
- `bun run db:migrate:local` → D1 local (preview)
- `bun run db:migrate:remote` → prod (exécuté par `deploy.yml` au merge sur main)

### Vérification

- La migration s'applique sans erreur sur `dev.db`.
- Index transparents → aucun résultat de requête modifié → la suite de tests data-layer reste verte (`bun run test`).
- (Optionnel) `EXPLAIN QUERY PLAN` sur une requête catégorie montre l'usage de l'index.

### Fichiers touchés

- `migrations/0004_add_production_indexes.sql` (nouveau)

---

## #6 — Autoriser les images R2 dans `next/image`

### Problème

`next.config.ts` ne whiteliste que `images.unsplash.com`. Les images uploadées (produits, hero) sont servies depuis R2 via `R2_PUBLIC_URL = https://cdn.dbs-store.ci` (cf. `.env.example`, `lib/actions/admin-upload.ts`). `next/image` **rejette** toute image dont l'hôte n'est pas dans `remotePatterns`.

### Approche retenue — autoriser l'hôte R2 uniquement

Ajouter `cdn.dbs-store.ci` aux `remotePatterns`. **Pas** de `formats: [avif, webp]` : l'optimisation d'image sur Cloudflare Workers (opennextjs) a ses propres règles et l'effet n'est pas garanti sans Cloudflare Images — hors périmètre de ce plan.

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "cdn.dbs-store.ci" },
  ],
},
```

### Vérification

- `bun run build` passe.
- Une URL `https://cdn.dbs-store.ci/...` est acceptée par `next/image` (plus d'erreur « hostname not configured »).

### Fichiers touchés

- `next.config.ts`

---

## Hors périmètre (chantiers de design séparés)

À traiter dans des specs dédiés ultérieurs : rate limiting (#2), CSP headers (#3), contrôle de rôle sur les mutations admin (#4), migration ISR via remote bindings (#5).

## Livraison

- Une branche : `fix/quick-wins-indexes-otptype-images`
- Un PR squash vers `main`
- CI (`ci.yml` : lint + test) doit passer ; au merge, `deploy.yml` applique `db:migrate:remote` (index en prod)
