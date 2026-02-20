# Design — Pages produits et détail produit

Date : 2026-02-19
Stack : Next.js 16 + Drizzle ORM + SQLite3 (local) + Cloudflare D1 (prod)

## Contexte

E-commerce DBS Store (électronique, Côte d'Ivoire / zone UEMOA). Les pages produits sont inexistantes. La homepage affiche des produits mock en dur. L'objectif est d'implémenter :

1. Une page listing par catégorie/sous-catégorie
2. Une page détail produit

## Décisions d'architecture

### ORM : Drizzle

Drizzle supporte SQLite3 (local via `better-sqlite3`) et D1 (prod via binding Cloudflare) avec le même schéma et les mêmes requêtes. Better Auth continue d'utiliser sa propre connexion `better-sqlite3` sur la même DB.

### Catégories : statiques

Les catégories restent dans `lib/data/categories.ts`. Pas de migration en DB. Les produits référencent les slugs de catégories.

## Schéma Drizzle — table `products`

```ts
products: {
  id          TEXT PK                    // slug du produit
  name        TEXT NOT NULL
  slug        TEXT UNIQUE NOT NULL
  category_id    TEXT NOT NULL           // slug catégorie parente (ex: "smartphones")
  subcategory_id TEXT NULL               // slug sous-catégorie (ex: "iphone")
  price       INTEGER NOT NULL           // FCFA entiers
  old_price   INTEGER NULL               // pour les promos
  brand       TEXT NOT NULL
  images      TEXT NOT NULL              // JSON array de chemins
  description TEXT NOT NULL
  specs       TEXT NOT NULL              // JSON objet clé/valeur
  stock       INTEGER DEFAULT 0
  badge       TEXT NULL                  // "Nouveau" | "Populaire" | "Promo"
  is_active   INTEGER DEFAULT 1
  created_at  INTEGER NOT NULL           // unix timestamp
}
```

## Routes

```
app/(main)/
  [slug]/
    page.tsx        → listing catégorie OU sous-catégorie
  produits/
    [slug]/
      page.tsx      → détail produit
```

### Page listing `/(main)/[slug]`

- Slug peut être une catégorie (`smartphones`) ou sous-catégorie (`iphone`)
- Sidebar : filtres marque, fourchette prix, tri
- Grille de cards produits
- Breadcrumb contextuel
- Filtres via `searchParams` (`?marque=apple&prix_max=500000&tri=prix_asc`)
- `generateStaticParams` sur les slugs de catégories connus
- Server Component

### Page détail `/produits/[slug]`

- Galerie d'images (principale + miniatures)
- Nom, prix, badge, stock
- Bouton "Ajouter au panier" (désactivé si rupture)
- Tableau de specs techniques
- Description longue
- Breadcrumb complet
- Section "Produits similaires" (même sous-catégorie, 4 produits)
- Server Component

## Couche données

### `lib/db.ts`

Connexion conditionnelle :
- Local : `drizzle(new Database(process.env.DATABASE_URL ?? "./dev.db"))`
- Prod : `drizzle(env.DB)` via binding Cloudflare D1

### `lib/data/products.ts`

Fonctions de requête :
- `getProductsByCategory(db, slug, filters?)` — listing avec filtres optionnels
- `getProduct(db, slug)` — détail produit
- `getRelatedProducts(db, productId, subcategoryId)` — 4 produits similaires

### Scripts

- `bun run db:generate` → drizzle-kit generate
- `bun run db:migrate` → drizzle-kit migrate
- `bun run db:seed` → peuple la DB locale avec ~20 produits mock

### Images

Placeholders `/images/products/[slug].jpg` pour l'instant. Structure prête pour Cloudflare R2 plus tard.

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `lib/db/schema.ts` | Nouveau — schéma Drizzle |
| `lib/db/index.ts` | Nouveau — connexion conditionnelle |
| `lib/data/products.ts` | Nouveau — fonctions de requête |
| `drizzle.config.ts` | Nouveau — config drizzle-kit |
| `scripts/seed.ts` | Nouveau — seed 20 produits mock |
| `app/(main)/[slug]/page.tsx` | Nouveau — page listing |
| `components/products/product-card.tsx` | Nouveau — card réutilisable |
| `components/products/product-filters.tsx` | Nouveau — sidebar filtres |
| `app/(main)/produits/[slug]/page.tsx` | Nouveau — page détail |
| `components/products/product-gallery.tsx` | Nouveau — galerie images |
| `components/products/product-specs.tsx` | Nouveau — tableau specs |
| `package.json` | Modifier — ajouter drizzle-orm, drizzle-kit, @cloudflare/d1 types |
