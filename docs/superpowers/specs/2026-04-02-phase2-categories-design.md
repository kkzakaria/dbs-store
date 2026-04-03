# Phase 2 — Catégories dynamiques en D1 + Admin CRUD

## Contexte

Les 54 catégories (11 top-level + 43 sous-catégories) sont définies en dur dans `lib/data/categories.ts`. Elles sont importées de manière synchrone par la navigation, les pages catégories, les fiches produit et le formulaire admin produits. Cette phase les migre vers D1 avec un CRUD admin.

## Schéma D1

### Table `categories`

| Colonne    | Type    | Contraintes              |
|------------|---------|--------------------------|
| id         | TEXT    | PRIMARY KEY, NOT NULL     |
| slug       | TEXT    | NOT NULL, UNIQUE          |
| name       | TEXT    | NOT NULL                  |
| icon       | TEXT    | NOT NULL                  |
| image      | TEXT    | nullable — URL R2         |
| parent_id  | TEXT    | nullable — réf categories.id |
| order      | INTEGER | NOT NULL, DEFAULT 0       |
| created_at | INTEGER | NOT NULL                  |

- Hiérarchie à 2 niveaux max (parent → enfant)
- `id` = slug lisible (ex: `"smartphones"`, `"iphone"`) — identique aux IDs actuels
- `icon` = nom d'icône Lucide (requis). `image` = URL R2 (optionnelle, prioritaire à l'affichage)
- Pas de FK formelle sur `parent_id` — validation côté serveur

### Schéma Drizzle

Ajout dans `lib/db/schema.ts` :

```typescript
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  image: text("image"),
  parent_id: text("parent_id"),
  order: integer("order").default(0).notNull(),
  created_at: integer("created_at").notNull(),
});
```

Migration générée par `drizzle-kit generate` → `drizzle/0003_xxx.sql`.

## Couche données

`lib/data/categories.ts` est réécrit — le tableau statique est supprimé, remplacé par des fonctions async :

```typescript
getTopLevelCategories(db)        → Category[]  // parent_id IS NULL, ORDER BY order
getSubcategories(db, parentId)   → Category[]  // WHERE parent_id = ?, ORDER BY order
getAllCategories(db)              → Category[]  // toutes, ORDER BY order
getCategoryBySlug(db, slug)      → Category | null
getCategoryById(db, id)          → Category | null
```

Le type `Category` correspond aux colonnes de la table. Toutes les fonctions prennent `db` (instance Drizzle) en premier paramètre.

Pas de cache mémoire — le cache KV sera ajouté en Phase 4.

## Admin CRUD

### Routes

- `/admin/categories` — page principale (liste + actions)
- Server actions dans `lib/actions/admin-categories.ts`

### Sidebar

Nouvelle entrée "Catégories" dans `components/admin/sidebar.tsx`, entre "Hero" et "Produits".

### Liste (page principale)

- Liste plate : top-level en gras, sous-catégories indentées avec trait vertical
- Colonnes : icône/image, nom, slug, nombre de produits, ordre, actions (éditer, supprimer)
- Bouton "Nouvelle catégorie" en haut

### Modale create/edit

Champs :
- **Nom** (texte, requis)
- **Slug** (auto-généré depuis le nom, éditable, requis, unique)
- **Icône Lucide** (select parmi une liste prédéfinie, requis)
- **Image** (upload R2 optionnel via presigned URL — même pattern que images produits)
- **Parent** (select des top-level ou "Aucun" pour créer un top-level)
- **Ordre** (number, défaut 0)

### Suppression

- Modale de confirmation
- **Bloquée** si la catégorie a des produits rattachés (`category_id` ou `subcategory_id`)
- **Bloquée** si c'est un parent avec des sous-catégories (supprimer les enfants d'abord)

### Server actions

```typescript
createCategory(data: CategoryFormData)  → validation + INSERT
updateCategory(id: string, data)        → validation + UPDATE
deleteCategory(id: string)              → vérif produits/enfants + DELETE
```

Validation serveur : slug unique, parent existe si spécifié, pas d'auto-référence.

## Migration des consommateurs

### Stratégie navigation

Le layout principal `app/(main)/layout.tsx` charge toutes les catégories en une seule requête (`getAllCategories(db)`) et les passe en props aux composants nav. Pas de requête par composant.

### Fichiers impactés

| Fichier | Changement |
|---------|------------|
| `app/(main)/layout.tsx` | Charge `getAllCategories(db)`, passe en props à la nav |
| `components/layout/app-bar/desktop-nav.tsx` | Reçoit les catégories en props (plus d'import statique) |
| `components/layout/app-bar/mobile-menu.tsx` | Idem — reçoit en props |
| `components/layout/app-bar/category-tray.tsx` | Aucun changement — reçoit déjà en props, type inchangé |
| `app/(main)/[slug]/page.tsx` | `await getCategoryBySlug(db, slug)` + `await getSubcategories(db, cat.id)`. Supprime `generateStaticParams`, ajoute `force-dynamic` |
| `app/(main)/produits/[slug]/page.tsx` | `await getCategoryById(db, product.category_id)` au lieu de `categories.find()` |
| `components/admin/product-form.tsx` | Reçoit `categories` en props (chargées dans la page parente) |
| `app/(admin)/admin/produits/page.tsx` | `await getAllCategories(db)` pour le `categoryMap` |
| `app/(admin)/admin/produits/nouveau/page.tsx` | Charge et passe les catégories au `ProductForm` |
| `app/(admin)/admin/produits/[id]/page.tsx` | Idem |

### Pages force-dynamic

`app/(main)/[slug]/page.tsx` passe en `force-dynamic` et supprime `generateStaticParams`.

## Seed

- Insertion des 54 catégories existantes (IDs identiques au fichier statique actuel)
- Utilise `db.batch([...])` pour insertion atomique
- **Pas de migration de données produits nécessaire** — les `category_id`/`subcategory_id` des produits référencent déjà ces IDs
- Script dédié ou intégré dans `lib/db/seed.ts`
- À exécuter en local (`db:seed`) et en production (`wrangler d1 execute`)

## Hors scope

- Cache KV pour les catégories (Phase 4)
- Recherche dans les catégories (Phase 3)
- Images de catégories existantes — le champ `image` reste null pour les 54 catégories migrées, à remplir manuellement via le CRUD admin
