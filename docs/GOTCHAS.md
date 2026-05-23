# ⚠️ GOTCHAS IMPORTANTS — DBS Store

Ce document liste les pièges et comportements non-évidents rencontrés lors du développement du projet. **À lire avant de modifier le code.**

---

## 1. 🔄 **Build Script Loop Infini**

### Le Piège
Configurer le script `build` comme ceci crée une boucle infinie :

```json
{
  "scripts": {
    "build": "opennextjs-cloudflare build"
  }
}
```

**Pourquoi ?** → `opennextjs-cloudflare build` appelle en interne `bun run build`, qui rappelle `opennextjs-cloudflare build` → ∞

### ✅ La Solution
- **`build`** DOIT être `next build` (Next.js natif uniquement)
- **`build:worker`** = `opennextjs-cloudflare build` (pour le full Cloudflare Workers build)

### Flux Correct
```bash
bun run build          # → next build (generates .next/)
bun run build:worker   # → opennextjs-cloudflare build (generates .open-next/)
bun run preview        # → wrangler dev (utilise .open-next/)
```

### Où Appliquer
- Scripts npm/bun : vérifier `package.json`
- CI/CD : `.github/workflows/deploy.yml` doit appeler `build:worker` (pas `build`)

---

## 2. 🔐 **Force-Dynamic Requis pour Cloudflare Bindings**

### Le Piège
Une page/layout appelle `getDb()`, `getAuth()`, ou `getCachedSession()` sans `export const dynamic = "force-dynamic"` :

```tsx
// ❌ MAUVAIS — Cloudflare bindings indisponibles au build
export default async function Page() {
  const db = await getDb();  // ← Crash au build
  return <div>...</div>;
}
```

**Pourquoi ?** → Avec la configuration actuelle, `getDb()`/`getAuth()` appellent `getCloudflareContext()` en mode **synchrone** (`lib/db/index.ts`, `lib/auth.ts`), où le binding D1 n'existe qu'au runtime de la requête — pas pendant le prérendering statique au build.

