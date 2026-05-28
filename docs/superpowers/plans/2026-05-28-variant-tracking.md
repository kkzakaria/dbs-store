# Suivi de variante dans les commandes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une table `product_variants` (couleur, stock, prix par couleur), propager `variantId`/`colorName`/`colorHex` dans le panier et les commandes, et afficher la couleur commandée partout dans l'historique.

**Architecture:** Nouvelle table `product_variants` normalisée (stock, price_override par couleur). Les données existantes (JSON `products.colors`) sont migrées vers cette table via SQL. Le panier (`CartItem`) et les lignes de commande (`order_items`) stockent une référence + snapshot de la variante. La décrémentation du stock se fait dans le même `db.batch()` que l'insertion de la commande, avec `CHECK (stock >= 0)` comme filet de sécurité anti-survente.

**Tech Stack:** Next.js App Router, Drizzle ORM, SQLite/D1, Zustand, Vitest + RTL

---

## Structure des fichiers

| Fichier | Créé / Modifié |
|---------|---------------|
| `migrations/0006_product_variants.sql` | Créé |
| `lib/db/schema.ts` | Modifié |
| `lib/data/variants.ts` | Créé |
| `lib/data/products.ts` | Modifié |
| `lib/cart.ts` | Modifié |
| `lib/actions/orders.ts` | Modifié |
| `components/products/add-to-cart-button.tsx` | Modifié |
| `components/products/product-actions.tsx` | Créé |
| `components/products/product-card.tsx` | Modifié |
| `components/cart/cart-item-row.tsx` | Modifié |
| `app/(main)/produits/[slug]/page.tsx` | Modifié |
| `app/(main)/checkout/checkout-form.tsx` | Modifié |
| `app/(main)/commande/[id]/page.tsx` | Modifié |
| `app/(compte)/compte/commandes/[id]/page.tsx` | Modifié |
| `app/(admin)/admin/commandes/[id]/page.tsx` | Modifié |
| `tests/lib/data/variants.test.ts` | Créé |
| `tests/lib/cart.test.ts` | Modifié |
| `tests/lib/actions/orders.test.ts` | Modifié |
| `tests/components/products/add-to-cart-button.test.tsx` | Modifié |
| `tests/components/products/product-actions.test.tsx` | Créé |
| `tests/components/products/product-card.test.tsx` | Modifié |

---

## Task 1: Migration SQL

**Files:**
- Create: `migrations/0006_product_variants.sql`

- [ ] **Créer la migration**

```sql
-- migrations/0006_product_variants.sql
CREATE TABLE product_variants (
  id             TEXT    NOT NULL PRIMARY KEY,
  product_id     TEXT    NOT NULL REFERENCES products(id),
  color_name     TEXT    NOT NULL,
  color_hex      TEXT    NOT NULL,
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_override INTEGER,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

ALTER TABLE order_items ADD COLUMN variant_id  TEXT;
ALTER TABLE order_items ADD COLUMN color_name  TEXT;
ALTER TABLE order_items ADD COLUMN color_hex   TEXT;

-- Migrer les couleurs JSON existantes vers product_variants
-- json_each() déroule le tableau JSON en lignes
INSERT INTO product_variants (id, product_id, color_name, color_hex, stock, sort_order, created_at)
SELECT
  lower(hex(randomblob(16)))                                              AS id,
  p.id                                                                    AS product_id,
  json_extract(c.value, '$.name')                                         AS color_name,
  json_extract(c.value, '$.hex')                                          AS color_hex,
  CASE
    WHEN json_array_length(p.colors) > 0
    THEN CAST(ROUND(CAST(p.stock AS REAL) / json_array_length(p.colors)) AS INTEGER)
    ELSE 0
  END                                                                     AS stock,
  c.key                                                                   AS sort_order,
  CAST(strftime('%s', 'now') AS INTEGER)                                  AS created_at
FROM products p, json_each(p.colors) AS c
WHERE json_array_length(p.colors) > 0;
```

- [ ] **Appliquer la migration au dev DB**

```bash
bun run db:migrate:dev
```

Résultat attendu : `Applying migration 0006_product_variants.sql` sans erreur.

- [ ] **Vérifier les données migrées**

```bash
sqlite3 dev.db "SELECT COUNT(*) FROM product_variants;"
sqlite3 dev.db "SELECT product_id, color_name, stock FROM product_variants LIMIT 5;"
```

Résultat attendu : au moins autant de lignes que de couleurs dans les produits seedés.

- [ ] **Commit**

```bash
git add migrations/0006_product_variants.sql
git commit -m "feat: migration product_variants + colonnes order_items"
```

---

## Task 2: Schema Drizzle + types TypeScript

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Écrire le test de type (smoke test)**

Créer `tests/lib/data/variants.test.ts` — juste les imports pour valider que les types compilent :

```typescript
import { describe, it, expect } from "vitest";
import type { ProductVariant } from "@/lib/db/schema";

describe("ProductVariant type", () => {
  it("has expected shape", () => {
    const v: ProductVariant = {
      id: "v1",
      product_id: "p1",
      color_name: "Noir",
      color_hex: "#000",
      stock: 5,
      price_override: null,
      sort_order: 0,
      created_at: new Date(),
    };
    expect(v.color_name).toBe("Noir");
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
bun run test tests/lib/data/variants.test.ts
```

Résultat attendu : FAIL — `ProductVariant` n'existe pas encore.

- [ ] **Ajouter la table `product_variants` et le type dans `lib/db/schema.ts`**

Ajouter après la définition de `products` (ligne ~20), avant `orders` :

```typescript
// ── Product Variants ──────────────────────────────────────────────────────────

export const product_variants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  product_id: text("product_id").notNull().references(() => products.id),
  color_name: text("color_name").notNull(),
  color_hex: text("color_hex").notNull(),
  stock: integer("stock").notNull().default(0),
  price_override: integer("price_override"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type ProductVariant = typeof product_variants.$inferSelect;
export type NewProductVariant = typeof product_variants.$inferInsert;
```

