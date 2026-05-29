# Refonte des filtres — pages catégories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la sidebar de filtres actuelle des pages catégories par une sidebar desktop + tiroir mobile, avec multi-sélection de marques, fourchette de prix Min/Max, puces de filtres actifs, tri séparé, et un compteur vivant dans le tiroir.

**Architecture:** L'état des filtres vit dans l'URL (search params). Une couche pure (`lib/category-filters.ts`) parse/sérialise cet état et est partagée par la page serveur et les composants clients. La donnée (`lib/data/products.ts`) gagne le multi-marques (`inArray`), une fonction de marques stable indépendante des filtres, et un comptage. Le tiroir mobile cumule un brouillon local et interroge une server action de comptage (debounce) avant d'appliquer en une seule navigation.

**Tech Stack:** Next.js 16 App Router (server components + `force-dynamic`), React 19, TypeScript, Drizzle ORM (D1/better-sqlite3), Shadcn UI (`sheet`, `select`, `badge`, `input`, `button`), Vitest + React Testing Library.

---

## File Structure

| Fichier | Rôle |
|---------|------|
| `lib/category-filters.ts` (créer) | Type `CategoryFilterState` + `parseCategoryParams` + `buildCategoryHref`. Pur, sans React ni DB. |
| `lib/data/products.ts` (modifier) | `ProductFilters.brand` → `brands: string[]` ; helper de conditions ; `getCategoryBrands` ; `countProductsByCategory`. |
| `lib/actions/category-filters.ts` (créer) | Server action `countCategoryProducts` (validation runtime + comptage). |
| `components/products/product-filters.tsx` (réécrire) | Corps de filtres **contrôlé** (marques + prix Min/Max), réutilisé desktop + tiroir. |
| `components/products/category-filters.tsx` (créer) | Wrapper desktop : pousse l'URL instantanément à chaque changement. |
| `components/products/sort-select.tsx` (créer) | `Select` de tri, met à jour `tri` dans l'URL. |
| `components/products/active-filters.tsx` (créer) | Puces des filtres actifs + « Tout effacer ». |
| `components/products/filter-drawer.tsx` (créer) | Tiroir mobile : brouillon + compteur vivant + appliquer. |
| `app/(main)/[slug]/page.tsx` (modifier) | Parse les params, récupère les marques stables, câble les composants. |

Tests miroirs sous `tests/`.

**Note pour l'exécutant :** `bun run test` lance Vitest. Le dépôt a déjà des erreurs ESLint préexistantes (entités non échappées, `any` dans auth/app-bar) — `bun run lint` qui échoue sur ces fichiers n'est PAS une régression. Ne valider que l'absence d'erreurs NOUVELLES sur les fichiers touchés.

---

## Task 1 : Couche pure `lib/category-filters.ts`

**Files:**
- Create: `lib/category-filters.ts`
- Test: `tests/lib/category-filters.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```typescript
// tests/lib/category-filters.test.ts
import { describe, it, expect } from "vitest";
import { parseCategoryParams, buildCategoryHref } from "@/lib/category-filters";

describe("parseCategoryParams", () => {
  it("parse une liste de marques séparées par des virgules", () => {
    expect(parseCategoryParams({ marques: "Apple,Samsung" }).brands).toEqual(["Apple", "Samsung"]);
  });

  it("trim, ignore les entrées vides et dédoublonne", () => {
    expect(parseCategoryParams({ marques: " Apple , ,Apple, Samsung " }).brands).toEqual(["Apple", "Samsung"]);
  });

  it("renvoie un tableau vide quand marques est absent", () => {
    expect(parseCategoryParams({}).brands).toEqual([]);
  });

  it("parse prix_min et prix_max valides", () => {
    const s = parseCategoryParams({ prix_min: "100000", prix_max: "500000" });
    expect(s.prixMin).toBe(100000);
    expect(s.prixMax).toBe(500000);
  });

  it("ignore les prix non numériques ou négatifs", () => {
    const s = parseCategoryParams({ prix_min: "abc", prix_max: "-5" });
    expect(s.prixMin).toBeUndefined();
    expect(s.prixMax).toBeUndefined();
  });

  it("ignore la borne min quand min > max", () => {
    const s = parseCategoryParams({ prix_min: "900000", prix_max: "100000" });
    expect(s.prixMin).toBeUndefined();
    expect(s.prixMax).toBe(100000);
  });

  it("valide tri contre la liste blanche", () => {
    expect(parseCategoryParams({ tri: "prix_asc" }).tri).toBe("prix_asc");
    expect(parseCategoryParams({ tri: "n_importe_quoi" }).tri).toBeUndefined();
  });
});

