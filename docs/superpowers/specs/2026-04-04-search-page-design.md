# Phase 3 — Page Recherche

## Résumé

Page `/recherche` avec recherche full-text (LIKE) sur les produits, filtres en barre horizontale, pagination "charger plus", et suggestions live dans l'overlay de recherche de l'app-bar.

## Décisions

| Décision | Choix |
|---|---|
| Recherche full-text | SQL LIKE (pas FTS5) — catalogue petit, simplicité privilégiée |
| Layout filtres | Barre horizontale au-dessus de la grille (cohérent avec page catégorie) |
| Pagination | Bouton "Charger plus" — 12 produits par batch |
| Overlay suggestions | Noms de produits uniquement, max 5, déclenche après 3 caractères |
| État vide | Message "Aucun résultat" + produits populaires |

## 1. Data layer

### `searchProducts(db, query, filters, offset, limit)`

Dans `lib/data/products.ts`.

**Requête :**
```sql
SELECT * FROM products
WHERE (name LIKE '%q%' OR description LIKE '%q%' OR brand LIKE '%q%')
  AND is_active = 1
  [AND category_id = ?]
  [AND brand = ?]
  [AND price >= ?]
  [AND price <= ?]
ORDER BY [tri]
LIMIT 13 OFFSET n
```

- Fetch `limit + 1` (13) pour déterminer `hasMore`
- Retourne `{ products: Product[], hasMore: boolean, total: number }`
- `total` obtenu via un `SELECT COUNT(*)` en parallèle avec la même clause WHERE (pour afficher "X résultats" dans le header)
- Filtres optionnels : `category_id`, `brand`, `prix_min`, `prix_max`
- Tri : `nouveau` (created_at DESC), `prix_asc` (price ASC), `prix_desc` (price DESC), défaut : name LIKE match en priorité (name match d'abord via `CASE WHEN name LIKE '%q%' THEN 0 ELSE 1 END, created_at DESC`)

### `suggestProducts(db, query, limit)`

Dans `lib/data/products.ts`.

**Requête :**
```sql
SELECT id, name, slug, brand, price, images FROM products
WHERE (name LIKE '%q%' OR brand LIKE '%q%')
  AND is_active = 1
LIMIT 5
```

- Retourne `{ id: string, name: string, slug: string, brand: string, price: number, image: string }[]`
- `image` = première image du tableau JSON parsé

## 2. Server actions

`lib/actions/search.ts` :

```typescript
export async function searchSuggestions(query: string)
```

- Valide `query.length >= 3`, retourne `[]` sinon
- Appelle `suggestProducts(db, query)`
- Appelée côté client avec debounce 300ms

```typescript
export async function loadMoreSearchResults(query: string, filters: SearchFilters, offset: number)
```

- Appelle `searchProducts(db, query, filters, offset, 12)`
- Retourne `{ products: Product[], hasMore: boolean }`
- Appelée par le composant `SearchLoadMore`

## 3. Page `/recherche`

`app/(main)/recherche/page.tsx` — server component.

- `export const dynamic = "force-dynamic"`
- Lit searchParams : `q`, `categorie`, `marque`, `prix_min`, `prix_max`, `tri`
- Appelle `searchProducts(db, query, filters, 0, 12)` pour le premier batch
- Si `q` absent ou vide : affiche un message invitant à rechercher

### Composants

**`SearchResults`** (dans la page server) :
- Header : "Résultats pour «{q}»" + nombre de résultats
- Grille de `ProductCard` — 2 cols mobile, 3 cols tablette, 4 cols desktop
- Passe `initialProducts`, `hasMore`, `query`, `filters` au client component

**`SearchLoadMore`** (client component) :
- Bouton "Charger plus" en bas de la grille
- Appelle une server action `loadMoreSearchResults(query, filters, offset)` avec offset += 12
- Append les nouveaux produits à la liste locale
- Masque le bouton quand `hasMore = false`
- État loading sur le bouton pendant le fetch

**`SearchFilters`** (client component) :
- Barre horizontale avec filtres boutons (même pattern que `ProductFilters`)
- Catégorie : dropdown des catégories top-level
- Marque : dropdown dynamique
- Prix max : paliers 100 000, 300 000, 500 000, 1 000 000 FCFA
- Tri : Plus récent, Prix croissant, Prix décroissant
- Met à jour les searchParams URL via `router.push()`
- Reset du "charger plus" (offset revient à 0) quand un filtre change

### État vide

Quand `products.length === 0` :
- Message : "Aucun résultat pour «{q}»"
- Suggestion de reformuler
- Grille de produits populaires via `getPromoProducts(db)` avec titre "Produits populaires"

## 4. Search overlay — Suggestions live

Modifications de `components/layout/app-bar/search-overlay.tsx` :

- `onChange` sur l'input : si `query.length >= 3`, appelle `searchSuggestions(query)` avec debounce 300ms
- Liste de max 5 suggestions sous l'input : nom du produit + marque + prix formaté
- Clic sur une suggestion → `router.push('/produits/{slug}')` + ferme l'overlay
- Navigation clavier : flèches haut/bas pour naviguer, Entrée pour sélectionner
- Entrée sans suggestion sélectionnée → `router.push('/recherche?q={query}')` + ferme l'overlay
- État loading : spinner pendant le fetch des suggestions
- Ferme l'overlay après toute navigation

## 5. Filtres — Détail des searchParams

| Param | Valeurs | Exemple |
|---|---|---|
| `q` | string libre | `?q=iphone` |
| `categorie` | slug catégorie top-level | `?categorie=smartphones` |
| `marque` | nom de marque exact | `?marque=Apple` |
| `prix_min` | entier FCFA | `?prix_min=50000` |
| `prix_max` | entier FCFA | `?prix_max=300000` |
| `tri` | `nouveau`, `prix_asc`, `prix_desc` | `?tri=prix_asc` |

## 6. Tests

| Test | Type | Vérifie |
|---|---|---|
| `searchProducts` | unitaire | Requête LIKE, filtres combinés, pagination offset/limit, `hasMore` |
| `suggestProducts` | unitaire | Seuil 3 caractères, limite 5, format retour léger |
| `SearchFilters` | composant | Boutons mettent à jour searchParams URL |
| `SearchLoadMore` | composant | Fetch batch suivant, append, disparition bouton quand `!hasMore` |
| Search overlay | composant | Debounce, affichage suggestions, navigation clavier, redirection |

Pattern : Vitest + React Testing Library + jsdom, fichiers dans `tests/` miroir structure source.

## 7. Fichiers impactés

**Nouveaux :**
- `app/(main)/recherche/page.tsx`
- `components/search/search-load-more.tsx`
- `components/search/search-filters.tsx`
- `lib/actions/search.ts`
- `tests/lib/data/search-products.test.ts`
- `tests/components/search/search-filters.test.tsx`
- `tests/components/search/search-load-more.test.tsx`
- `tests/components/layout/app-bar/search-overlay.test.tsx`

**Modifiés :**
- `lib/data/products.ts` — ajout `searchProducts()`, `suggestProducts()`
- `components/layout/app-bar/search-overlay.tsx` — suggestions live