- [ ] **Mettre à jour le type `Product` pour inclure `variants`**

Trouver la définition de `Product` (ligne ~33) et ajouter le champ `variants` :

```typescript
export type Product = Omit<ProductRow, "images" | "specs" | "badge" | "colors"> & {
  images: string[];
  specs: Record<string, string>;
  badge: ProductBadge | null;
  colors: ProductColor[];
  variants: ProductVariant[];
};
```

- [ ] **Mettre à jour les colonnes `order_items` dans Drizzle**

Trouver la définition de `order_items` et ajouter les 3 colonnes nullable après `quantity` :

```typescript
export const order_items = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  order_id: text("order_id").notNull().references(() => orders.id),
  product_id: text("product_id").notNull(),
  variant_id: text("variant_id"),
  product_name: text("product_name").notNull(),
  product_slug: text("product_slug").notNull(),
  product_image: text("product_image").notNull(),
  color_name: text("color_name"),
  color_hex: text("color_hex"),
  unit_price: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  line_total: integer("line_total").notNull(),
});
```

- [ ] **Lancer le test pour vérifier qu'il passe**

```bash
bun run test tests/lib/data/variants.test.ts
```

Résultat attendu : PASS.

- [ ] **Vérifier que TypeScript compile**

```bash
bun run lint
```

Résultat attendu : seuls les warnings pré-existants, pas de nouvelles erreurs.

- [ ] **Commit**

```bash
git add lib/db/schema.ts tests/lib/data/variants.test.ts
git commit -m "feat: schema Drizzle product_variants + types"
```

---

## Task 3: Data layer — `lib/data/variants.ts`

**Files:**
- Create: `lib/data/variants.ts`
- Modify: `tests/lib/data/variants.test.ts`

- [ ] **Écrire les tests pour `getVariantsByProductIds`**

Remplacer le contenu de `tests/lib/data/variants.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProductVariant } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { getVariantsByProductId, getVariantsByProductIds } from "@/lib/data/variants";

const mockVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: "v1",
  product_id: "p1",
  color_name: "Noir",
  color_hex: "#000",
  stock: 5,
  price_override: null,
  sort_order: 0,
  created_at: new Date(),
  ...overrides,
});

function makeMockDb(rows: ProductVariant[]) {
  const query = { orderBy: vi.fn().mockResolvedValue(rows) };
  const whereResult = { orderBy: query.orderBy };
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(whereResult),
      }),
    }),
  };
}

describe("getVariantsByProductId", () => {
  it("returns variants for a given productId", async () => {
    const db = makeMockDb([mockVariant()]);
    const result = await getVariantsByProductId(db as never, "p1");
    expect(result).toHaveLength(1);
    expect(result[0].color_name).toBe("Noir");
  });

  it("returns empty array when no variants", async () => {
    const db = makeMockDb([]);
    const result = await getVariantsByProductId(db as never, "p1");
    expect(result).toHaveLength(0);
  });
});

describe("getVariantsByProductIds", () => {
  it("returns empty array for empty input", async () => {
    const db = makeMockDb([]);
    const result = await getVariantsByProductIds(db as never, []);
    expect(result).toHaveLength(0);
  });

  it("returns variants for multiple product ids", async () => {
    const variants = [
      mockVariant({ id: "v1", product_id: "p1" }),
      mockVariant({ id: "v2", product_id: "p2", color_name: "Blanc" }),
    ];
    const db = makeMockDb(variants);
    const result = await getVariantsByProductIds(db as never, ["p1", "p2"]);
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
bun run test tests/lib/data/variants.test.ts
```

Résultat attendu : FAIL — `getVariantsByProductId` non défini.

- [ ] **Créer `lib/data/variants.ts`**

```typescript
import { eq, inArray, asc } from "drizzle-orm";
import { product_variants } from "@/lib/db/schema";
import type { ProductVariant } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export async function getVariantsByProductId(
  db: Db,
  productId: string
): Promise<ProductVariant[]> {
  return db
    .select()
    .from(product_variants)
    .where(eq(product_variants.product_id, productId))
    .orderBy(asc(product_variants.sort_order));
}

export async function getVariantsByProductIds(
  db: Db,
  productIds: string[]
): Promise<ProductVariant[]> {
  if (productIds.length === 0) return [];
  return db
    .select()
    .from(product_variants)
    .where(inArray(product_variants.product_id, productIds))
    .orderBy(asc(product_variants.sort_order));
}
```

- [ ] **Lancer les tests pour vérifier qu'ils passent**

```bash
bun run test tests/lib/data/variants.test.ts
```

Résultat attendu : PASS (3 tests).

- [ ] **Commit**

```bash
git add lib/data/variants.ts tests/lib/data/variants.test.ts
git commit -m "feat: data layer variants — getVariantsByProductId/Ids"
```

---

## Task 4: Data layer — `lib/data/products.ts` avec batch join

**Files:**
- Modify: `lib/data/products.ts`
- Modify: `tests/lib/data/products.test.ts`

- [ ] **Vérifier les tests products existants (baseline)**

```bash
bun run test tests/lib/data/products.test.ts
```

Résultat attendu : tous PASS avant modification.

- [ ] **Mettre à jour `parseProduct` pour inclure `variants: []` par défaut**

Dans `lib/data/products.ts`, trouver la fonction `parseProduct` et modifier son `return` final :

```typescript
return { ...rest, images, specs, colors, badge: _badge as ProductBadge | null, variants: [] };
```

- [ ] **Ajouter les imports et le helper `attachVariants`**

En haut du fichier, ajouter l'import de `getVariantsByProductIds` :

```typescript
import { getVariantsByProductIds, getVariantsByProductId } from "@/lib/data/variants";
```

Ajouter la fonction `attachVariants` après `parseProduct` :