> ⚠️ **Ce n'est PAS une limitation absolue de la plateforme.** OpenNext/Cloudflare expose les **remote bindings** : activés, ils rendent D1/KV accessibles *pendant le build* (et donc l'ISR). Voir [doc officielle](https://opennext.js.org/cloudflare/bindings#remote-bindings) — « Remote bindings are also used during the build process [...] those requests are actually made ». Tant que `experimental: { remoteBindings: true }` (`next.config.ts`) + `experimental_remote: true` (binding D1 dans `wrangler.jsonc`) ne sont **pas** activés, `force-dynamic` reste obligatoire. La formulation « bindings indisponibles au build » vaut donc *pour la config actuelle*, pas dans l'absolu.

### ✅ La Solution

```tsx
// ✅ BON
export const dynamic = "force-dynamic";

export default async function Page() {
  const db = await getDb();
  return <div>...</div>;
}
```

### Où Appliquer
- **Pages** : `app/(main)/[slug]/page.tsx`, `app/(admin)/**/page.tsx`, `app/(compte)/**/page.tsx`
- **Layouts** : `app/(main)/layout.tsx`, `app/(admin)/layout.tsx`, `app/(compte)/layout.tsx`
- **Tout ce qui utilise** : `getDb()`, `getAuth()`, `getCachedSession()`

### Vérification
```bash
bun run build          # Si crash → chercher getDb/getAuth/getCachedSession sans force-dynamic
bun run build:worker   # Si crash → même diagnostic
```

---

## 3. 🔒 **Async/Await sur getDb() et getAuth()**

### Le Piège
Oublier `await` sur `getDb()` ou `getAuth()` (ce sont des Promises) :

```tsx
// ❌ MAUVAIS
const db = getDb();
const products = await db.select().from(products_table);
```

**Résultat** → `db` est une Promise, pas une connexion valide. Crash runtime.

### ✅ La Solution

```tsx
// ✅ BON
const db = await getDb();
const products = await db.select().from(products_table);

// Ou en une ligne
const products = await (await getDb()).select().from(products_table);
```

### Où Appliquer
- **Server actions** : `lib/actions/*.ts`
- **Data layer** : `lib/data/*.ts`
- **API routes** : `app/api/**/*.ts`
- **Layouts/Pages** : Tout composant `async`

### ESLint
Le projet a ESLint configuré — il devrait détecter les Promises non-awaitées. Vérifier :
```bash
bun run lint
```

---

## 4. 🗄️ **D1 Transactions avec db.batch()**

### Le Piège
Utiliser des requêtes D1 individuelles au lieu de transactions atomiques :

```tsx
// ❌ MAUVAIS — Pas atomique (peut être partiellement appliqué)
await db.insert(orders).values(order);
await db.insert(order_items).values(items);  // Si crash ici, order existe mais pas items
```

### ✅ La Solution

```tsx
// ✅ BON — Atomique
const db = await getDb();
await db.batch([
  db.insert(orders).values(order),
  db.insert(order_items).values(items),
]);
```

### Pourquoi Ça Importe
- **Cohérence** : Order avec items = ensemble atomique
- **Production** : D1 vrai DB, erreurs réseau possibles
- **Dev** : `bun run preview` utilise une polyfill de transactions SQLite, tester sur D1 via preview

### Où Appliquer
- **Checkout** : `lib/actions/orders.ts` — order + order_items
- **Admin** : `lib/actions/admin-*.ts` — créations/mises à jour multiples
- **Data migrations** : Scripts seed

---

## 5. 🚫 **Migrations D1 Immuables**

### Le Piège
Modifier un fichier migration existant après l'avoir appliqué :

```bash
# ❌ MAUVAIS
# Fichier: migrations/0002_fix_schema.sql
# Déjà appliqué en prod
# Puis tu le modifies et redéploies → État incohérent
```

**Pourquoi ?** → D1 suit les migrations appliquées. Modifier un fichier → Prod et Dev out-of-sync.

### ✅ La Solution
**JAMAIS modifier** fichiers migration existants. Créer un **nouveau fichier** :

```bash
# Bon flux
migrations/0002_add_hero_slides.sql    # Appliqué en prod ✅
migrations/0003_fix_hero_schema.sql    # Nouveau fichier, non appliqué ✅
migrations/0004_add_columns.sql        # Encore nouveau ✅
```

### Créer une Migration
```bash
bun run db:generate   # Drizzle génère à partir de schema.ts
# Ou créer manuellement : migrations/NNNN_description.sql
```

### Appliquer
```bash
# Dev
bun run db:migrate:dev

# Local preview
bun run db:migrate:local

# Production
bun run db:migrate:remote
```

---

## 6. 🔑 **Server Actions = Public HTTP Endpoints**

### Le Piège
Croire qu'une server action est "sécurisée" juste parce qu'elle s'appelle côté client :

```tsx
// ❌ MAUVAIS — Pas sécurisé !
"use server";

export async function deleteProduct(id: string) {
  // Rien ne vérifie que l'utilisateur est admin
  await db.delete(products).where(eq(products.id, id));
}
```

**Pourquoi ?** → Server actions sont des HTTP endpoints publics. N'importe qui peut les appeler avec curl :

```bash
curl -X POST https://dbs-store.com/your-server-action \
  -H "Content-Type: application/json" \
  -d '{"id":"123"}'
```

### ✅ La Solution
**TOUJOURS valider au runtime** :

```tsx
"use server";

export async function deleteProduct(id: string) {
  const session = await getCachedSession();
  
  // ✅ Validation runtime
  if (!session || !session.user.organization?.admin) {
    throw new Error("Unauthorized");
  }
  
  await db.delete(products).where(eq(products.id, id));
}
```

### Où Appliquer
- **Admin actions** : `lib/actions/admin-*.ts`
- **User actions** : `lib/actions/orders.ts`, `lib/actions/support.ts`
- **Validation** : Toujours `session` + `organization membership` + business logic checks

### Pattern Standard
```tsx
"use server";

export async function myServerAction(input: InputType) {
  // 1. Validate session
  const session = await getCachedSession();
  if (!session) throw new Error("Unauthenticated");
  
  // 2. Check authorization
  if (!session.user.organization?.admin) {
    throw new Error("Unauthorized");
  }
  
  // 3. Validate input types (TypeScript ≠ protection)
  if (typeof input.id !== "string") throw new Error("Invalid input");
  
  // 4. Execute with DB
  return await db.delete(table).where(eq(table.id, input.id));
}
```

---

## 7. 📐 **Margin-Top sur Sticky Elements ≠ Viewport Offset**

### Le Piège
Utiliser `margin-top` pour créer un offset de viewport sur un élément sticky :

```tsx
// ❌ MAUVAIS
<div className="sticky top-0 mt-16">
  {/* mt-16 n'affecte pas où "top-0" va sticky */}
</div>
```

**Résultat** → L'élément sticky colle à `top: 0`, pas à `top: 16 (64px)`.

### ✅ La Solution
Utiliser la propriété CSS `top` :

```tsx
// ✅ BON
<div className="sticky top-16">
  {/* Sticky à 64px du top du viewport */}
</div>
```

### Ou
```tsx
<div style={{ position: "sticky", top: "64px" }}>
  {/* Même résultat */}
</div>
```

### Où Appliquer
- **App bar** : `components/layout/app-bar/app-bar.tsx` (déjà correct)
- **Category tray** : sticky category sidebar
- **Sticky filters** : search, promo pages

---

## 8. 🚪 **Dev Server Port ≠ Default Next.js**

### Le Piège
Essayer de lancer le dev server sans lire `package.json` :

```bash
# ❌ MAUVAIS
npm run dev   # → Lance sur port 3000 (défaut Next.js)
# Page : http://localhost:3000 (WRONG!)
```

### ✅ La Solution
Le port est configuré :

```json
{
  "scripts": {
    "dev": "next dev --port 33000"
  }
}
```

**Toujours utiliser :**
```bash
bun run dev   # → http://localhost:33000
```

### Pourquoi 33000 ?
- **Port 3000** = port par défaut, souvent occupé
- **Port 8788** = réservé à `bun run preview` (wrangler)
- **Port 33000** = distinct, moins de conflits

---

## 9. 🎨 **ESLint Has Pre-Existing Errors**

### Le Piège
Voir `bun run lint` échouer et croire que c'est ta faute :

```bash
bun run lint
# ❌ 5 errors found
#    - unescaped entity in JSX
#    - 'any' type used
```

### La Réalité
Le projet a des erreurs ESLint **pré-existantes documentées** :

- `components/layout/app-bar/app-bar.tsx` — `any` types
- `lib/auth/**` — Unescaped entities
- Ces erreurs ne viennent pas de nouvelles modifications

### ✅ La Solution
- **Ignorer les erreurs pré-existantes** lors des PRs
- **Ne pas les introduire** dans ton code
- Vérifier ton changement n'a pas ajouté de nouveaux lint errors :

```bash
# Avant ta modification
bun run lint > before.txt

# Après ta modification
bun run lint > after.txt

# Comparer
diff before.txt after.txt  # Devrait être vide (à part les erreurs pré-existantes)
```

### Ignorer dans ESLint
Les fichiers avec erreurs pré-existantes sont exclus dans `eslint.config.mjs` :
```js
{
  ignores: [".open-next/", ".wrangler/", "node_modules/"]
}
```

**NE PAS SUPPRIMER** ces ignores — le lint va OOM sinon.

---

## 10. 🔑 **Secrets Production via Wrangler**

### Le Piège
Ajouter un secret dans `wrangler.jsonc` :

```jsonc
// ❌ MAUVAIS
{
  "env": {
    "production": {
      "secrets": {
        "MY_API_KEY": "sk-xxx-yyy-zzz"  // ← Ne va pas se déployer
      }
    }
  }
}
```

**Pourquoi ?** → Cloudflare n'accepte pas les secrets en clair dans config. Risque de leak.

### ✅ La Solution
Utiliser `wrangler secret put` :

```bash
# Localement
wrangler secret put MY_API_KEY --local
# → Demande la valeur interactivement

# Production
wrangler secret put MY_API_KEY
# → Déploie sur Cloudflare
```

### Vérifier
```bash
# Lister les secrets locaux
wrangler secret list --local

# Lister les secrets prod
wrangler secret list
```

### Où Appliquer
- **Resend API key** pour les emails
- **S3 credentials** pour images
- **Tout JWT/token** ne doit JAMAIS être en clair dans code/config

---

## 11. 📦 **SQLite LIKE Requires ESCAPE**

### Le Piège
Utiliser `db.like()` de Drizzle pour une recherche LIKE sans ESCAPE :

```tsx
// ❌ MAUVAIS — Injection SQLite possible
const results = await db
  .select()
  .from(products)
  .where(like(products.name, `%${userInput}%`));

// Si userInput = "%test%" → Double wildcard = undefined behavior
```

### ✅ La Solution
Utiliser `sql` template literal avec ESCAPE explicite :

```tsx
import { sql } from "drizzle-orm";

const results = await db
  .select()
  .from(products)
  .where(
    sql`${products.name} LIKE ${`%${escapeLike(userInput)}%`} ESCAPE '\\'`
  );

// Helper function
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}
```

### Pourquoi
- `LIKE` utilise `%` et `_` comme wildcards
- Si user input contient `%` → ambiguïté
- `ESCAPE '\\'` dit à SQLite : traiter `\\` comme escape
- Drizzle's `like()` n'ajoute **pas** l'ESCAPE automatiquement

### Où Appliquer
- **Search queries** : `lib/data/products.ts` → `searchProducts()`
- **Admin filters** : `lib/data/admin-products.ts` → `getAdminProducts()`
- **Category search** : `lib/data/categories.ts`

### Vérifier le Code
```bash
grep -r "like(" lib/data/
# Si tu trouves du like() sans ESCAPE → Chercher et remplacer par sql template
```

---

## 12. 🗂️ **Quotes Bash avec Parentheses**

### Le Piège
Exécuter des commandes bash avec `app/(main)/...` sans quotes :

```bash
# ❌ MAUVAIS — Bash interprète les parens
ls app/(main)/
# bash: command not found: (main)
```

**Pourquoi ?** → Bash traite `(...)` comme une subshell.

### ✅ La Solution
Toujours quoter les chemins avec parens :

```bash
# ✅ BON
ls "app/(main)/"
cat "app/(main)/page.tsx"
find "app/(admin)" -name "*.tsx"
```

### Où Appliquer
- **Commandes shell** : git, find, grep, cat, ls
- **Chemins avec parentheses** : routes Next.js

### Exemples Corrects
```bash
# Git
git status "app/(main)/page.tsx"

# Find
find "app/(main)" -type f -name "*.tsx"

# Grep
grep -r "force-dynamic" "app/(admin)"

# Lesslint
bun run lint "app/(main)/"
```

---

## 13. 🏗️ **Lazy-Load Heavy Components avec next/dynamic**

### Le Piège
Importer un composant lourd directement, ce qui bloque le rendu initial :

```tsx
// ❌ MAUVAIS
import ProductAdmin from "@/components/admin/product-admin";

export default function AdminPage() {
  return <ProductAdmin />;  // ← Bundle bloated, slow hydration
}
```

### ✅ La Solution
Utiliser `next/dynamic` avec `ssr: false` pour composants client-lourds :

```tsx
import dynamic from "next/dynamic";

const ProductAdmin = dynamic(
  () => import("@/components/admin/product-admin"),
  { ssr: false, loading: () => <Skeleton /> }
);

export default function AdminPage() {
  return <ProductAdmin />;  // ← Lazy-loaded
}
```

### Quand Appliquer
- **Charts** : `@/components/admin/orders-chart`
- **Image editors** : Hero slide uploads
- **Heavy formulas** : Admin CRUD forms
- **Real-time dashboards** : Stats

### Déjà Implémenté
- `app/(main)/page.tsx` → lazy-loads hero carousel
- `components/layout/search-overlay.tsx` → lazy-loads search results

---

## 14. 👂 **Scroll/Touch Listeners: { passive: true }**

### Le Piège
Ajouter des event listeners scroll/touch sans `passive: true` :

```tsx
// ❌ MAUVAIS — Can block scroll
element.addEventListener("scroll", handleScroll);
element.addEventListener("touchmove", handleTouchMove);
```

**Résultat** → Scroll lent/sluggish (browser attend JS response avant scrolling).

### ✅ La Solution

```tsx
// ✅ BON
element.addEventListener("scroll", handleScroll, { passive: true });
element.addEventListener("touchmove", handleTouchMove, { passive: true });
```

### Ou dans React

```tsx
<div
  onScroll={(e) => handleScroll(e)}
  onTouchMove={(e) => handleTouchMove(e)}
  // React defaults to passive for these
>
  {/* ... */}
</div>
```

### Où Appliquer
- **Scroll effects** : Hero carousel, infinite scroll
- **Touch navigation** : Mobile menu swipe
- **Custom hooks** : `hooks/use-scroll-state.ts` (déjà correct)

---

## 15. 📊 **Static Data Arrays Outside Components**

### Le Piège
Définir un tableau de données **à l'intérieur** d'un composant :

```tsx
// ❌ MAUVAIS
export function ProductList() {
  const CATEGORIES = [
    { id: "1", name: "Smartphones" },
    { id: "2", name: "Laptops" },
  ];  // Re-créé à chaque render !
  
  return <ul>{CATEGORIES.map(...)}</ul>;
}
```

### ✅ La Solution
Hoist les constantes **en dehors** :

```tsx
// ✅ BON
const CATEGORIES = [
  { id: "1", name: "Smartphones" },
  { id: "2", name: "Laptops" },
];

export function ProductList() {
  return <ul>{CATEGORIES.map(...)}</ul>;
}
```

### Où Appliquer
- **FAQ data** : `lib/data/faq.ts`
- **Category icons** : `lib/data/category-icon-map.ts`
- **Order statuses** : `lib/data/admin-orders.ts` → `ORDER_STATUS_TRANSITIONS`

### Déjà Implémenté
- `FAQ_DATA` dans `lib/data/faq.ts` ✅
- `CATEGORY_ICONS` dans `lib/data/category-icon-map.ts` ✅

---

## 📋 **Checklist Avant de Modifier le Code**

- [ ] Pas de modifications à fichiers migrations existants
- [ ] `force-dynamic` sur pages utilisant `getDb()` / `getAuth()`
- [ ] `await` sur `getDb()` et `getAuth()`
- [ ] `db.batch()` pour multi-statement writes
- [ ] Server actions validées au runtime (pas juste TypeScript)
- [ ] Sticky elements utilisent `top`, pas `margin-top`
- [ ] Pas de `build: "opennextjs-cloudflare build"` dans package.json
- [ ] `bun run dev` sur port 33000, pas 3000
- [ ] Secrets via `wrangler secret put`, pas en clair
- [ ] LIKE queries avec ESCAPE `'\\'`
- [ ] Chemins bash avec parentheses quotés
- [ ] Composants lourds lazy-loaded
- [ ] Event listeners scroll/touch avec `{ passive: true }`
- [ ] Data arrays statiques en dehors des composants

---

**Dernière mise à jour** : 2026-05-23
