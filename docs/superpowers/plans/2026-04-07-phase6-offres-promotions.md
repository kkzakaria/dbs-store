# Phase 6 — Offres/Promotions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/offres` page listing all active products with `old_price`, filterable by category and sortable, accessible via the header navigation (desktop + mobile).

**Architecture:** New `getPromoProductsFiltered()` data function in `lib/data/products.ts`. New server-rendered page `app/(main)/offres/page.tsx` reusing `ProductCard`. New client filter component `components/promo/promo-filters.tsx` mirroring the search-filters pattern. Header navigation updated in desktop + mobile.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, better-sqlite3 (tests/dev), D1 (prod), Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-04-07-phase6-offres-promotions-design.md`

---

## File Structure

**Created:**
- `app/(main)/offres/page.tsx` — server component, search params parsing, data fetching, layout
- `components/promo/promo-filters.tsx` — client component, category + sort toggle
- `tests/lib/data/promo-products.test.ts` — data layer tests
- `tests/app/offres-page.test.tsx` — page render tests

**Modified:**
- `lib/data/products.ts` — add `PromoFilters` type + `getPromoProductsFiltered()`
- `components/layout/app-bar/desktop-nav.tsx` — add "Offres" link
- `components/layout/app-bar/mobile-menu.tsx` — add "Offres" entry

---

## Task 1: Data layer — `getPromoProductsFiltered`

**Files:**
- Modify: `lib/data/products.ts`
- Test: `tests/lib/data/promo-products.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/data/promo-products.test.ts`:

```ts
// tests/lib/data/promo-products.test.ts
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { getPromoProductsFiltered } from "@/lib/data/products";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      subcategory_id TEXT,
      price INTEGER NOT NULL,
      old_price INTEGER,
      brand TEXT NOT NULL,
      images TEXT NOT NULL,
      description TEXT NOT NULL,
      specs TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return drizzle(sqlite, { schema }) as any;
}

const BASE = {
  images: JSON.stringify(["/placeholder.svg"]),
  description: "x",
  specs: JSON.stringify({}),
  stock: 5,
  badge: null,
  is_active: true,
} as const;

async function seed(db: ReturnType<typeof createTestDb>) {
  await db.insert(schema.products).values([
    {
      ...BASE,
      id: "p1",
      slug: "p1",
      name: "Promo A",
      category_id: "smartphones",
      subcategory_id: "iphone",
      price: 80000,
      old_price: 100000, // -20%
      brand: "Apple",
      created_at: new Date("2026-01-01"),
    },
    {
      ...BASE,
      id: "p2",
      slug: "p2",
      name: "Promo B",
      category_id: "smartphones",
      subcategory_id: "android",
      price: 60000,
      old_price: 100000, // -40%
      brand: "Samsung",
      created_at: new Date("2026-02-01"),
    },
    {
      ...BASE,
      id: "p3",
      slug: "p3",
      name: "Promo C",
      category_id: "audio",
      subcategory_id: "casques",
      price: 90000,
      old_price: 100000, // -10%
      brand: "Sony",
      created_at: new Date("2026-03-01"),
    },
    {
      ...BASE,
      id: "p4",
      slug: "p4",
      name: "Sans promo",
      category_id: "smartphones",
      subcategory_id: "iphone",
      price: 50000,
      old_price: null,
      brand: "Apple",
      created_at: new Date("2026-01-15"),
    },
    {
      ...BASE,
      id: "p5",
      slug: "p5",
      name: "Promo inactive",
      category_id: "smartphones",
      subcategory_id: "iphone",
      price: 50000,
      old_price: 100000,
      brand: "Apple",
      is_active: false,
      created_at: new Date("2026-01-20"),
    },
  ]);
}