describe("buildCategoryHref", () => {
  it("construit une URL avec marques jointes par virgule", () => {
    expect(buildCategoryHref("/smartphones", { brands: ["Apple", "Samsung"] }))
      .toBe("/smartphones?marques=Apple%2CSamsung");
  });

  it("inclut les bornes de prix et le tri", () => {
    const href = buildCategoryHref("/smartphones", { brands: [], prixMin: 100000, prixMax: 500000, tri: "prix_asc" });
    expect(href).toContain("prix_min=100000");
    expect(href).toContain("prix_max=500000");
    expect(href).toContain("tri=prix_asc");
  });

  it("renvoie le pathname seul quand l'état est vide", () => {
    expect(buildCategoryHref("/smartphones", { brands: [] })).toBe("/smartphones");
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/lib/category-filters.test.ts`
Expected: FAIL — `Cannot find module '@/lib/category-filters'`.

- [ ] **Step 3 : Écrire l'implémentation**

```typescript
// lib/category-filters.ts
export type Tri = "nouveau" | "prix_asc" | "prix_desc";

export type CategoryFilterState = {
  brands: string[];
  prixMin?: number;
  prixMax?: number;
  tri?: Tri;
};

const VALID_TRI: readonly string[] = ["nouveau", "prix_asc", "prix_desc"];

export type RawCategoryParams = {
  marques?: string;
  prix_min?: string;
  prix_max?: string;
  tri?: string;
};

export function parseCategoryParams(raw: RawCategoryParams): CategoryFilterState {
  const brands = [
    ...new Set(
      (raw.marques ?? "")
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b.length > 0)
    ),
  ];

  const toPrice = (v?: string): number | undefined => {
    if (v === undefined) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  let prixMin = toPrice(raw.prix_min);
  const prixMax = toPrice(raw.prix_max);
  if (prixMin !== undefined && prixMax !== undefined && prixMin > prixMax) {
    prixMin = undefined; // borne min fautive : on l'ignore (jamais de fourchette vide)
  }

  const tri = VALID_TRI.includes(raw.tri ?? "") ? (raw.tri as Tri) : undefined;

  return { brands, prixMin, prixMax, tri };
}

export function buildCategoryHref(pathname: string, state: CategoryFilterState): string {
  const params = new URLSearchParams();
  if (state.brands.length > 0) params.set("marques", state.brands.join(","));
  if (state.prixMin !== undefined) params.set("prix_min", String(state.prixMin));
  if (state.prixMax !== undefined) params.set("prix_max", String(state.prixMax));
  if (state.tri) params.set("tri", state.tri);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/lib/category-filters.test.ts`
Expected: PASS (tous les tests verts).

- [ ] **Step 5 : Commit**

```bash
git add lib/category-filters.ts tests/lib/category-filters.test.ts
git commit -m "feat: couche pure parse/build des filtres catégories"
```

---

## Task 2 : Couche données (multi-marques, marques stables, comptage)

**Files:**
- Modify: `lib/data/products.ts`
- Test: `tests/lib/data/products.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter ces tests à la fin de `tests/lib/data/products.test.ts` (le helper `createTestDb` et `BASE` existent déjà en haut du fichier) :

```typescript
import {
  getCategoryBrands,
  countProductsByCategory,
} from "@/lib/data/products";

describe("getProductsByCategory — multi-marques", () => {
  it("filtre sur plusieurs marques avec brands[]", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values([
      { ...BASE, id: "a", slug: "a", brand: "Apple" },
      { ...BASE, id: "b", slug: "b", brand: "Samsung" },
      { ...BASE, id: "c", slug: "c", brand: "Xiaomi" },
    ]);
    const result = await getProductsByCategory(db, "smartphones", { brands: ["Apple", "Xiaomi"] });
    expect(result.map((p) => p.brand).sort()).toEqual(["Apple", "Xiaomi"]);
  });

  it("combine fourchette de prix et marques", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values([
      { ...BASE, id: "a", slug: "a", brand: "Apple", price: 100000 },
      { ...BASE, id: "b", slug: "b", brand: "Apple", price: 900000 },
    ]);
    const result = await getProductsByCategory(db, "smartphones", { brands: ["Apple"], prix_min: 50000, prix_max: 200000 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

describe("getCategoryBrands", () => {
  it("renvoie la liste complète des marques, indépendamment des filtres", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values([
      { ...BASE, id: "a", slug: "a", brand: "Apple" },
      { ...BASE, id: "b", slug: "b", brand: "Samsung" },
      { ...BASE, id: "c", slug: "c", brand: "Apple" },
    ]);
    const brands = await getCategoryBrands(db, "smartphones");
    expect(brands).toEqual(["Apple", "Samsung"]); // distinctes, triées
  });

  it("exclut les produits inactifs", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values([
      { ...BASE, id: "a", slug: "a", brand: "Apple" },
      { ...BASE, id: "b", slug: "b", brand: "Inactive", is_active: false },
    ]);
    expect(await getCategoryBrands(db, "smartphones")).toEqual(["Apple"]);
  });
});

describe("countProductsByCategory", () => {
  it("compte les produits correspondant aux filtres", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values([
      { ...BASE, id: "a", slug: "a", brand: "Apple" },
      { ...BASE, id: "b", slug: "b", brand: "Samsung" },
    ]);
    expect(await countProductsByCategory(db, "smartphones", { brands: ["Apple"] })).toBe(1);
    expect(await countProductsByCategory(db, "smartphones", {})).toBe(2);
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier l'échec**

Run: `bun run test tests/lib/data/products.test.ts`
Expected: FAIL — `getCategoryBrands`/`countProductsByCategory` non exportés, et `brands` non géré.

- [ ] **Step 3 : Modifier `lib/data/products.ts`**

3a. Ajouter `inArray` à l'import drizzle (ligne 3) :

```typescript
import { eq, or, and, ne, lte, gte, gt, asc, desc, isNotNull, inArray, sql } from "drizzle-orm";
```

3b. Remplacer le champ `brand` du type `ProductFilters` (lignes 10-15) :

```typescript
export type ProductFilters = {
  brands?: string[];
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};
```

3c. Extraire un helper de conditions et l'utiliser dans `getProductsByCategory`. Remplacer le corps de `getProductsByCategory` (lignes 77-104) par :

```typescript
function categoryFilterConditions(categoryId: string, filters: ProductFilters) {
  const conditions = [
    or(eq(products.category_id, categoryId), eq(products.subcategory_id, categoryId)),
    eq(products.is_active, true),
  ];
  if (filters.brands && filters.brands.length > 0) {
    conditions.push(inArray(products.brand, filters.brands));
  }
  if (filters.prix_min !== undefined) conditions.push(gte(products.price, filters.prix_min));
  if (filters.prix_max !== undefined) conditions.push(lte(products.price, filters.prix_max));
  return conditions;
}

export async function getProductsByCategory(
  db: Db,
  categoryId: string,
  filters: ProductFilters = {}
): Promise<Product[]> {
  const conditions = categoryFilterConditions(categoryId, filters);

  const order =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : desc(products.created_at);

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(order);
  return attachVariants(db, rows.map(parseProduct));
}

export async function getCategoryBrands(db: Db, categoryId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ brand: products.brand })
    .from(products)
    .where(
      and(
        or(eq(products.category_id, categoryId), eq(products.subcategory_id, categoryId)),
        eq(products.is_active, true)
      )
    )
    .orderBy(asc(products.brand));
  return rows.map((r) => r.brand);
}

export async function countProductsByCategory(
  db: Db,
  categoryId: string,
  filters: ProductFilters = {}
): Promise<number> {
  const conditions = categoryFilterConditions(categoryId, filters);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions));
  return Number(result[0]?.count ?? 0);
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier le succès**

Run: `bun run test tests/lib/data/products.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add lib/data/products.ts tests/lib/data/products.test.ts
git commit -m "feat: multi-marques, marques stables et comptage par catégorie"
```

---

## Task 3 : Server action de comptage

**Files:**
- Create: `lib/actions/category-filters.ts`
- Test: `tests/lib/actions/category-filters.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```typescript
// tests/lib/actions/category-filters.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCount = vi.fn();
vi.mock("@/lib/db", () => ({ getDb: vi.fn(async () => ({})) }));
vi.mock("@/lib/data/products", () => ({ countProductsByCategory: (...a: unknown[]) => mockCount(...a) }));

import { countCategoryProducts } from "@/lib/actions/category-filters";

beforeEach(() => mockCount.mockReset());

describe("countCategoryProducts", () => {
  it("renvoie null si categoryId est invalide", async () => {
    expect(await countCategoryProducts({ categoryId: "" })).toBeNull();
    // @ts-expect-error test runtime
    expect(await countCategoryProducts(null)).toBeNull();
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("nettoie les inputs et délègue au comptage", async () => {
    mockCount.mockResolvedValue(7);
    const result = await countCategoryProducts({
      categoryId: "smartphones",
      // @ts-expect-error inputs runtime non typés
      brands: ["Apple", "", 42],
      prixMin: -3,
      prixMax: 500000,
    });
    expect(result).toBe(7);
    expect(mockCount).toHaveBeenCalledWith({}, "smartphones", {
      brands: ["Apple"],
      prix_min: undefined,
      prix_max: 500000,
    });
  });

  it("renvoie null si le comptage lève une erreur", async () => {
    mockCount.mockRejectedValue(new Error("db down"));
    expect(await countCategoryProducts({ categoryId: "smartphones" })).toBeNull();
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/lib/actions/category-filters.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```typescript
// lib/actions/category-filters.ts
"use server";

import { getDb } from "@/lib/db";
import { countProductsByCategory } from "@/lib/data/products";

export type CountInput = {
  categoryId: string;
  brands?: string[];
  prixMin?: number;
  prixMax?: number;
};

export async function countCategoryProducts(input: CountInput): Promise<number | null> {
  if (!input || typeof input !== "object") return null;
  if (typeof input.categoryId !== "string" || input.categoryId.length === 0) return null;

  const brands = Array.isArray(input.brands)
    ? input.brands.filter((b): b is string => typeof b === "string" && b.length > 0)
    : [];

  const toPrice = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined;

  try {
    const db = await getDb();
    return await countProductsByCategory(db, input.categoryId, {
      brands: brands.length > 0 ? brands : undefined,
      prix_min: toPrice(input.prixMin),
      prix_max: toPrice(input.prixMax),
    });
  } catch (error) {
    console.error("[countCategoryProducts] Failed", { categoryId: input.categoryId, error });
    return null;
  }
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/lib/actions/category-filters.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add lib/actions/category-filters.ts tests/lib/actions/category-filters.test.ts
git commit -m "feat: server action de comptage des produits filtrés"
```

---

## Task 4 : `ProductFilters` contrôlé (marques + prix Min/Max)

**Files:**
- Rewrite: `components/products/product-filters.tsx`
- Rewrite: `tests/components/products/product-filters.test.tsx` (l'ancien fichier teste l'API obsolète — le remplacer intégralement)

- [ ] **Step 1 : Remplacer le test par celui de la nouvelle API**

Écraser tout le contenu de `tests/components/products/product-filters.test.tsx` :

```tsx
// tests/components/products/product-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters, type FilterValue } from "@/components/products/product-filters";

const brands = ["Apple", "Samsung"];
const empty: FilterValue = { brands: [] };

let onChange: ReturnType<typeof vi.fn>;
beforeEach(() => { onChange = vi.fn(); });

describe("ProductFilters", () => {
  it("affiche les marques", () => {
    render(<ProductFilters brands={brands} value={empty} onChange={onChange} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
  });

  it("n'affiche pas la section marque quand brands est vide", () => {
    render(<ProductFilters brands={[]} value={empty} onChange={onChange} />);
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("ajoute une marque à la sélection au clic", async () => {
    render(<ProductFilters brands={brands} value={empty} onChange={onChange} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith({ brands: ["Apple"] });
  });

  it("retire une marque déjà sélectionnée (toggle off)", async () => {
    render(<ProductFilters brands={brands} value={{ brands: ["Apple"] }} onChange={onChange} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith({ brands: [] });
  });

  it("conserve les autres marques en ajoutant une deuxième", async () => {
    render(<ProductFilters brands={brands} value={{ brands: ["Apple"] }} onChange={onChange} />);
    await userEvent.click(screen.getByText("Samsung"));
    expect(onChange).toHaveBeenCalledWith({ brands: ["Apple", "Samsung"] });
  });

  it("émet les bornes de prix au blur du champ", async () => {
    render(<ProductFilters brands={brands} value={empty} onChange={onChange} />);
    const min = screen.getByLabelText("Prix minimum");
    await userEvent.type(min, "100000");
    await userEvent.tab(); // blur
    expect(onChange).toHaveBeenLastCalledWith({ brands: [], prixMin: 100000, prixMax: undefined });
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/components/products/product-filters.test.tsx`
Expected: FAIL — l'ancien composant n'expose ni `value`/`onChange` ni `FilterValue`, et n'a pas de champ « Prix minimum ».

- [ ] **Step 3 : Réécrire le composant**

Écraser `components/products/product-filters.tsx` :

```tsx
// components/products/product-filters.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FilterValue = {
  brands: string[];
  prixMin?: number;
  prixMax?: number;
};

export function ProductFilters({
  brands,
  value,
  onChange,
}: {
  brands: string[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
}) {
  const [minStr, setMinStr] = useState(value.prixMin?.toString() ?? "");
  const [maxStr, setMaxStr] = useState(value.prixMax?.toString() ?? "");

  // Resynchroniser les champs si l'état appliqué change en dehors du composant
  useEffect(() => setMinStr(value.prixMin?.toString() ?? ""), [value.prixMin]);
  useEffect(() => setMaxStr(value.prixMax?.toString() ?? ""), [value.prixMax]);

  function toggleBrand(brand: string) {
    const next = value.brands.includes(brand)
      ? value.brands.filter((b) => b !== brand)
      : [...value.brands, brand];
    onChange({ ...value, brands: next });
  }

  function commitPrice() {
    const parse = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    onChange({ ...value, prixMin: parse(minStr), prixMax: parse(maxStr) });
  }

  return (
    <div className="space-y-6">
      {brands.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Marque</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={value.brands.includes(brand) ? "default" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => toggleBrand(brand)}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold">Prix (FCFA)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Prix minimum"
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); }}
            className="w-24"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Prix maximum"
            value={maxStr}
            onChange={(e) => setMaxStr(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); }}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/components/products/product-filters.test.tsx`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add components/products/product-filters.tsx tests/components/products/product-filters.test.tsx
git commit -m "feat: ProductFilters contrôlé multi-marques + prix Min/Max"
```

---

## Task 5 : `SortSelect`

**Files:**
- Create: `components/products/sort-select.tsx`
- Test: `tests/components/products/sort-select.test.tsx`

**Note testing :** l'ouverture du menu déroulant Radix `Select` ne se teste pas de façon fiable sous jsdom (portails + événements pointer). On teste donc que le libellé de tri courant s'affiche ; la construction d'URL est couverte par les tests purs (Task 1) et la vérification manuelle (Task 10).

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/products/sort-select.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SortSelect } from "@/components/products/sort-select";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/smartphones",
  useSearchParams: () => new URLSearchParams(),
}));

describe("SortSelect", () => {
  it("affiche le libellé du tri courant", () => {
    render(<SortSelect current="prix_asc" />);
    expect(screen.getByText("Prix croissant")).toBeInTheDocument();
  });

  it("affiche le placeholder quand aucun tri n'est défini", () => {
    render(<SortSelect current={undefined} />);
    expect(screen.getByText("Trier par")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/components/products/sort-select.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```tsx
// components/products/sort-select.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = [
  { value: "nouveau", label: "Nouveautés" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
] as const;

export function SortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tri", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current ?? undefined} onValueChange={handleChange}>
      <SelectTrigger className="w-44" aria-label="Trier">
        <SelectValue placeholder="Trier par" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/components/products/sort-select.test.tsx`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add components/products/sort-select.tsx tests/components/products/sort-select.test.tsx
git commit -m "feat: menu déroulant de tri séparé"
```

---

## Task 6 : `ActiveFilters` (puces + tout effacer)

**Files:**
- Create: `components/products/active-filters.tsx`
- Test: `tests/components/products/active-filters.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/products/active-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilters } from "@/components/products/active-filters";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
}));

beforeEach(() => mockPush.mockClear());

describe("ActiveFilters", () => {
  it("ne rend rien quand aucun filtre n'est actif", () => {
    const { container } = render(<ActiveFilters current={{ brands: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche une puce par marque et une pour le prix", () => {
    render(<ActiveFilters current={{ brands: ["Apple", "Samsung"], prixMin: 100000, prixMax: 500000 }} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
    expect(screen.getByText(/FCFA/)).toBeInTheDocument();
  });

  it("retirer une marque pousse une URL sans cette marque", async () => {
    render(<ActiveFilters current={{ brands: ["Apple", "Samsung"] }} />);
    await userEvent.click(screen.getByLabelText("Retirer Apple"));
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("marques=Samsung");
    expect(url).not.toContain("Apple");
  });

  it("« Tout effacer » conserve le tri mais vide marques et prix", async () => {
    render(<ActiveFilters current={{ brands: ["Apple"], prixMax: 500000, tri: "prix_asc" }} />);
    await userEvent.click(screen.getByText("Tout effacer"));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?tri=prix_asc");
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/components/products/active-filters.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```tsx
// components/products/active-filters.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildCategoryHref, type CategoryFilterState } from "@/lib/category-filters";
import { formatPrice } from "@/lib/utils";

function priceLabel(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${formatPrice(min)} – ${formatPrice(max)} FCFA`;
  if (min !== undefined) return `≥ ${formatPrice(min)} FCFA`;
  return `≤ ${formatPrice(max as number)} FCFA`;
}

export function ActiveFilters({ current }: { current: CategoryFilterState }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasPrice = current.prixMin !== undefined || current.prixMax !== undefined;

  if (current.brands.length === 0 && !hasPrice) return null;

  const go = (next: CategoryFilterState) => router.push(buildCategoryHref(pathname, next));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {current.brands.map((b) => (
        <Badge key={b} variant="secondary" className="gap-1 pr-1">
          {b}
          <button
            type="button"
            aria-label={`Retirer ${b}`}
            onClick={() => go({ ...current, brands: current.brands.filter((x) => x !== b) })}
            className="rounded-full hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {hasPrice ? (
        <Badge variant="secondary" className="gap-1 pr-1">
          {priceLabel(current.prixMin, current.prixMax)}
          <button
            type="button"
            aria-label="Retirer le filtre de prix"
            onClick={() => go({ ...current, prixMin: undefined, prixMax: undefined })}
            className="rounded-full hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ) : null}

      <Button variant="ghost" size="sm" onClick={() => go({ brands: [], tri: current.tri })}>
        Tout effacer
      </Button>
    </div>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/components/products/active-filters.test.tsx`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add components/products/active-filters.tsx tests/components/products/active-filters.test.tsx
git commit -m "feat: puces de filtres actifs + tout effacer"
```

---

## Task 7 : `CategoryFilters` (wrapper sidebar desktop, instantané)

**Files:**
- Create: `components/products/category-filters.tsx`
- Test: `tests/components/products/category-filters.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/products/category-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilters } from "@/components/products/category-filters";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
}));

beforeEach(() => mockPush.mockClear());

describe("CategoryFilters", () => {
  it("pousse l'URL immédiatement au clic sur une marque (instantané desktop)", async () => {
    render(<CategoryFilters brands={["Apple", "Samsung"]} current={{ brands: [], tri: "prix_asc" }} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?marques=Apple&tri=prix_asc");
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/components/products/category-filters.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```tsx
// components/products/category-filters.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { ProductFilters, type FilterValue } from "./product-filters";
import { buildCategoryHref, type CategoryFilterState } from "@/lib/category-filters";

export function CategoryFilters({
  brands,
  current,
}: {
  brands: string[];
  current: CategoryFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: FilterValue) {
    router.push(buildCategoryHref(pathname, { ...next, tri: current.tri }));
  }

  return (
    <aside className="w-full shrink-0 lg:w-52">
      <ProductFilters
        brands={brands}
        value={{ brands: current.brands, prixMin: current.prixMin, prixMax: current.prixMax }}
        onChange={handleChange}
      />
    </aside>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/components/products/category-filters.test.tsx`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add components/products/category-filters.tsx tests/components/products/category-filters.test.tsx
git commit -m "feat: wrapper sidebar desktop des filtres (instantané)"
```

---

## Task 8 : `FilterDrawer` (tiroir mobile + compteur vivant)

**Files:**
- Create: `components/products/filter-drawer.tsx`
- Test: `tests/components/products/filter-drawer.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/products/filter-drawer.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterDrawer } from "@/components/products/filter-drawer";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
}));

const mockCount = vi.fn();
vi.mock("@/lib/actions/category-filters", () => ({
  countCategoryProducts: (...a: unknown[]) => mockCount(...a),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockCount.mockReset();
  mockCount.mockResolvedValue(3);
});

describe("FilterDrawer", () => {
  it("affiche le nombre de filtres actifs sur le bouton déclencheur", () => {
    render(<FilterDrawer brands={["Apple"]} current={{ brands: ["Apple"], prixMax: 500000 }} categoryId="smartphones" initialCount={10} />);
    expect(screen.getByText("Filtres (2)")).toBeInTheDocument();
  });

  it("ouvre le tiroir, modifie un brouillon et applique sans recharger avant le clic", async () => {
    render(<FilterDrawer brands={["Apple", "Samsung"]} current={{ brands: [] }} categoryId="smartphones" initialCount={10} />);
    await userEvent.click(screen.getByRole("button", { name: /Filtres/ }));
    // sélection d'une marque dans le tiroir
    await userEvent.click(screen.getByText("Apple"));
    // aucune navigation tant qu'on n'a pas appliqué
    expect(mockPush).not.toHaveBeenCalled();
    // appliquer
    await userEvent.click(screen.getByRole("button", { name: /Voir les/ }));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?marques=Apple");
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier l'échec**

Run: `bun run test tests/components/products/filter-drawer.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire l'implémentation**

```tsx
// components/products/filter-drawer.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductFilters, type FilterValue } from "./product-filters";
import { buildCategoryHref, type CategoryFilterState } from "@/lib/category-filters";
import { countCategoryProducts } from "@/lib/actions/category-filters";

const DEBOUNCE_MS = 300;

export function FilterDrawer({
  brands,
  current,
  categoryId,
  initialCount,
}: {
  brands: string[];
  current: CategoryFilterState;
  categoryId: string;
  initialCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValue>({
    brands: current.brands,
    prixMin: current.prixMin,
    prixMax: current.prixMax,
  });
  const [count, setCount] = useState<number | null>(initialCount);

  const activeCount =
    current.brands.length + (current.prixMin !== undefined || current.prixMax !== undefined ? 1 : 0);

  // Réinitialiser le brouillon sur l'état appliqué à chaque ouverture
  useEffect(() => {
    if (open) {
      setDraft({ brands: current.brands, prixMin: current.prixMin, prixMax: current.prixMax });
      setCount(initialCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Compteur vivant (debounce) tant que le tiroir est ouvert
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(async () => {
      const c = await countCategoryProducts({
        categoryId,
        brands: draft.brands,
        prixMin: draft.prixMin,
        prixMax: draft.prixMax,
      });
      setCount(c);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [draft, open, categoryId]);

  function apply() {
    router.push(buildCategoryHref(pathname, { ...draft, tri: current.tri }));
    setOpen(false);
  }

  const label =
    count === null ? "Voir les produits" : `Voir les ${count} produit${count !== 1 ? "s" : ""}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Filtres{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <ProductFilters brands={brands} value={draft} onChange={setDraft} />
        </div>
        <SheetFooter className="flex-row gap-2">
          <Button variant="ghost" onClick={() => setDraft({ brands: [] })} className="flex-1">
            Réinitialiser
          </Button>
          <Button onClick={apply} className="flex-1">
            {label}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier le succès**

Run: `bun run test tests/components/products/filter-drawer.test.tsx`
Expected: PASS. (Si la sélection de marque dans le tiroir ne trouve pas le bouton, vérifier que `SheetContent` rend bien son contenu dans le DOM de test ; le composant `sheet` du dépôt s'appuie sur Radix Dialog qui monte le contenu quand `open` est vrai.)

- [ ] **Step 5 : Commit**

```bash
git add components/products/filter-drawer.tsx tests/components/products/filter-drawer.test.tsx
git commit -m "feat: tiroir de filtres mobile avec compteur vivant"
```

---

## Task 9 : Câblage dans la page catégorie

**Files:**
- Modify: `app/(main)/[slug]/page.tsx`

- [ ] **Step 1 : Remplacer les imports et la signature des props**

En tête de fichier, remplacer les imports liés aux filtres/données et le type `Props`. Supprimer l'import `ProductFilters` et la constante `VALID_TRI` (le parsing passe dans `parseCategoryParams`). Résultat attendu pour le haut du fichier :

```tsx
// app/(main)/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCachedCategoryBySlug, getCategoryById, getCachedSubcategories } from "@/lib/data/categories";
import { getDb } from "@/lib/db";
import { getProductsByCategory, getCategoryBrands } from "@/lib/data/products";
import { parseCategoryParams } from "@/lib/category-filters";
import { ProductCard } from "@/components/products/product-card";
import { CategoryFilters } from "@/components/products/category-filters";
import { FilterDrawer } from "@/components/products/filter-drawer";
import { SortSelect } from "@/components/products/sort-select";
import { ActiveFilters } from "@/components/products/active-filters";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marques?: string; prix_min?: string; prix_max?: string; tri?: string }>;
};
```

- [ ] **Step 2 : Remplacer le parsing et la récupération des données**

Remplacer le bloc qui calcule `prixMax`/`tri`/`items`/`brands` (lignes ~31-41 de l'original) par :

```tsx
  const current = parseCategoryParams(filters);
  const items = await getProductsByCategory(db, category.id, {
    brands: current.brands.length > 0 ? current.brands : undefined,
    prix_min: current.prixMin,
    prix_max: current.prixMax,
    tri: current.tri,
  });
  const brands = await getCategoryBrands(db, category.id);
  const subcategories = await getCachedSubcategories(category.id);
```

(La ligne `const brands = [...new Set(items.map((p) => p.brand))].sort();` est supprimée — c'était la source du bug des marques qui disparaissent.)

- [ ] **Step 3 : Remplacer le bloc de mise en page filtres + grille**

Remplacer tout le bloc depuis `<div className="mt-8 flex flex-col gap-8 lg:flex-row">` jusqu'à sa fermeture (lignes ~79-97 de l'original) par :

```tsx
      {/* Barre d'outils : tiroir mobile + tri */}
      <div className="mt-6 flex items-center gap-4">
        <div className="lg:hidden">
          <FilterDrawer
            brands={brands}
            current={current}
            categoryId={category.id}
            initialCount={items.length}
          />
        </div>
        <div className="ml-auto">
          <SortSelect current={current.tri} />
        </div>
      </div>

      {/* Puces de filtres actifs */}
      <div className="mt-4">
        <ActiveFilters current={current} />
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <div className="hidden lg:block">
          <CategoryFilters brands={brands} current={current} />
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier les filtres.</p>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
```

- [ ] **Step 4 : Vérifier le typecheck et la suite de tests**

Run: `bun run test`
Expected: PASS sur toute la suite (aucune régression).

Run: `bunx tsc --noEmit` (ou laisser le hook pre-commit lancer `tsc`)
Expected: aucune nouvelle erreur de type.

- [ ] **Step 5 : Commit**

```bash
git add "app/(main)/[slug]/page.tsx"
git commit -m "feat: câbler la nouvelle UI de filtres dans la page catégorie"
```

---

## Task 10 : Vérification finale (lint, build, vérif manuelle)

**Files:** aucun (vérification).

- [ ] **Step 1 : Lancer toute la suite de tests**

Run: `bun run test`
Expected: PASS (tous les fichiers, y compris les 7 nouveaux/réécrits).

- [ ] **Step 2 : Lint des fichiers touchés**

Run: `bun run lint`
Expected: pas de NOUVELLE erreur sur `lib/category-filters.ts`, `lib/data/products.ts`, `lib/actions/category-filters.ts`, `app/(main)/[slug]/page.tsx`, ni sur les composants de `components/products/`. Les erreurs préexistantes (auth, app-bar, entités non échappées) sont attendues et hors périmètre.

- [ ] **Step 3 : Vérification manuelle dev**

```bash
bun run db:migrate:dev && bun run db:seed:categories && bun run db:seed   # si dev.db pas encore prêt
bun run dev
```

Ouvrir `http://localhost:33000/<slug-categorie>` et vérifier :
- Desktop : sidebar à gauche ; cocher 2 marques recharge la grille à chaque clic ; saisir Min/Max + Entrée filtre ; les puces actives apparaissent ; « Tout effacer » réinitialise (tri conservé) ; le menu Tri fonctionne ; la liste des marques reste complète même après sélection.
- Mobile (DevTools responsive) : bouton « Filtres (N) » ouvre le tiroir ; cumuler des choix ne recharge pas ; le bouton affiche « Voir les X produits » mis à jour ; appliquer recharge une fois et ferme.

- [ ] **Step 4 : Commit final éventuel**

Si des ajustements ont été nécessaires :

```bash
git add -A
git commit -m "fix: ajustements UI filtres après vérification manuelle"
```

---

## Self-Review (déjà effectuée par l'auteur du plan)

- **Couverture spec :** params CSV (T1) ✓, prix Min/Max + min>max ignoré (T1) ✓, multi-marques `inArray` (T2) ✓, marques stables/bug corrigé (T2, T9 step 2) ✓, comptage + action validée (T2/T3) ✓, ProductFilters contrôlé (T4) ✓, tri séparé (T5) ✓, puces + tout effacer (T6) ✓, sidebar desktop instantané (T7) ✓, tiroir mobile + compteur vivant (T8) ✓, câblage page (T9) ✓, tests (chaque task) ✓.
- **Cohérence des types :** `CategoryFilterState`/`FilterValue`/`ProductFilters.brands`/`countCategoryProducts` utilisés de façon cohérente entre tasks.
- **Pas de placeholder :** tout le code est complet.