```typescript
async function attachVariants(db: Db, productList: Product[]): Promise<Product[]> {
  if (productList.length === 0) return productList;
  const ids = productList.map((p) => p.id);
  const allVariants = await getVariantsByProductIds(db, ids);
  const byProductId = new Map<string, typeof allVariants>();
  for (const v of allVariants) {
    const arr = byProductId.get(v.product_id) ?? [];
    arr.push(v);
    byProductId.set(v.product_id, arr);
  }
  return productList.map((p) => ({ ...p, variants: byProductId.get(p.id) ?? [] }));
}
```

- [ ] **Mettre à jour `getProduct` pour fetch les variantes**

Remplacer la fonction `getProduct` :

```typescript
export async function getProduct(db: Db, slug: string): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_active, true)))
    .limit(1);
  if (!result[0]) return null;
  const parsed = parseProduct(result[0]);
  const variants = await getVariantsByProductId(db, parsed.id);
  return { ...parsed, variants };
}
```

- [ ] **Mettre à jour toutes les fonctions de listing avec `attachVariants`**

Pour chaque fonction qui retourne `Product[]`, ajouter `return attachVariants(db, rows.map(parseProduct))` à la place de `return rows.map(parseProduct)`.

Fonctions à mettre à jour :
- `getProductsByCategory` — remplacer `return rows.map(parseProduct)` par `return attachVariants(db, rows.map(parseProduct))`
- `getRelatedProducts` — même changement
- `getPromoProducts` — même changement
- `getPromoProductsFiltered` — même changement
- `searchProducts` — remplacer `products: sliced.map(parseProduct)` par `products: await attachVariants(db, sliced.map(parseProduct))` (noter le `await` dans l'objet retourné : extraire en variable d'abord)

Pour `searchProducts`, le retour devient :

```typescript
const parsedProducts = await attachVariants(db, sliced.map(parseProduct));
return {
  products: parsedProducts,
  hasMore,
  total: Number(countResult[0]?.count ?? 0),
};
```

- [ ] **Mettre à jour les fixtures dans `tests/lib/data/products.test.ts`**

Chercher toutes les occurrences d'objets `Product` dans les tests et ajouter `variants: []` :

```bash
grep -n "colors:" tests/lib/data/products.test.ts | head -20
```

Pour chaque fixture produit dans ce fichier, ajouter `variants: []` après `colors: []`.

- [ ] **Lancer les tests**

```bash
bun run test tests/lib/data/products.test.ts tests/lib/data/variants.test.ts
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add lib/data/products.ts tests/lib/data/products.test.ts
git commit -m "feat: attachVariants helper + batch join variants dans les listings"
```

---

## Task 5: `lib/cart.ts` — CartItem v2 avec variantId

**Files:**
- Modify: `lib/cart.ts`
- Modify: `tests/lib/cart.test.ts`

- [ ] **Mettre à jour les tests du panier**

Remplacer le contenu de `tests/lib/cart.test.ts` :

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/cart";
import { act } from "@testing-library/react";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

const noVariantItem = {
  productId: "p1",
  variantId: null,
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  image: "/placeholder.svg",
  colorName: null,
  colorHex: null,
};

const variantItem = {
  productId: "p1",
  variantId: "v-noir",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  image: "/placeholder.svg",
  colorName: "Noir",
  colorHex: "#000",
};

const variantItem2 = {
  productId: "p1",
  variantId: "v-blanc",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_050_000,
  image: "/placeholder.svg",
  colorName: "Blanc",
  colorHex: "#fff",
};

describe("useCartStore — produit sans variante", () => {
  it("ajoute un item au panier vide", () => {
    act(() => useCartStore.getState().addItem(noVariantItem));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  it("incrémente la quantité sur doublon (même productId)", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().addItem(noVariantItem);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("supprime l'item via productId", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().removeItem("p1");
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("met à jour la quantité", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().setQuantity("p1", 5);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("supprime l'item quand la quantité est mise à 0", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().setQuantity("p1", 0);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("useCartStore — produit avec variantes", () => {
  it("ajoute deux couleurs comme deux lignes distinctes", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem2);
    });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("incrémente la quantité sur doublon de variante", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem);
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("stocke variantId, colorName, colorHex", () => {
    act(() => useCartStore.getState().addItem(variantItem));
    const item = useCartStore.getState().items[0];
    expect(item.variantId).toBe("v-noir");
    expect(item.colorName).toBe("Noir");
    expect(item.colorHex).toBe("#000");
  });

  it("supprime via variantId", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem2);
      useCartStore.getState().removeItem("v-noir");
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].variantId).toBe("v-blanc");
  });
});

describe("useCartStore — total et count", () => {
  it("calcule le total", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().setQuantity("p1", 2);
    });
    expect(useCartStore.getState().total()).toBe(2_000_000);
  });

  it("calcule le count", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem2);
    });
    expect(useCartStore.getState().count()).toBe(2);
  });
});
```

- [ ] **Lancer les tests pour vérifier qu'ils échouent**

```bash
bun run test tests/lib/cart.test.ts
```

Résultat attendu : FAIL — `variantId` non défini dans `CartItem`.

- [ ] **Mettre à jour `lib/cart.ts`**

Remplacer le contenu complet :

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const safeLocalStorage = createJSONStorage(() => ({
  getItem(name: string) {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(name); }
    catch (e) { console.error("[cart] Impossible de lire le panier:", e); return null; }
  },
  setItem(name: string, value: string) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(name, value); }
    catch (e) { console.error("[cart] Impossible de sauvegarder le panier:", e); }
  },
  removeItem(name: string) {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(name); }
    catch (e) { console.error("[cart] Impossible de supprimer le panier:", e); }
  },
}));

export type CartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  price: number;
  image: string;
  colorName: string | null;
  colorHex: string | null;
  quantity: number;
};

// Clé d'unicité : variantId si présent, sinon productId
const cartKey = (i: Pick<CartItem, "variantId" | "productId">) =>
  i.variantId ?? i.productId;

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem(item) {
        set((state) => {
          const key = cartKey(item);
          const existing = state.items.find((i) => cartKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },
      removeItem(key) {
        set((state) => ({ items: state.items.filter((i) => cartKey(i) !== key) }));
      },
      setQuantity(key, quantity) {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            cartKey(i) === key ? { ...i, quantity } : i
          ),
        }));
      },
      clear() {
        set({ items: [] });
      },
      total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: "dbs-cart",
      version: 2,
      storage: safeLocalStorage,
      migrate: () => ({ items: [] }),
      onRehydrateStorage: () => (_, error) => {
        if (error) console.error("[cart] Erreur de chargement du panier:", error);
      },
    }
  )
);
```

