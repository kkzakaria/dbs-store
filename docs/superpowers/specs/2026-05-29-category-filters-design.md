# Refonte des filtres — pages catégories

Date : 2026-05-29
Statut : validé (brainstorming), prêt pour plan d'implémentation

## Contexte

Les pages catégories (`app/(main)/[slug]/page.tsx` + `components/products/product-filters.tsx`) affichent une sidebar de boutons-bascule pour le tri, la marque et un « prix max » à paliers fixes. Problèmes identifiés :

- **UX/mobile** : sur mobile les filtres s'empilent au-dessus de la grille et prennent toute la hauteur.
- **Look daté** : liste brute de boutons dans la sidebar.
- **Fonctions manquantes** : pas de fourchette de prix, pas de multi-sélection de marques, pas de résumé/effacement, tri mélangé aux filtres.
- **Bug** : les marques sont dérivées du résultat **déjà filtré** (`[...new Set(items.map(p => p.brand))]`), donc choisir une marque réduit la liste à cette seule marque — impossible d'en changer sans réinitialiser.

## Objectifs

1. Améliorer l'ergonomie, surtout mobile.
2. Moderniser le visuel.
3. Ajouter : fourchette de prix (Min/Max), multi-sélection de marques, puces de filtres actifs + « Tout effacer », tri séparé.
4. Corriger le bug des marques qui disparaissent.

Hors périmètre : refonte de la grille produit, de la recherche, ou des pages promo (la recherche garde sa barre horizontale existante).

## Architecture

- **Desktop** : 2 colonnes — sidebar filtres (~13rem) à gauche, grille produits à droite (inchangé structurellement).
- **Mobile** : 1 colonne. Bouton sticky « Filtres (N) » ouvrant un **tiroir plein écran** (`components/ui/sheet.tsx`).
- **Tri** : extrait des filtres, rendu via `Select` (`components/ui/select.tsx`) aligné à droite au-dessus de la grille (desktop et mobile).
- **État** : dans l'URL (search params) — partageable, compatible avec le rendu serveur `force-dynamic` actuel.
- **Aucune nouvelle dépendance** : réutilise `sheet`, `select`, `badge`, `input`, `button`.

### Params d'URL

| Param      | Format                              | Remplace        |
|------------|-------------------------------------|-----------------|
| `marques`  | liste CSV : `samsung,xiaomi`        | `marque` (mono) |
| `prix_min` | entier FCFA                         | —               |
| `prix_max` | entier FCFA                         | `prix_max` (palier) |
| `tri`      | `nouveau \| prix_asc \| prix_desc`  | inchangé        |

Parsing robuste : `marques` vide/inconnues ignorées ; `prix_min`/`prix_max` non numériques ou négatifs ignorés ; `tri` validé contre la liste blanche.

## Composants

### `ProductFilters` (refonte — `components/products/product-filters.tsx`)
Corps des filtres, réutilisé **à l'identique** dans la sidebar desktop et le tiroir mobile. Props pour fonctionner soit en mode « URL direct » (desktop, instantané) soit en mode « brouillon contrôlé » (tiroir mobile).
- **Marques** : boutons-bascule multi-sélection (variant `default` si actif, `ghost` sinon), liste **complète** toujours visible.
- **Prix** : deux champs `Min` / `Max` (FCFA). Appliqués sur `Enter`/`blur`. Validation : si `Min > Max`, on **ignore** la borne fautive (on n'applique jamais une fourchette vide).

### `FilterDrawer` (nouveau — mobile)
Bouton « Filtres (N) » (N = nombre de filtres actifs) + `Sheet`. Contenu :
- `ProductFilters` en **mode brouillon** : les choix s'accumulent dans un état local React, rien ne recharge.
- Pied de page : bouton **« Voir les X produits »** où X = compteur **vivant** (voir Données). Au clic : pousse l'URL une fois, ferme le tiroir.

### `SortSelect` (nouveau)
`Select` de tri (Nouveautés / Prix croissant / Prix décroissant). Met à jour `tri` dans l'URL immédiatement, desktop et mobile.

### `ActiveFilters` (nouveau)
Puces (`Badge`) des filtres actifs : une par marque sélectionnée + une pour la fourchette de prix. ✕ individuel retire le param correspondant ; bouton « Tout effacer » réinitialise tout. Affiché au-dessus de la grille (desktop et mobile). Masqué si aucun filtre actif.

## Flux de données (`lib/data/products.ts`)

- `ProductFilters` : `brand?: string` → **`brands?: string[]`**. `getProductsByCategory` utilise `inArray(products.brand, brands)` quand `brands.length > 0`. `prix_min`/`prix_max` déjà gérés.
- **`getCategoryBrands(db, categoryId): Promise<string[]>`** (nouveau) : marques distinctes de la catégorie (`is_active = true`), **indépendantes des filtres en cours** → liste stable et complète. La page n'utilise plus `items` pour dériver les marques.
- **Compteur vivant** : server action `countCategoryProducts(categoryId, brouillon)` (`lib/actions/...`), appelée avec **debounce** depuis le tiroir mobile à chaque changement du brouillon. Renvoie le nombre de produits correspondants.
  - `"use server"` = endpoint HTTP public → **validation runtime** de tous les inputs (categoryId string, brands array de strings, prix entiers positifs), les types TS ne protègent pas.

## Page (`app/(main)/[slug]/page.tsx`)

- `searchParams` : `marques?`, `prix_min?`, `prix_max?`, `tri?`.
- Parse `marques` en tableau, valide les prix et le tri.
- Récupère les marques via `getCategoryBrands(db, category.id)` (plus de dérivation depuis `items`).
- Passe la liste des marques, les filtres courants et l'`id` de catégorie aux composants.

## Gestion des erreurs

- Params malformés → ignorés silencieusement (filtre simplement non appliqué), jamais d'erreur 500.
- Server action de comptage : entrées invalides → renvoie le total non filtré ou 0, sans throw côté client ; erreurs loguées serveur.
- Min > Max : on ignore la borne fautive, pas de fourchette vide ni de grille vide trompeuse.

## Tests (Vitest)

- Parsing des params : `marques` multiples, valeurs inconnues ignorées, `prix_min`/`prix_max` invalides ignorés, `tri` hors liste blanche ignoré.
- `getProductsByCategory` : `brands` multiples (`inArray`), fourchette de prix min+max, combinaison marques + prix + tri.
- `getCategoryBrands` : renvoie la liste **complète** quels que soient les filtres actifs (test de non-régression du bug).
- `countCategoryProducts` : validation des entrées (rejet/normalisation des inputs malformés), comptage correct.
- `ActiveFilters` : retirer une puce supprime le bon param ; « Tout effacer » vide tout.
- `FilterDrawer` : mode brouillon n'altère pas l'URL avant « Voir les X produits ».

## Décisions de design (issues du brainstorming)

- Structure : **sidebar desktop + tiroir mobile** (option A).
- Application : **instantané sur desktop**, **brouillon + bouton « Voir les X produits » sur mobile**.
- Prix : **champs Min/Max uniquement** (suppression des paliers fixes).
- Compteur : **vivant** dans le tiroir (server action de comptage avec debounce).
