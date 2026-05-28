# Suivi de variante dans les commandes

**Date :** 2026-05-28  
**Statut :** Approuvé

## Contexte

Les variantes de couleur sont actuellement stockées en JSON dans `products.colors`. Le panier (`CartItem`) et les lignes de commande (`order_items`) n'ont aucun champ variante — il est impossible de savoir quelle couleur a été commandée, et le stock est partagé entre toutes les couleurs d'un produit.

## Objectifs

- Tracker la couleur choisie dans chaque ligne de commande
- Gérer un stock distinct par couleur
- Supporter un prix différent par couleur (`price_override`)
- Rétrocompatibilité : les commandes et produits sans variante continuent de fonctionner

## Périmètre

- Variantes = couleurs uniquement (pas de taille, RAM, stockage)
- Pas de variantes multiples combinées (couleur × capacité)

---

## 1. Modèle de données

### Nouvelle table `product_variants`

```sql
CREATE TABLE product_variants (
  id            TEXT PRIMARY KEY,          -- nanoid
  product_id    TEXT NOT NULL REFERENCES products(id),
  color_name    TEXT NOT NULL,
  color_hex     TEXT NOT NULL,             -- ex: "#1C1C1E"
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_override INTEGER,                  -- null = prix du produit parent
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL           -- timestamp Unix
);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
```

La contrainte `CHECK (stock >= 0)` est le filet de sécurité anti-survente : si une race condition fait descendre le stock en négatif, le batch D1 échoue entièrement et aucune commande n'est insérée.

### Modifications `order_items`

Trois colonnes nullable ajoutées (nullable pour compatibilité avec les commandes existantes) :

```sql
ALTER TABLE order_items ADD COLUMN variant_id  TEXT;   -- FK → product_variants.id
ALTER TABLE order_items ADD COLUMN color_name  TEXT;   -- snapshot dénormalisé
ALTER TABLE order_items ADD COLUMN color_hex   TEXT;   -- snapshot dénormalisé
```

Les champs `color_name` / `color_hex` sont snapshotés au moment de la commande, comme `product_name` et `product_image`, pour que l'historique reste stable même si la variante est modifiée ou supprimée.

### Migration des données existantes

Un script SQL (migration `0006_product_variants.sql`) :
1. Crée la table `product_variants` avec l'index et le CHECK
2. Ajoute les colonnes sur `order_items`
3. Pour chaque produit avec `colors` JSON non vide : insère une ligne `product_variants` par couleur, avec `stock = ROUND(products.stock / nb_couleurs)` comme valeur initiale

Le champ `products.colors` est conservé en base mais ignoré côté applicatif après la migration.

---

## 2. Types TypeScript

### `ProductVariant` (nouveau, dans `lib/db/schema.ts`)

```typescript
export type ProductVariant = {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  stock: number;
  priceOverride: number | null;
  sortOrder: number;
  createdAt: Date;
};
```

### `Product` mis à jour

- `variants: ProductVariant[]` remplace `colors: ProductColor[]` comme source de vérité
- `colors` reste dans le type pour la rétrocompatibilité jusqu'à nettoyage final

### `CartItem` mis à jour (`lib/cart.ts`)

```typescript
export type CartItem = {
  productId: string;
  variantId: string | null;   // null si le produit n'a pas de variantes
  slug: string;
  name: string;
  price: number;              // prix effectif = price_override ?? product.price
  image: string;
  colorName: string | null;
  colorHex: string | null;
  quantity: number;
};
```

---

## 3. Couche données (`lib/data/`)

### `getProduct()` et `getProductCached()`

Fetch joint sur `product_variants` en plus du produit. Le type de retour inclut `product.variants: ProductVariant[]`.

### `getVariantsByProductId()` (nouveau, `lib/data/variants.ts`)

Fonction utilitaire pour récupérer les variantes d'un produit, utilisée dans les server actions admin.

### Fonctions de listing (`getProductsByCategory`, `searchProducts`, `getPromoProducts`, etc.)

Les pages de listing affichent les swatches dans les cartes produit et permettent l'ajout au panier avec une variante sélectionnée — elles ont donc besoin des variantes. Pour éviter le N+1, les fonctions de listing adoptent un **batch join** :

1. Fetch les produits (requête existante inchangée)
2. Collecter tous les `product_id` du résultat
3. Une seule requête `WHERE product_id IN (...)` sur `product_variants`
4. Attacher les variantes aux produits en mémoire

Coût : 2 requêtes par page de listing au lieu de 1. Acceptable à cette échelle.

---

## 4. Couche panier (`lib/cart.ts`)

- **Clé d'unicité** : `variantId` (non-null) ou `productId` (si pas de variante). Même produit en deux couleurs = deux lignes distinctes dans le panier.
- **`addItem`** : identifie les doublons par `variantId ?? productId`
- **`removeItem` / `setQuantity`** : même logique
- **Migration Zustand** : `version` passe de `1` à `2`. `migrate()` vide le panier (les items sans `variantId` sont incompatibles).

---

## 5. UI — Page produit (`app/(main)/produits/[slug]/page.tsx`)

### Nouveau composant `ProductActions` (client)