describe("getPromoProductsFiltered", () => {
  it("returns only active products with old_price", async () => {
    const db = createTestDb();
    await seed(db);
    const result = await getPromoProductsFiltered(db);
    const ids = result.map((p) => p.id).sort();
    expect(ids).toEqual(["p1", "p2", "p3"]);
  });

  it("filters by category_id (top-level or subcategory)", async () => {
    const db = createTestDb();
    await seed(db);
    const result = await getPromoProductsFiltered(db, { category_id: "smartphones" });
    expect(result.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
  });

  it("sorts by remise_desc (default)", async () => {
    const db = createTestDb();
    await seed(db);
    const result = await getPromoProductsFiltered(db);
    expect(result.map((p) => p.id)).toEqual(["p2", "p1", "p3"]);
  });

  it("sorts by prix_asc", async () => {
    const db = createTestDb();
    await seed(db);
    const result = await getPromoProductsFiltered(db, { tri: "prix_asc" });
    expect(result.map((p) => p.id)).toEqual(["p2", "p1", "p3"]);
  });

  it("sorts by prix_desc", async () => {
    const db = createTestDb();
    await seed(db);
    const result = await getPromoProductsFiltered(db, { tri: "prix_desc" });
    expect(result.map((p) => p.id)).toEqual(["p3", "p1", "p2"]);
  });

  it("sorts by nouveau (created_at desc)", async () => {
    const db = createTestDb();
    await seed(db);
    const result = await getPromoProductsFiltered(db, { tri: "nouveau" });
    expect(result.map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `bun run test tests/lib/data/promo-products.test.ts`
Expected: FAIL — `getPromoProductsFiltered is not exported`.

- [ ] **Step 3: Implement `getPromoProductsFiltered`**

In `lib/data/products.ts`, after `getPromoProducts` (around line 113), add:

```ts
export type PromoFilters = {
  category_id?: string;
  tri?: "remise_desc" | "prix_asc" | "prix_desc" | "nouveau";
};

export async function getPromoProductsFiltered(
  db: Db,
  filters: PromoFilters = {}
): Promise<Product[]> {
  const conditions = [
    isNotNull(products.old_price),
    eq(products.is_active, true),
  ];

  if (filters.category_id) {
    conditions.push(
      or(
        eq(products.category_id, filters.category_id),
        eq(products.subcategory_id, filters.category_id)
      )!
    );
  }

  const orderBy =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : filters.tri === "nouveau"
          ? desc(products.created_at)
          : sql`(${products.old_price} - ${products.price}) * 1.0 / ${products.old_price} DESC`;

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(orderBy);

  return rows.map(parseProduct);
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `bun run test tests/lib/data/promo-products.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/data/products.ts tests/lib/data/promo-products.test.ts
git commit -m "feat(promo): add getPromoProductsFiltered data function"
```

---

## Task 2: PromoFilters client component

**Files:**
- Create: `components/promo/promo-filters.tsx`

- [ ] **Step 1: Implement component**

```tsx
// components/promo/promo-filters.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type PromoFiltersProps = {
  categories: { slug: string; name: string }[];
  current: {
    categorie?: string;
    tri?: string;
  };
};

const TRI_OPTIONS = [
  { label: "Plus grosse remise", value: "remise_desc" },
  { label: "Nouveautés", value: "nouveau" },
  { label: "Prix croissant", value: "prix_asc" },
  { label: "Prix décroissant", value: "prix_desc" },
];

export function PromoFilters({ categories, current }: PromoFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold">Tri</span>
        {TRI_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={current.tri === opt.value || (!current.tri && opt.value === "remise_desc") ? "default" : "ghost"}
            size="sm"
            onClick={() => toggle("tri", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold">Catégorie</span>
          {categories.map((cat) => (
            <Button
              key={cat.slug}
              variant={current.categorie === cat.slug ? "default" : "ghost"}
              size="sm"
              onClick={() => toggle("categorie", cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/promo/promo-filters.tsx
git commit -m "feat(promo): add PromoFilters client component"
```

---

## Task 3: `/offres` page

**Files:**
- Create: `app/(main)/offres/page.tsx`
- Test: `tests/app/offres-page.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/app/offres-page.test.tsx`:

```tsx
// tests/app/offres-page.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OffresPage from "@/app/(main)/offres/page";
import type { Product } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/data/products", () => ({
  getPromoProductsFiltered: vi.fn(),
}));

vi.mock("@/lib/data/categories", () => ({
  getCachedTopLevelCategories: vi.fn(),
  getCachedCategoryBySlug: vi.fn(),
}));

vi.mock("@/components/promo/promo-filters", () => ({
  PromoFilters: () => <div data-testid="promo-filters" />,
}));

vi.mock("@/components/products/product-card", () => ({
  ProductCard: ({ product }: { product: Product }) => <div data-testid="product-card">{product.name}</div>,
}));

import { getPromoProductsFiltered } from "@/lib/data/products";
import { getCachedTopLevelCategories, getCachedCategoryBySlug } from "@/lib/data/categories";

const PRODUCT: Product = {
  id: "p1",
  name: "Promo A",
  slug: "promo-a",
  category_id: "smartphones",
  subcategory_id: "iphone",
  price: 80000,
  old_price: 100000,
  brand: "Apple",
  images: ["/x.svg"],
  description: "x",
  specs: {},
  stock: 5,
  badge: null,
  is_active: true,
  created_at: new Date(),
};

beforeEach(() => {
  vi.mocked(getCachedTopLevelCategories).mockResolvedValue([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { id: "smartphones", slug: "smartphones", name: "Smartphones", parent_id: null } as any,
  ]);
  vi.mocked(getCachedCategoryBySlug).mockResolvedValue(null);
});

describe("OffresPage", () => {
  it("renders promo products and count", async () => {
    vi.mocked(getPromoProductsFiltered).mockResolvedValue([PRODUCT]);
    const ui = await OffresPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Offres/i);
    expect(screen.getByText(/1 produit/i)).toBeInTheDocument();
    expect(screen.getByTestId("product-card")).toHaveTextContent("Promo A");
  });

  it("renders empty state when no promos", async () => {
    vi.mocked(getPromoProductsFiltered).mockResolvedValue([]);
    const ui = await OffresPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.getByText(/Aucune promotion/i)).toBeInTheDocument();
  });

  it("resolves category slug to id when categorie param is set", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getCachedCategoryBySlug).mockResolvedValue({ id: "smartphones", slug: "smartphones" } as any);
    vi.mocked(getPromoProductsFiltered).mockResolvedValue([PRODUCT]);
    await OffresPage({ searchParams: Promise.resolve({ categorie: "smartphones" }) });
    expect(getCachedCategoryBySlug).toHaveBeenCalledWith("smartphones");
    expect(getPromoProductsFiltered).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ category_id: "smartphones" })
    );
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `bun run test tests/app/offres-page.test.tsx`
Expected: FAIL — module `@/app/(main)/offres/page` not found.

- [ ] **Step 3: Implement page**

Create `app/(main)/offres/page.tsx`:

```tsx
// app/(main)/offres/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getPromoProductsFiltered } from "@/lib/data/products";
import type { PromoFilters as PromoFiltersType } from "@/lib/data/products";
import { getCachedTopLevelCategories, getCachedCategoryBySlug } from "@/lib/data/categories";
import { ProductCard } from "@/components/products/product-card";
import { PromoFilters } from "@/components/promo/promo-filters";

export const dynamic = "force-dynamic";

const VALID_TRI = ["remise_desc", "prix_asc", "prix_desc", "nouveau"] as const;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function OffresPage({ searchParams }: Props) {
  const raw = await searchParams;
  const categorieSlug = firstString(raw.categorie);
  const rawTri = firstString(raw.tri);

  const tri = (VALID_TRI as readonly string[]).includes(rawTri ?? "")
    ? (rawTri as PromoFiltersType["tri"])
    : undefined;

  const categoryId = categorieSlug
    ? (await getCachedCategoryBySlug(categorieSlug))?.id
    : undefined;

  const filters: PromoFiltersType = {
    category_id: categoryId,
    tri,
  };

  const db = await getDb();
  const [products, categories] = await Promise.all([
    getPromoProductsFiltered(db, filters),
    getCachedTopLevelCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">Offres</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">Offres &amp; Promotions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {products.length} produit{products.length !== 1 ? "s" : ""} en promotion
      </p>

      <div className="mt-6">
        <PromoFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          current={{ categorie: categorieSlug, tri: rawTri }}
        />
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg font-medium">Aucune promotion en cours</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenez bientôt pour découvrir nos prochaines offres.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `bun run test tests/app/offres-page.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/(main)/offres/page.tsx tests/app/offres-page.test.tsx
git commit -m "feat(promo): add /offres page with filters"
```

---

## Task 4: Header navigation — desktop

**Files:**
- Modify: `components/layout/app-bar/desktop-nav.tsx`

- [ ] **Step 1: Add Offres link in desktop nav**

In `components/layout/app-bar/desktop-nav.tsx`, modify the `return (...)` of `DesktopNav` to insert an Offres link **after** the visible category items and **before** the overflow "Plus" block. Replace the current return with:

```tsx
  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-0.5">
      {visible.map((category) => (
        <NavItem key={category.id} category={category} allCategories={categories} {...navItemProps} />
      ))}

      <Link
        href="/offres"
        className="rounded-full px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-muted"
      >
        Offres
      </Link>

      {overflow.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter("__more__")}
          onMouseLeave={handleMouseLeave}
        >
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 rounded-full text-sm font-medium text-foreground"
            aria-expanded={openTray === "__more__"}
            aria-label="Plus de catégories"
          >
            Plus
            <ChevronDown className="size-3.5" />
          </Button>

          {openTray === "__more__" && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border bg-background p-1.5 shadow-lg">
              {overflow.map((category) => {
                const subcategories = categories.filter((c) => c.parent_id === category.id);
                return (
                  <Link
                    key={category.id}
                    href={`/${category.slug}`}
                    className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpenTray(null)}
                  >
                    {category.name}
                    {subcategories.length > 0 && (
                      <ChevronDown className="ml-auto size-3.5 -rotate-90 opacity-40" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
```

(`Link` is already imported at the top of the file.)

- [ ] **Step 2: Commit**

```bash
git add components/layout/app-bar/desktop-nav.tsx
git commit -m "feat(promo): add Offres link to desktop nav"
```

---

## Task 5: Header navigation — mobile menu

**Files:**
- Modify: `components/layout/app-bar/mobile-menu.tsx`

- [ ] **Step 1: Add Offres entry at top of mobile category list**

In `components/layout/app-bar/mobile-menu.tsx`, locate the block:

```tsx
        {!activeCategory ? (
          <div className="grid gap-2 pt-2">
            {topLevel.map((category) => {
```

Insert an Offres link as the first child of that grid, just before `{topLevel.map(...)}`:

```tsx
        {!activeCategory ? (
          <div className="grid gap-2 pt-2">
            <Link
              href="/offres"
              className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-4 text-base font-medium text-red-600 transition-colors hover:bg-red-100"
              onClick={handleClose}
            >
              Offres &amp; Promotions
            </Link>
            {topLevel.map((category) => {
```

(`Link` is already imported at the top of the file.)

- [ ] **Step 2: Commit**

```bash
git add components/layout/app-bar/mobile-menu.tsx
git commit -m "feat(promo): add Offres entry to mobile menu"
```

---

## Task 6: Full validation

- [ ] **Step 1: Run all tests**

Run: `bun run test`
Expected: all tests pass (existing + 9 new).

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: no NEW errors (pre-existing errors in auth/app-bar are documented in CLAUDE.md and acceptable).

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: success.

- [ ] **Step 4: Manual smoke test (optional)**

```bash
bun run db:migrate:dev && bun run db:seed:categories && bun run db:seed
bun run dev
```

Visit `http://localhost:33000/offres` — verify list, filters, header link (desktop + mobile viewport).

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin feat/phase6-offres  # or current branch
gh pr create --title "feat: phase 6 — page Offres/Promotions" --body "..."
```

---

## Checkpoint

- [ ] `/offres` accessible avec filtres tri + catégorie
- [ ] Lien Offres visible dans header desktop + mobile menu
- [ ] 9 nouveaux tests passent
- [ ] CI verte
- [ ] Deploy prod OK
