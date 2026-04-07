# Phase 6 — Page Offres/Promotions — Design

**Date:** 2026-04-07
**Phase:** 6 (PRD v1 roadmap)
**Statut:** Design validé

## Objectif

Exposer une page publique listant tous les produits actifs en promotion (`old_price IS NOT NULL`), avec filtres catégorie + tri, accessible depuis la navigation principale.

## Scope

- Route `/offres` (server component, `dynamic = "force-dynamic"`)
- Filtres : catégorie (top-level) + tri (% remise desc par défaut, prix asc/desc, nouveauté)
- Lien dans la navigation header (desktop + mobile menu)
- Tests : data layer + rendu page

## Hors scope (YAGNI)

- Pagination "Charger plus" (volume promo faible en v1)
- Filtres marque/prix
- Metadata SEO avancées (Phase 10)
- Lien footer (Phase 9 quand le footer sera créé)

## Architecture

### Data layer — `lib/data/products.ts`

Nouvelle fonction :

```ts
export type PromoFilters = {
  category_id?: string;
  tri?: "remise_desc" | "prix_asc" | "prix_desc" | "nouveau";
};

export async function getPromoProductsFiltered(
  db: Db,
  filters: PromoFilters = {}
): Promise<Product[]>
```

- Conditions : `is_active = 1 AND old_price IS NOT NULL`
- Ajoute `(category_id = filters.category_id OR subcategory_id = filters.category_id)` si fourni
- Tris :
  - `remise_desc` (défaut) : `ORDER BY (old_price - price) * 1.0 / old_price DESC`
  - `prix_asc` / `prix_desc` : sur `price`
  - `nouveau` : `created_at DESC`
- Réutilise `parseProduct` existant

`getPromoProducts` existant (limit-only) reste inchangé pour homepage / empty state recherche.

### Page — `app/(main)/offres/page.tsx`

- Server component, `force-dynamic`
- Lit `searchParams` : `categorie` (slug), `tri`
- Résout `categorie` → `category_id` via `getCachedCategoryBySlug`
- Charge en parallèle : `getPromoProductsFiltered` + `getCachedTopLevelCategories`
- Render :
  - Breadcrumb Accueil / Offres
  - H1 "Offres & Promotions" + count
  - `<PromoFilters>` (client)
  - Grille `ProductCard` (badge `-X%` déjà géré par `ProductCard`)
  - État vide si aucun produit

### Composant client — `components/promo/promo-filters.tsx`

- Reproduit le pattern de `components/search/search-filters.tsx` (router.push avec searchParams)
- Affiche : tri (4 options) + catégories top-level (toggle)

### Navigation

- `components/layout/app-bar/desktop-nav.tsx` : ajout d'un `<Link href="/offres">Offres</Link>` après les NavItems catégories (avant le bouton "Plus")
- `components/layout/app-bar/mobile-menu.tsx` : ajout d'une entrée hardcodée "Offres & Promotions" en tête de la liste top-level, avec un style mis en avant (fond `bg-red-50`, texte `text-red-600`) pour la distinguer des catégories normales

## Tests

### `tests/lib/data/promo-products.test.ts`
- `getPromoProductsFiltered` retourne uniquement produits actifs avec `old_price`
- Filtre catégorie (top-level + sous-catégorie)
- Tri `remise_desc` ordonne par % de remise décroissante
- Tris `prix_asc`, `prix_desc`, `nouveau` corrects

### `tests/app/offres-page.test.tsx`
- Rendu liste avec produits promo
- État vide si aucun produit
- Count affiché

## Validation

- Validation des `searchParams` côté server : `categorie` slug normalisé via lookup, `tri` whitelisté contre `["remise_desc", "prix_asc", "prix_desc", "nouveau"]`

## Checkpoint

- [ ] Page `/offres` accessible et fonctionnelle
- [ ] Lien visible dans header desktop + mobile menu
- [ ] Tests passent (data + page)
- [ ] CI verte
- [ ] Deploy prod OK