- [ ] **Lancer les tests**

```bash
bun run test tests/lib/cart.test.ts
```

Résultat attendu : tous PASS.

- [ ] **Mettre à jour les items dans `tests/lib/actions/orders.test.ts`**

Les items utilisés dans `buildOrder` doivent inclure les nouveaux champs. Trouver chaque objet item dans ce fichier et ajouter `variantId: null, colorName: null, colorHex: null` :

```typescript
// Avant :
{ productId: "p1", name: "A", slug: "a", price: 100_000, image: "/a.svg", quantity: 2 }

// Après :
{ productId: "p1", variantId: null, name: "A", slug: "a", price: 100_000, image: "/a.svg", colorName: null, colorHex: null, quantity: 2 }
```

- [ ] **Vérifier que les tests orders passent encore**

```bash
bun run test tests/lib/actions/orders.test.ts
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add lib/cart.ts tests/lib/cart.test.ts tests/lib/actions/orders.test.ts
git commit -m "feat: CartItem v2 avec variantId/colorName/colorHex, store migration v2"
```

---

## Task 6: `lib/actions/orders.ts` — validation stock variante + décrémentation

**Files:**
- Modify: `lib/actions/orders.ts`
- Modify: `tests/lib/actions/orders.test.ts`

- [ ] **Ajouter un test pour la validation du stock**

Dans `tests/lib/actions/orders.test.ts`, ajouter un describe pour `validateVariantStock` (fonction utilitaire extraite) :

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuth: vi.fn() }));

import { buildOrder } from "@/lib/order-utils";
import { validateVariantStock } from "@/lib/actions/orders";

// ... (tests buildOrder existants inchangés) ...

describe("validateVariantStock", () => {
  it("ne lève pas d'erreur si stock suffisant", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v1", quantity: 2 }],
        new Map([["v1", { stock: 5 }]])
      )
    ).not.toThrow();
  });

  it("lève STOCK_INSUFFICIENT si stock insuffisant", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v1", quantity: 3 }],
        new Map([["v1", { stock: 2 }]])
      )
    ).toThrow("STOCK_INSUFFICIENT:v1");
  });

  it("lève VARIANT_NOT_FOUND si la variante n'existe pas en DB", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v-unknown", quantity: 1 }],
        new Map()
      )
    ).toThrow("VARIANT_NOT_FOUND:v-unknown");
  });
});
```

- [ ] **Lancer le test pour vérifier qu'il échoue**

```bash
bun run test tests/lib/actions/orders.test.ts
```

Résultat attendu : FAIL — `validateVariantStock` non exporté.

- [ ] **Mettre à jour `lib/actions/orders.ts`**

Remplacer le contenu complet :

```typescript
"use server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { inArray, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, order_items, products, product_variants } from "@/lib/db/schema";
import type { PaymentMethod } from "@/lib/db/schema";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import type { CartItemInput } from "@/lib/order-utils";

export type CheckoutFormData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  payment_method: Extract<PaymentMethod, "cod">;
  items: CartItemInput[];
};

// Exporté pour les tests unitaires
export function validateVariantStock(
  variantItems: { variantId: string | null; quantity: number }[],
  variantMap: Map<string, { stock: number }>
): void {
  for (const item of variantItems) {
    if (!item.variantId) continue;
    const variant = variantMap.get(item.variantId);
    if (!variant) throw new Error(`VARIANT_NOT_FOUND:${item.variantId}`);
    if (variant.stock < item.quantity) throw new Error(`STOCK_INSUFFICIENT:${item.variantId}`);
  }
}