Remplace `<AddToCartButton product={product} />` dans la page produit. Reçoit `variants` et `basePrice` en props depuis le Server Component.

**Rendu :**
- Si `variants.length === 0` → bouton "Ajouter au panier" directement (comportement actuel)
- Si `variants.length > 0` :
  - Swatches cliquables par couleur (style identique aux swatches de `product-card.tsx`)
  - Swatch désactivée + opacité réduite si `variant.stock === 0`
  - Prix mis à jour si `variant.price_override !== null`
  - Stock affiché pour la variante sélectionnée
  - Bouton "Ajouter au panier" avec la variante sélectionnée

### `AddToCartButton` mis à jour

Accepte `variant: ProductVariant | null` en plus de `product`. Construit le `CartItem` avec les champs variante le cas échéant.

### `product-card.tsx`

Le sélecteur de couleur existant est adapté pour itérer sur `product.variants` au lieu de `product.colors`. L'ajout au panier depuis la carte passe la variante actuellement sélectionnée.

---

## 6. Server action `createOrder` (`lib/actions/orders.ts`)

### Nouveau flux de validation

1. Séparer les items en deux groupes : avec `variantId` / sans `variantId`
2. Fetch `product_variants` pour le groupe avec variante (stock, price_override, product_id)
3. Fetch `products` pour le groupe sans variante (prix, is_active) — comme actuellement
4. Vérifier `variant.stock >= item.quantity` pour chaque variante → `throw new Error("STOCK_INSUFFICIENT:${variantId}")` sinon
5. Prix autoritatif : `variant.price_override ?? product.price`

### Batch D1 mis à jour

```typescript
db.batch([
  // Décrémentations de stock (une par item avec variantId)
  ...variantItems.map(item =>
    db.update(product_variants)
      .set({ stock: sql`stock - ${item.quantity}` })
      .where(eq(product_variants.id, item.variantId!))
  ),
  // Insert order
  db.insert(orders).values({ ... }),
  // Insert order_items avec snapshot variante
  db.insert(order_items).values(items.map(item => ({
    id: randomUUID(),
    order_id: orderId,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    product_name: item.name,
    product_slug: item.slug,
    product_image: item.image,
    color_name: item.colorName ?? null,
    color_hex: item.colorHex ?? null,
    unit_price: item.price,
    quantity: item.quantity,
    line_total: item.price * item.quantity,
  }))),
]);
```

La contrainte `CHECK (stock >= 0)` sur `product_variants` fait échouer le batch si le stock est insuffisant malgré la pré-vérification (race condition), sans qu'aucune commande partielle ne soit insérée.

---

## 7. Affichage dans les pages commandes

Les 4 surfaces affichant des `order_items` reçoivent le même traitement conditionnel :

- `/commande/[id]` — confirmation post-checkout
- `/compte/commandes/[id]` — détail commande utilisateur
- `/admin/commandes/[id]` — détail commande admin

**Pattern d'affichage dans chaque ligne d'item :**

```
[image]  iPhone 15 Pro                    ×2    850 000 FCFA
          ● Noir Titane
```

Si `color_name` et `color_hex` sont présents → cercle coloré + label. Sinon → affichage inchangé.

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `migrations/0006_product_variants.sql` | Nouveau — crée `product_variants`, modifie `order_items`, migre le JSON |
| `lib/db/schema.ts` | Nouveau type `ProductVariant`, table Drizzle, colonnes `order_items` |
| `lib/data/products.ts` | `getProduct()` + fonctions de listing : batch join variants, type `Product` mis à jour |
| `lib/data/variants.ts` | Nouveau — `getVariantsByProductId()` |
| `lib/cart.ts` | `CartItem` mis à jour, clé d'unicité `variantId`, migration v2 |
| `lib/order-utils.ts` | `CartItemInput` reflète `CartItem` (automatique via alias) |
| `lib/actions/orders.ts` | Validation stock variante + décrémentation batch |
| `components/products/product-actions.tsx` | Nouveau composant client (swatches + prix + bouton) |
| `components/products/add-to-cart-button.tsx` | Accepte `variant` en prop |
| `components/products/product-card.tsx` | Utilise `product.variants` au lieu de `product.colors` |
| `components/cart/cart-item-row.tsx` | Affiche swatch couleur si présente |
| `app/(main)/produits/[slug]/page.tsx` | Remplace `AddToCartButton` par `ProductActions` |
| `app/(main)/commande/[id]/page.tsx` | Affichage swatch conditionnel |
| `app/(compte)/compte/commandes/[id]/page.tsx` | Affichage swatch conditionnel |
| `app/(admin)/admin/commandes/[id]/page.tsx` | Affichage swatch conditionnel |

## Tests

- Ajout au panier d'un produit sans variante → comportement inchangé
- Ajout au panier d'un produit avec variante → `variantId` présent dans le store
- Même produit, deux couleurs différentes → deux lignes distinctes dans le panier
- Commande avec variante en rupture → erreur `STOCK_INSUFFICIENT` avant le batch
- Race condition → `CHECK (stock >= 0)` fait échouer le batch, aucune commande insérée
- Historique commandes → swatch affiché si `color_name` présent, invisible sinon