export async function createOrder(data: CheckoutFormData): Promise<{ orderId: string }> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion");
  if (!session.user.emailVerified) redirect("/email-non-verifie");

  if (!data.items || data.items.length === 0) throw new Error("EMPTY_CART");
  if (data.items.some((i) => i.quantity <= 0)) throw new Error("INVALID_QUANTITY");

  const db = await getDb();

  const itemsWithVariant = data.items.filter((i) => i.variantId != null);
  const variantIds = itemsWithVariant.map((i) => i.variantId!);
  const productIds = data.items.map((i) => i.productId);

  const [dbVariants, dbProducts] = await Promise.all([
    variantIds.length > 0
      ? db.select().from(product_variants).where(inArray(product_variants.id, variantIds))
      : Promise.resolve([]),
    db
      .select({ id: products.id, price: products.price, is_active: products.is_active })
      .from(products)
      .where(inArray(products.id, productIds)),
  ]);

  const variantMap = new Map(dbVariants.map((v) => [v.id, v]));
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.is_active) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
  }

  validateVariantStock(data.items, variantMap);

  const itemsWithPrices = data.items.map((item) => {
    const variant = item.variantId ? variantMap.get(item.variantId) : null;
    const product = productMap.get(item.productId)!;
    return { ...item, price: variant?.price_override ?? product.price };
  });

  const subtotal = itemsWithPrices.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0;
  const total = subtotal + shipping_fee;
  const orderId = randomUUID();
  const now = new Date();

  try {
    await db.batch([
      ...itemsWithVariant.map((item) =>
        db
          .update(product_variants)
          .set({ stock: sql`stock - ${item.quantity}` })
          .where(eq(product_variants.id, item.variantId!))
      ),
      db.insert(orders).values({
        id: orderId,
        user_id: session.user.id,
        status: "pending",
        payment_method: data.payment_method,
        payment_status: "pending",
        shipping_name: data.name,
        shipping_phone: data.phone,
        shipping_city: data.city,
        shipping_address: data.address,
        shipping_notes: data.notes ?? null,
        subtotal,
        shipping_fee,
        total,
        created_at: now,
        updated_at: now,
      }),
      db.insert(order_items).values(
        itemsWithPrices.map((item) => ({
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
        }))
      ),
    ]);
  } catch (err) {
    console.error("[createOrder] DB write failed", {
      userId: session.user.id,
      orderId,
      itemCount: data.items.length,
      error: err,
    });
    throw err;
  }

  return { orderId };
}
```

- [ ] **Lancer les tests**

```bash
bun run test tests/lib/actions/orders.test.ts
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add lib/actions/orders.ts tests/lib/actions/orders.test.ts
git commit -m "feat: createOrder — validation stock variante + décrémentation batch"
```

---

## Task 7: `AddToCartButton` — accepter la prop `variant`

**Files:**
- Modify: `components/products/add-to-cart-button.tsx`
- Modify: `tests/components/products/add-to-cart-button.test.tsx`

- [ ] **Mettre à jour les tests**

Remplacer le contenu de `tests/components/products/add-to-cart-button.test.tsx` :

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { useCartStore } from "@/lib/cart";
import type { ProductVariant } from "@/lib/db/schema";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

const baseProduct = {
  id: "p1",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  images: ["/placeholder.svg"],
  stock: 5,
  category_id: "smartphones",
  subcategory_id: null,
  old_price: null,
  brand: "Apple",
  description: "Top.",
  specs: {},
  badge: null,
  rating: null,
  reviews: 0,
  colors: [],
  variants: [],
  is_active: true,
  created_at: new Date(),
};

const makeVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: "v1",
  product_id: "p1",
  color_name: "Noir",
  color_hex: "#000",
  stock: 5,
  price_override: null,
  sort_order: 0,
  created_at: new Date(),
  ...overrides,
});

describe("AddToCartButton — sans variante", () => {
  it("affiche 'Ajouter au panier' quand en stock", () => {
    render(<AddToCartButton product={baseProduct} variant={null} />);
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeInTheDocument();
  });

  it("est désactivé quand stock = 0", () => {
    render(<AddToCartButton product={{ ...baseProduct, stock: 0 }} variant={null} />);
    expect(screen.getByRole("button", { name: /rupture/i })).toBeDisabled();
  });

  it("ajoute l'item sans variantId au panier", () => {
    render(<AddToCartButton product={baseProduct} variant={null} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    const item = useCartStore.getState().items[0];
    expect(item.productId).toBe("p1");
    expect(item.variantId).toBeNull();
    expect(item.colorName).toBeNull();
  });

  it("utilise l'image placeholder quand pas d'images", () => {
    render(<AddToCartButton product={{ ...baseProduct, images: [] }} variant={null} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    expect(useCartStore.getState().items[0].image).toBe("/images/products/placeholder.svg");
  });
});

describe("AddToCartButton — avec variante", () => {
  it("est désactivé quand stock de la variante = 0", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant({ stock: 0 })} />);
    expect(screen.getByRole("button", { name: /rupture/i })).toBeDisabled();
  });

  it("ajoute avec variantId et colorName", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant()} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    const item = useCartStore.getState().items[0];
    expect(item.variantId).toBe("v1");
    expect(item.colorName).toBe("Noir");
    expect(item.colorHex).toBe("#000");
  });

  it("utilise price_override quand défini", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant({ price_override: 950_000 })} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    expect(useCartStore.getState().items[0].price).toBe(950_000);
  });

  it("utilise le prix produit quand price_override est null", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant({ price_override: null })} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    expect(useCartStore.getState().items[0].price).toBe(1_000_000);
  });
});
```

- [ ] **Lancer les tests pour vérifier qu'ils échouent**

```bash
bun run test tests/components/products/add-to-cart-button.test.tsx
```

Résultat attendu : FAIL — `AddToCartButton` ne prend pas encore de prop `variant`.

- [ ] **Mettre à jour `components/products/add-to-cart-button.tsx`**

```typescript
"use client";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart";
import type { Product, ProductVariant } from "@/lib/db/schema";

type Props = {
  product: Product;
  variant: ProductVariant | null;
};

export function AddToCartButton({ product, variant }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const effectiveStock = variant !== null ? variant.stock : product.stock;
  const isOutOfStock = effectiveStock === 0;
  const effectivePrice = variant?.price_override ?? product.price;

  return (
    <Button
      size="lg"
      className="flex-1 gap-2"
      disabled={isOutOfStock}
      onClick={() =>
        addItem({
          productId: product.id,
          variantId: variant?.id ?? null,
          slug: product.slug,
          name: product.name,
          price: effectivePrice,
          image: product.images[0] ?? "/images/products/placeholder.svg",
          colorName: variant?.color_name ?? null,
          colorHex: variant?.color_hex ?? null,
        })
      }
    >
      <ShoppingCart className="size-4" />
      {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
    </Button>
  );
}
```

- [ ] **Lancer les tests**

```bash
bun run test tests/components/products/add-to-cart-button.test.tsx
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add components/products/add-to-cart-button.tsx tests/components/products/add-to-cart-button.test.tsx
git commit -m "feat: AddToCartButton accepte la prop variant"
```

---

## Task 8: `ProductActions` — nouveau composant client swatches + prix + bouton

**Files:**
- Create: `components/products/product-actions.tsx`
- Create: `tests/components/products/product-actions.test.tsx`

- [ ] **Écrire les tests**

```typescript
// tests/components/products/product-actions.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { ProductActions } from "@/components/products/product-actions";
import { useCartStore } from "@/lib/cart";
import type { Product, ProductVariant } from "@/lib/db/schema";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "v1",
    product_id: "p1",
    color_name: "Noir",
    color_hex: "#000",
    stock: 5,
    price_override: null,
    sort_order: 0,
    created_at: new Date(),
    ...overrides,
  };
}

const baseProduct: Product = {
  id: "p1",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  images: ["/placeholder.svg"],
  stock: 5,
  category_id: "smartphones",
  subcategory_id: null,
  old_price: null,
  brand: "Apple",
  description: "Top.",
  specs: {},
  badge: null,
  rating: null,
  reviews: 0,
  colors: [],
  variants: [],
  is_active: true,
  created_at: new Date(),
};

describe("ProductActions — sans variante", () => {
  it("affiche le bouton sans swatches", () => {
    render(<ProductActions product={baseProduct} />);
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Noir")).not.toBeInTheDocument();
  });
});

describe("ProductActions — avec variantes", () => {
  const variants = [
    makeVariant({ id: "v1", color_name: "Noir", color_hex: "#000", stock: 5 }),
    makeVariant({ id: "v2", color_name: "Blanc", color_hex: "#fff", stock: 3 }),
  ];
  const productWithVariants = { ...baseProduct, variants };

  it("affiche les swatches pour chaque variante", () => {
    render(<ProductActions product={productWithVariants} />);
    expect(screen.getByRole("button", { name: "Noir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blanc" })).toBeInTheDocument();
  });

  it("swatch désactivée quand stock = 0", () => {
    const outOfStock = { ...productWithVariants, variants: [
      makeVariant({ id: "v1", color_name: "Noir", stock: 0 }),
    ]};
    render(<ProductActions product={outOfStock} />);
    expect(screen.getByRole("button", { name: "Noir" })).toBeDisabled();
  });

  it("ajoute la bonne variante au panier", () => {
    render(<ProductActions product={productWithVariants} />);
    fireEvent.click(screen.getByRole("button", { name: "Blanc" }));
    fireEvent.click(screen.getByRole("button", { name: /ajouter au panier/i }));
    const item = useCartStore.getState().items[0];
    expect(item.variantId).toBe("v2");
    expect(item.colorName).toBe("Blanc");
  });

  it("affiche le price_override quand défini", () => {
    const withOverride = { ...productWithVariants, variants: [
      makeVariant({ id: "v1", color_name: "Noir", price_override: 950_000 }),
    ]};
    render(<ProductActions product={withOverride} />);
    expect(screen.getByText(/950 000 FCFA/)).toBeInTheDocument();
  });
});
```

- [ ] **Lancer les tests pour vérifier qu'ils échouent**

```bash
bun run test tests/components/products/product-actions.test.tsx
```

Résultat attendu : FAIL — `ProductActions` n'existe pas.

- [ ] **Créer `components/products/product-actions.tsx`**

```typescript
"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import type { Product } from "@/lib/db/schema";

export function ProductActions({ product }: { product: Product }) {
  const { variants } = product;
  const firstInStock = variants.findIndex((v) => v.stock > 0);
  const [selectedIdx, setSelectedIdx] = useState(firstInStock >= 0 ? firstInStock : 0);

  if (variants.length === 0) {
    return (
      <div className="flex gap-3">
        <AddToCartButton product={product} variant={null} />
      </div>
    );
  }

  const selected = variants[selectedIdx];
  const effectivePrice = selected.price_override ?? product.price;
  const effectiveStock = selected.stock;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">
          Coloris :{" "}
          <span className="font-normal text-muted-foreground">{selected.color_name}</span>
        </p>
        <div className="flex gap-2">
          {variants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={v.color_name}
              aria-pressed={i === selectedIdx}
              disabled={v.stock === 0}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "size-7 rounded-full border-2 transition-transform",
                v.stock === 0 && "cursor-not-allowed opacity-40",
                i === selectedIdx
                  ? "scale-110 border-primary"
                  : "border-transparent hover:scale-110"
              )}
              style={{
                backgroundColor: v.color_hex,
                boxShadow: i === selectedIdx ? "0 0 0 2px var(--card) inset" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold">{formatPrice(effectivePrice)} FCFA</p>
        <p className="mt-1 text-sm">
          {effectiveStock === 0 ? (
            <span className="font-medium text-red-500">Rupture de stock</span>
          ) : (
            <span className="font-medium text-green-600">
              En stock ({effectiveStock} disponible{effectiveStock > 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <AddToCartButton product={product} variant={selected} />
      </div>
    </div>
  );
}
```

- [ ] **Lancer les tests**

```bash
bun run test tests/components/products/product-actions.test.tsx
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add components/products/product-actions.tsx tests/components/products/product-actions.test.tsx
git commit -m "feat: composant ProductActions avec swatches, prix et stock par variante"
```

---

## Task 9: Page produit — intégrer `ProductActions`

**Files:**
- Modify: `app/(main)/produits/[slug]/page.tsx`

- [ ] **Mettre à jour la page produit**

Ajouter l'import de `ProductActions` en haut du fichier (remplacer l'import de `AddToCartButton`) :

```typescript
import { ProductActions } from "@/components/products/product-actions";
```

Supprimer la ligne :

```typescript
import { AddToCartButton } from "@/components/products/add-to-cart-button";
```

Remplacer le bloc prix + stock + bouton (lignes 97–127) par :

```tsx
{/* Prix — affiché ici seulement si aucune variante (ProductActions le gère sinon) */}
{product.variants.length === 0 ? (
  <div className="mt-4 flex flex-wrap items-baseline gap-3">
    <span className="text-3xl font-bold">{formatPrice(product.price)} FCFA</span>
    {product.old_price ? (
      <>
        <span className="text-lg text-muted-foreground line-through">
          {formatPrice(product.old_price)} FCFA
        </span>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-600">
          -{discount}%
        </span>
      </>
    ) : null}
  </div>
) : null}

{/* Stock — affiché ici seulement si aucune variante */}
{product.variants.length === 0 ? (
  <p className="mt-2 text-sm">
    {isOutOfStock ? (
      <span className="font-medium text-red-500">Rupture de stock</span>
    ) : (
      <span className="font-medium text-green-600">
        En stock ({product.stock} disponible{product.stock > 1 ? "s" : ""})
      </span>
    )}
  </p>
) : null}

<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
  {product.description}
</p>

<div className="mt-6">
  <ProductActions product={product} />
</div>
```

Supprimer la variable `isOutOfStock` uniquement si elle n'est plus utilisée ailleurs dans la page (elle reste nécessaire pour le bloc conditionnel ci-dessus — la conserver).

- [ ] **Vérifier que TypeScript compile**

```bash
bun run lint
```

Résultat attendu : pas de nouvelles erreurs.

- [ ] **Lancer tous les tests**

```bash
bun run test
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add "app/(main)/produits/[slug]/page.tsx"
git commit -m "feat: page produit utilise ProductActions pour swatches et stock par variante"
```

---

## Task 10: `ProductCard` — utiliser `product.variants`

**Files:**
- Modify: `components/products/product-card.tsx`
- Modify: `tests/components/products/product-card.test.tsx`

- [ ] **Mettre à jour la fixture dans les tests**

Dans `tests/components/products/product-card.test.tsx`, mettre à jour la constante `BASE` :

Remplacer :
```typescript
colors: [
  { name: "Noir", hex: "#0e0e10" },
  { name: "Blanc", hex: "#f4f3ee" },
],
```

Par :
```typescript
colors: [],
variants: [
  { id: "v1", product_id: "iphone-16-pro", color_name: "Noir", color_hex: "#0e0e10", stock: 5, price_override: null, sort_order: 0, created_at: new Date() },
  { id: "v2", product_id: "iphone-16-pro", color_name: "Blanc", color_hex: "#f4f3ee", stock: 3, price_override: null, sort_order: 1, created_at: new Date() },
],
```

Mettre à jour le test des pastilles de coloris (les aria-labels utilisent maintenant `color_name`) :
```typescript
it("affiche les pastilles de coloris", () => {
  render(<ProductCard product={BASE} />);
  expect(screen.getByRole("button", { name: "Noir" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Blanc" })).toBeInTheDocument();
});
```

Mettre à jour le test rupture de stock pour utiliser `variants` à stock 0 :
```typescript
it("affiche l'état rupture de stock quand tout est en rupture", () => {
  const outOfStock = {
    ...BASE,
    stock: 0,
    variants: [
      { ...BASE.variants[0], stock: 0 },
      { ...BASE.variants[1], stock: 0 },
    ],
  };
  render(<ProductCard product={outOfStock} />);
  expect(screen.getByText(/rupture/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /me prévenir/i })).toBeDisabled();
});
```

Mettre à jour le test ajout au panier :
```typescript
it("ajoute au panier en cliquant sur le bouton", () => {
  render(<ProductCard product={BASE} />);
  fireEvent.click(screen.getByRole("button", { name: /ajouter au panier/i }));
  const item = useCartStore.getState().items[0];
  expect(item.productId).toBe("iphone-16-pro");
  expect(item.variantId).toBe("v1");
  expect(item.colorName).toBe("Noir");
});
```

- [ ] **Lancer les tests pour vérifier qu'ils échouent**

```bash
bun run test tests/components/products/product-card.test.tsx
```

Résultat attendu : FAIL — le composant utilise encore `product.colors`.

- [ ] **Mettre à jour `components/products/product-card.tsx`**

Remplacer `const [colorIdx, setColorIdx] = useState(0)` par :

```typescript
const [colorIdx, setColorIdx] = useState(() => {
  const firstInStock = product.variants.findIndex((v) => v.stock > 0);
  return firstInStock >= 0 ? firstInStock : 0;
});
const selectedVariant = product.variants[colorIdx] ?? null;
```

Remplacer le calcul de `isOutOfStock` et `isLowStock` :

```typescript
const effectiveStock = selectedVariant !== null ? selectedVariant.stock : product.stock;
const isOutOfStock = selectedVariant !== null
  ? product.variants.every((v) => v.stock === 0)
  : product.stock === 0;
const isLowStock = effectiveStock > 0 && effectiveStock <= LOW_STOCK_THRESHOLD;
```

Remplacer le bloc swatches (lignes 115–149) :

```tsx
{product.rating != null || product.variants.length > 0 ? (
  <div className="flex items-center justify-between gap-2">
    {product.rating != null ? (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="size-3 fill-foreground text-foreground" />
        <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
        <span className="font-mono text-[11px]">({formatPrice(product.reviews)})</span>
      </span>
    ) : (
      <span />
    )}
    {product.variants.length > 0 ? (
      <span className="flex gap-1.5">
        {product.variants.map((v, i) => (
          <button
            key={v.id}
            type="button"
            aria-label={v.color_name}
            aria-pressed={i === colorIdx}
            disabled={v.stock === 0}
            onClick={(e) => {
              e.preventDefault();
              setColorIdx(i);
            }}
            className={cn(
              "size-3.5 rounded-full border transition-transform hover:scale-110",
              v.stock === 0 && "opacity-40"
            )}
            style={{
              backgroundColor: v.color_hex,
              borderColor: i === colorIdx ? "var(--primary)" : "rgba(0,0,0,0.15)",
              boxShadow: i === colorIdx ? "0 0 0 2px var(--card) inset" : undefined,
            }}
          />
        ))}
      </span>
    ) : null}
  </div>
) : null}
```

Remplacer le `onClick` du bouton "Ajouter" :

```typescript
onClick={(e) => {
  e.preventDefault();
  addItem({
    productId: product.id,
    variantId: selectedVariant?.id ?? null,
    slug: product.slug,
    name: product.name,
    price: selectedVariant?.price_override ?? product.price,
    image,
    colorName: selectedVariant?.color_name ?? null,
    colorHex: selectedVariant?.color_hex ?? null,
  });
}}
```

- [ ] **Lancer les tests**

```bash
bun run test tests/components/products/product-card.test.tsx
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add components/products/product-card.tsx tests/components/products/product-card.test.tsx
git commit -m "feat: ProductCard utilise product.variants pour swatches et stock"
```

---

## Task 11: CartItemRow + CheckoutForm — afficher la couleur

**Files:**
- Modify: `components/cart/cart-item-row.tsx`
- Modify: `app/(main)/checkout/checkout-form.tsx`

- [ ] **Mettre à jour `components/cart/cart-item-row.tsx`**

Ajouter l'affichage du coloris sous le nom du produit (après la `<p>` du nom) :

```tsx
{item.colorName && item.colorHex ? (
  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <span
      className="size-2.5 shrink-0 rounded-full border border-black/10"
      style={{ backgroundColor: item.colorHex }}
    />
    {item.colorName}
  </span>
) : null}
```

Mettre à jour les appels `removeItem` et `setQuantity` pour utiliser la clé correcte :

```typescript
// Avant :
useCartStore.getState().setQuantity(item.productId, item.quantity - 1)
useCartStore.getState().setQuantity(item.productId, item.quantity + 1)
useCartStore.getState().removeItem(item.productId)

// Après :
useCartStore.getState().setQuantity(item.variantId ?? item.productId, item.quantity - 1)
useCartStore.getState().setQuantity(item.variantId ?? item.productId, item.quantity + 1)
useCartStore.getState().removeItem(item.variantId ?? item.productId)
```

- [ ] **Mettre à jour `app/(main)/checkout/checkout-form.tsx`**

Dans le récapitulatif (`<ul>`), mettre à jour la `key` et ajouter le coloris :

```tsx
{items.map((item) => (
  <li key={item.variantId ?? item.productId} className="flex items-center gap-3 p-3 text-sm">
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="line-clamp-1">{item.name}</span>
      {item.colorName && item.colorHex ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: item.colorHex }}
          />
          {item.colorName}
        </span>
      ) : null}
    </div>
    <span className="shrink-0 text-muted-foreground">×{item.quantity}</span>
    <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
  </li>
))}
```

- [ ] **Lancer tous les tests**

```bash
bun run test
```

Résultat attendu : tous PASS.

- [ ] **Commit**

```bash
git add components/cart/cart-item-row.tsx "app/(main)/checkout/checkout-form.tsx"
git commit -m "feat: afficher couleur dans CartItemRow et récapitulatif checkout"
```

---

## Task 12: Pages commandes — afficher la couleur commandée

**Files:**
- Modify: `app/(main)/commande/[id]/page.tsx`
- Modify: `app/(compte)/compte/commandes/[id]/page.tsx`
- Modify: `app/(admin)/admin/commandes/[id]/page.tsx`

Le même snippet conditionnel est ajouté dans chaque page, après le nom du produit.

- [ ] **Mettre à jour `app/(main)/commande/[id]/page.tsx`**

Trouver le rendu des items (lignes 49–56) et remplacer :

```tsx
{items.map((item) => (
  <li key={item.id} className="flex justify-between text-sm">
    <span className="flex flex-col gap-0.5">
      <span>{item.product_name} × {item.quantity}</span>
      {item.color_name && item.color_hex ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: item.color_hex }}
          />
          {item.color_name}
        </span>
      ) : null}
    </span>
    <span>{item.line_total.toLocaleString("fr-FR")} FCFA</span>
  </li>
))}
```

- [ ] **Mettre à jour `app/(compte)/compte/commandes/[id]/page.tsx`**

Trouver le bloc `<div className="min-w-0 flex-1">` (ligne 84) et ajouter le coloris après le lien produit :

```tsx
<div className="min-w-0 flex-1">
  <Link
    href={`/produits/${item.product_slug}`}
    className="text-sm font-medium hover:underline"
  >
    {item.product_name}
  </Link>
  {item.color_name && item.color_hex ? (
    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="size-2 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: item.color_hex }}
      />
      {item.color_name}
    </span>
  ) : null}
  <p className="mt-0.5 text-xs text-muted-foreground">
    {item.unit_price.toLocaleString("fr-FR")} FCFA × {item.quantity}
  </p>
</div>
```

- [ ] **Mettre à jour `app/(admin)/admin/commandes/[id]/page.tsx`**

Trouver le bloc `<div className="flex-1">` (ligne 81) et ajouter le coloris :

```tsx
<div className="flex-1">
  <p className="font-medium">{item.product_name}</p>
  {item.color_name && item.color_hex ? (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="size-2 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: item.color_hex }}
      />
      {item.color_name}
    </span>
  ) : null}
  <p className="text-sm text-muted-foreground">
    {item.quantity} × {formatFCFA(item.unit_price)}
  </p>
</div>
```

- [ ] **Lancer tous les tests**

```bash
bun run test
```

Résultat attendu : tous PASS.

- [ ] **Vérifier TypeScript**

```bash
bun run lint
```

Résultat attendu : pas de nouvelles erreurs.

- [ ] **Commit final**

```bash
git add "app/(main)/commande/[id]/page.tsx" "app/(compte)/compte/commandes/[id]/page.tsx" "app/(admin)/admin/commandes/[id]/page.tsx"
git commit -m "feat: afficher couleur commandée dans les pages commandes (confirmation, compte, admin)"
```

---

## Vérification finale

- [ ] **Démarrer le dev server et tester le parcours complet**

```bash
bun run dev
```

Scénarios à tester manuellement :
1. Page produit avec variantes → swatches visibles, prix/stock mis à jour au clic
2. Clic swatch → AddToCartButton désactivé si stock = 0
3. Ajout au panier → CartItemRow affiche le coloris
4. Checkout → récapitulatif affiche le coloris
5. Produit sans variante → comportement inchangé (pas de swatches)
6. Deux couleurs du même produit dans le panier → deux lignes distinctes

- [ ] **Appliquer la migration D1 locale (preview)**

```bash
bun run db:migrate:local
bun run preview
```

Tester le même parcours sur le preview Cloudflare Workers (port 8788).
