# Search Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a search page at `/recherche` with full-text LIKE search, horizontal filters, "load more" pagination, and live autocomplete suggestions in the search overlay.

**Architecture:** Server component page reads `searchParams` and calls `searchProducts()` for the initial batch. A client component handles "load more" via a server action. The search overlay gets live suggestions via a separate server action with debounce. All queries use SQL LIKE on product name/description/brand.

**Tech Stack:** Next.js 16 (App Router), React 19, Drizzle ORM + Cloudflare D1, Tailwind CSS v4 + Shadcn UI, Vitest + RTL

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/data/products.ts` | Add `searchProducts()` and `suggestProducts()` data functions |
| `lib/actions/search.ts` | Server actions: `searchSuggestions()`, `loadMoreSearchResults()` |
| `app/(main)/recherche/page.tsx` | Search results page (server component) |
| `components/search/search-filters.tsx` | Horizontal filter bar (client component) |
| `components/search/search-load-more.tsx` | "Load more" button + product grid (client component) |
| `components/layout/app-bar/search-overlay.tsx` | Add live suggestions to existing overlay |
| `tests/lib/data/search-products.test.ts` | Tests for `searchProducts()` and `suggestProducts()` |
| `tests/lib/actions/search.test.ts` | Tests for server actions |
| `tests/components/search/search-filters.test.tsx` | Tests for search filters component |
| `tests/components/search/search-load-more.test.tsx` | Tests for load more component |
| `tests/components/layout/app-bar/search-overlay.test.tsx` | Update existing tests for suggestions |

---

### Task 1: Data layer — `searchProducts()`

**Files:**
- Modify: `lib/data/products.ts`
- Test: `tests/lib/data/search-products.test.ts`

- [ ] **Step 1: Create test file with `searchProducts` tests**

Create `tests/lib/data/search-products.test.ts`:

```typescript
// tests/lib/data/search-products.test.ts
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { searchProducts } from "@/lib/data/products";

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
  return drizzle(sqlite, { schema }) as any;
}

const BASE = {
  id: "iphone-16-pro",
  name: "iPhone 16 Pro",
  slug: "iphone-16-pro",
  category_id: "smartphones",
  subcategory_id: "iphone",
  price: 899000,
  old_price: null,
  brand: "Apple",
  images: JSON.stringify(["/placeholder.svg"]),
  description: "Le meilleur smartphone Apple avec puce A18.",
  specs: JSON.stringify({ RAM: "8 Go" }),
  stock: 5,
  badge: "Nouveau",
  is_active: true,
  created_at: new Date("2026-01-01"),
} as const;

describe("searchProducts", () => {
  it("matches products by name", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await searchProducts(db, "iPhone");
    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe("iPhone 16 Pro");
  });

  it("matches products by description", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await searchProducts(db, "puce A18");
    expect(result.products).toHaveLength(1);
  });

  it("matches products by brand", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await searchProducts(db, "Apple");
    expect(result.products).toHaveLength(1);
  });

  it("returns empty for no match", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await searchProducts(db, "xiaomi");
    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("excludes inactive products", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values({ ...BASE, is_active: false });
    const result = await searchProducts(db, "iPhone");
    expect(result.products).toHaveLength(0);
  });

  it("filters by category_id", async () => {
    const db = createTestDb();
    const tablet = {
      ...BASE, id: "ipad", slug: "ipad", name: "iPad Pro",
      category_id: "tablettes", subcategory_id: null,
      description: "Tablette Apple.",
    };
    await db.insert(schema.products).values([BASE, tablet]);
    const result = await searchProducts(db, "Apple", { category_id: "smartphones" });
    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe("iPhone 16 Pro");
  });

  it("filters by brand", async () => {
    const db = createTestDb();
    const samsung = {
      ...BASE, id: "s25", slug: "s25", name: "Galaxy S25",
      brand: "Samsung", subcategory_id: null, description: "Smartphone Samsung.",
    };
    await db.insert(schema.products).values([BASE, samsung]);
    const result = await searchProducts(db, "smartphone", { brand: "Samsung" });
    expect(result.products).toHaveLength(1);
    expect(result.products[0].brand).toBe("Samsung");
  });

  it("filters by prix_max", async () => {
    const db = createTestDb();
    const cheap = {
      ...BASE, id: "se", slug: "se", name: "iPhone SE",
      price: 350000, subcategory_id: null, description: "iPhone abordable.",
    };
    await db.insert(schema.products).values([BASE, cheap]);
    const result = await searchProducts(db, "iPhone", { prix_max: 500000 });
    expect(result.products).toHaveLength(1);
    expect(result.products[0].price).toBe(350000);
  });

  it("paginates with offset and limit", async () => {
    const db = createTestDb();
    const items = Array.from({ length: 15 }, (_, i) => ({
      ...BASE,
      id: `phone-${i}`,
      slug: `phone-${i}`,
      name: `Phone ${i}`,
      subcategory_id: null,
    }));
    await db.insert(schema.products).values(items);
    const page1 = await searchProducts(db, "Phone", {}, 0, 12);
    expect(page1.products).toHaveLength(12);
    expect(page1.hasMore).toBe(true);
    expect(page1.total).toBe(15);

    const page2 = await searchProducts(db, "Phone", {}, 12, 12);
    expect(page2.products).toHaveLength(3);
    expect(page2.hasMore).toBe(false);
  });

  it("sorts by prix_asc", async () => {
    const db = createTestDb();
    const cheap = {
      ...BASE, id: "se", slug: "se", name: "iPhone SE",
      price: 350000, subcategory_id: null, description: "iPhone abordable.",
    };
    await db.insert(schema.products).values([BASE, cheap]);
    const result = await searchProducts(db, "iPhone", { tri: "prix_asc" });
    expect(result.products[0].price).toBe(350000);
    expect(result.products[1].price).toBe(899000);
  });

  it("sorts by prix_desc", async () => {
    const db = createTestDb();
    const cheap = {
      ...BASE, id: "se", slug: "se", name: "iPhone SE",
      price: 350000, subcategory_id: null, description: "iPhone abordable.",
    };
    await db.insert(schema.products).values([BASE, cheap]);
    const result = await searchProducts(db, "iPhone", { tri: "prix_desc" });
    expect(result.products[0].price).toBe(899000);
  });

  it("default sort prioritizes name matches over description-only matches", async () => {
    const db = createTestDb();
    const descOnly = {
      ...BASE, id: "case", slug: "case", name: "Coque protection",
      description: "Compatible avec iPhone 16 Pro.",
      category_id: "accessoires", subcategory_id: null,
    };
    await db.insert(schema.products).values([descOnly, BASE]);
    const result = await searchProducts(db, "iPhone");
    expect(result.products[0].name).toBe("iPhone 16 Pro");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test tests/lib/data/search-products.test.ts`
Expected: FAIL — `searchProducts` is not exported from `@/lib/data/products`

- [ ] **Step 3: Implement `searchProducts` in `lib/data/products.ts`**

Add these imports at the top of `lib/data/products.ts` (merge with existing):

```typescript
import { eq, or, and, ne, lte, gte, asc, desc, isNotNull, like, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
```

Add the `SearchFilters` type and `searchProducts` function at the end of the file:

```typescript
export type SearchFilters = {
  category_id?: string;
  brand?: string;
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};

export async function searchProducts(
  db: Db,
  query: string,
  filters: SearchFilters = {},
  offset = 0,
  limit = 12
): Promise<{ products: Product[]; hasMore: boolean; total: number }> {
  const pattern = `%${query}%`;

  const conditions: SQL[] = [
    or(
      like(products.name, pattern),
      like(products.description, pattern),
      like(products.brand, pattern)
    )!,
    eq(products.is_active, true),
  ];

  if (filters.category_id) conditions.push(eq(products.category_id, filters.category_id));
  if (filters.brand) conditions.push(eq(products.brand, filters.brand));
  if (filters.prix_min !== undefined) conditions.push(gte(products.price, filters.prix_min));
  if (filters.prix_max !== undefined) conditions.push(lte(products.price, filters.prix_max));

  const where = and(...conditions);

  const orderBy =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : filters.tri === "nouveau"
          ? desc(products.created_at)
          : sql`CASE WHEN ${products.name} LIKE ${pattern} THEN 0 ELSE 1 END, ${products.created_at} DESC`;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(limit + 1)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ]);

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  return {
    products: sliced.map(parseProduct),
    hasMore,
    total: Number(countResult[0]?.count ?? 0),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/lib/data/search-products.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/data/products.ts tests/lib/data/search-products.test.ts
git commit -m "feat(search): add searchProducts data function with filters and pagination"
```

---

### Task 2: Data layer — `suggestProducts()`

**Files:**
- Modify: `lib/data/products.ts`
- Test: `tests/lib/data/search-products.test.ts`

- [ ] **Step 1: Add `suggestProducts` tests to the existing test file**

Append to `tests/lib/data/search-products.test.ts`:

```typescript
import { suggestProducts } from "@/lib/data/products";

// ... (add after the searchProducts describe block)

describe("suggestProducts", () => {
  it("matches by name", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const results = await suggestProducts(db, "iPhone");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("iPhone 16 Pro");
  });

  it("matches by brand", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const results = await suggestProducts(db, "Apple");
    expect(results).toHaveLength(1);
  });

  it("does NOT match description-only", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const results = await suggestProducts(db, "puce A18");
    expect(results).toHaveLength(0);
  });

  it("excludes inactive products", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values({ ...BASE, is_active: false });
    const results = await suggestProducts(db, "iPhone");
    expect(results).toHaveLength(0);
  });

  it("limits to 5 results by default", async () => {
    const db = createTestDb();
    const items = Array.from({ length: 8 }, (_, i) => ({
      ...BASE,
      id: `phone-${i}`,
      slug: `phone-${i}`,
      name: `Phone ${i}`,
      subcategory_id: null,
    }));
    await db.insert(schema.products).values(items);
    const results = await suggestProducts(db, "Phone");
    expect(results).toHaveLength(5);
  });

  it("returns lightweight fields only (id, name, slug, brand, price, image)", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const results = await suggestProducts(db, "iPhone");
    const result = results[0];
    expect(result).toEqual({
      id: "iphone-16-pro",
      name: "iPhone 16 Pro",
      slug: "iphone-16-pro",
      brand: "Apple",
      price: 899000,
      image: "/placeholder.svg",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `bun run test tests/lib/data/search-products.test.ts`
Expected: FAIL — `suggestProducts` is not exported

- [ ] **Step 3: Implement `suggestProducts` in `lib/data/products.ts`**

Add at the end of `lib/data/products.ts`:

```typescript
export type ProductSuggestion = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  image: string;
};

export async function suggestProducts(
  db: Db,
  query: string,
  limit = 5
): Promise<ProductSuggestion[]> {
  const pattern = `%${query}%`;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      brand: products.brand,
      price: products.price,
      images: products.images,
    })
    .from(products)
    .where(
      and(
        or(like(products.name, pattern), like(products.brand, pattern)),
        eq(products.is_active, true)
      )
    )
    .limit(limit);

  return rows.map((row) => {
    let image = "/images/products/placeholder.svg";
    try {
      const parsed = JSON.parse(row.images);
      if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
    } catch { /* use placeholder */ }
    return { id: row.id, name: row.name, slug: row.slug, brand: row.brand, price: row.price, image };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/lib/data/search-products.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/data/products.ts tests/lib/data/search-products.test.ts
git commit -m "feat(search): add suggestProducts for overlay autocomplete"
```

---

### Task 3: Server actions — `searchSuggestions()` and `loadMoreSearchResults()`

**Files:**
- Create: `lib/actions/search.ts`
- Test: `tests/lib/actions/search.test.ts`

- [ ] **Step 1: Create test file**

Create `tests/lib/actions/search.test.ts`:

```typescript
// tests/lib/actions/search.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb to return a fake db
const mockSearchProducts = vi.fn();
const mockSuggestProducts = vi.fn();

vi.mock("@/lib/data/products", () => ({
  searchProducts: (...args: unknown[]) => mockSearchProducts(...args),
  suggestProducts: (...args: unknown[]) => mockSuggestProducts(...args),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue("mock-db"),
}));

// Import after mocks
const { searchSuggestions, loadMoreSearchResults } = await import(
  "@/lib/actions/search"
);

beforeEach(() => {
  mockSearchProducts.mockReset();
  mockSuggestProducts.mockReset();
});

describe("searchSuggestions", () => {
  it("returns empty array when query is shorter than 3 characters", async () => {
    const result = await searchSuggestions("ab");
    expect(result).toEqual([]);
    expect(mockSuggestProducts).not.toHaveBeenCalled();
  });

  it("calls suggestProducts with db and query when query >= 3 chars", async () => {
    mockSuggestProducts.mockResolvedValue([{ id: "1", name: "iPhone" }]);
    const result = await searchSuggestions("iph");
    expect(mockSuggestProducts).toHaveBeenCalledWith("mock-db", "iph");
    expect(result).toEqual([{ id: "1", name: "iPhone" }]);
  });

  it("returns empty array for empty string", async () => {
    const result = await searchSuggestions("");
    expect(result).toEqual([]);
  });
});

describe("loadMoreSearchResults", () => {
  it("calls searchProducts with correct arguments", async () => {
    mockSearchProducts.mockResolvedValue({
      products: [],
      hasMore: false,
      total: 0,
    });
    const filters = { brand: "Apple" };
    await loadMoreSearchResults("iphone", filters, 12);
    expect(mockSearchProducts).toHaveBeenCalledWith("mock-db", "iphone", filters, 12, 12);
  });

  it("returns products and hasMore from searchProducts", async () => {
    mockSearchProducts.mockResolvedValue({
      products: [{ id: "1" }],
      hasMore: true,
      total: 25,
    });
    const result = await loadMoreSearchResults("iphone", {}, 0);
    expect(result.products).toEqual([{ id: "1" }]);
    expect(result.hasMore).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test tests/lib/actions/search.test.ts`
Expected: FAIL — module `@/lib/actions/search` not found

- [ ] **Step 3: Implement server actions**

Create `lib/actions/search.ts`:

```typescript
"use server";

import { getDb } from "@/lib/db";
import { searchProducts, suggestProducts } from "@/lib/data/products";
import type { SearchFilters, ProductSuggestion, Product } from "@/lib/data/products";

export async function searchSuggestions(query: string): Promise<ProductSuggestion[]> {
  if (query.length < 3) return [];
  const db = await getDb();
  return suggestProducts(db, query);
}

export async function loadMoreSearchResults(
  query: string,
  filters: SearchFilters,
  offset: number
): Promise<{ products: Product[]; hasMore: boolean }> {
  const db = await getDb();
  const result = await searchProducts(db, query, filters, offset, 12);
  return { products: result.products, hasMore: result.hasMore };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/lib/actions/search.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/actions/search.ts tests/lib/actions/search.test.ts
git commit -m "feat(search): add server actions for suggestions and load more"
```

---

### Task 4: Search filters component

**Files:**
- Create: `components/search/search-filters.tsx`
- Test: `tests/components/search/search-filters.test.tsx`

- [ ] **Step 1: Create test file**

Create `tests/components/search/search-filters.test.tsx`:

```tsx
// tests/components/search/search-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchFilters } from "@/components/search/search-filters";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams("q=iphone");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/recherche",
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("SearchFilters", () => {
  const categories = [
    { slug: "smartphones", name: "Smartphones" },
    { slug: "tablettes", name: "Tablettes" },
  ];
  const brands = ["Apple", "Samsung"];
  const current = {};

  it("renders sort options", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("Nouveautés")).toBeInTheDocument();
    expect(screen.getByText("Prix croissant")).toBeInTheDocument();
    expect(screen.getByText("Prix décroissant")).toBeInTheDocument();
  });

  it("renders brand buttons", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
  });

  it("renders category buttons", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
  });

  it("renders price tier buttons", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("< 100 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("< 1 000 000 FCFA")).toBeInTheDocument();
  });

  it("pushes URL with filter param on click", async () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(mockPush).toHaveBeenCalledWith("/recherche?q=iphone&marque=Apple");
  });

  it("removes filter param on toggle off (click active filter)", async () => {
    mockSearchParams.set("marque", "Apple");
    render(
      <SearchFilters
        categories={categories}
        brands={brands}
        current={{ marque: "Apple" }}
      />
    );
    await userEvent.click(screen.getByText("Apple"));
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("marque=Apple");
    mockSearchParams.delete("marque");
  });

  it("pushes sort param on click", async () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    await userEvent.click(screen.getByText("Prix croissant"));
    expect(mockPush).toHaveBeenCalledWith("/recherche?q=iphone&tri=prix_asc");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test "tests/components/search/search-filters.test.tsx"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `SearchFilters` component**

Create `components/search/search-filters.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type SearchFiltersProps = {
  categories: { slug: string; name: string }[];
  brands: string[];
  current: {
    categorie?: string;
    marque?: string;
    prix_max?: string;
    tri?: string;
  };
};

const PRIX_OPTIONS = [
  { label: "< 100 000 FCFA", value: "100000" },
  { label: "< 300 000 FCFA", value: "300000" },
  { label: "< 500 000 FCFA", value: "500000" },
  { label: "< 1 000 000 FCFA", value: "1000000" },
];

const TRI_OPTIONS = [
  { label: "Nouveautés", value: "nouveau" },
  { label: "Prix croissant", value: "prix_asc" },
  { label: "Prix décroissant", value: "prix_desc" },
];

export function SearchFilters({ categories, brands, current }: SearchFiltersProps) {
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
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold">Tri</span>
        {TRI_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={current.tri === opt.value ? "default" : "ghost"}
            size="sm"
            onClick={() => toggle("tri", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Category */}
      {categories.length > 0 ? (
        <div className="flex items-center gap-1.5">
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

      {/* Brand */}
      {brands.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">Marque</span>
          {brands.map((brand) => (
            <Button
              key={brand}
              variant={current.marque === brand ? "default" : "ghost"}
              size="sm"
              onClick={() => toggle("marque", brand)}
            >
              {brand}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Price */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold">Prix max</span>
        {PRIX_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={current.prix_max === opt.value ? "default" : "ghost"}
            size="sm"
            onClick={() => toggle("prix_max", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test "tests/components/search/search-filters.test.tsx"`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add "components/search/search-filters.tsx" "tests/components/search/search-filters.test.tsx"
git commit -m "feat(search): add SearchFilters horizontal filter bar component"
```

---

### Task 5: Search load more component

**Files:**
- Create: `components/search/search-load-more.tsx`
- Test: `tests/components/search/search-load-more.test.tsx`

- [ ] **Step 1: Create test file**

Create `tests/components/search/search-load-more.test.tsx`:

```tsx
// tests/components/search/search-load-more.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchLoadMore } from "@/components/search/search-load-more";
import type { Product } from "@/lib/db/schema";

const mockLoadMore = vi.fn();

vi.mock("@/lib/actions/search", () => ({
  loadMoreSearchResults: (...args: unknown[]) => mockLoadMore(...args),
}));

// Mock ProductCard to avoid cart store dependency
vi.mock("@/components/products/product-card", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.id}`}>{product.name}</div>
  ),
}));

const makeProduct = (id: string, name: string): Product => ({
  id,
  name,
  slug: id,
  category_id: "smartphones",
  subcategory_id: null,
  price: 500000,
  old_price: null,
  brand: "Apple",
  images: ["/placeholder.svg"],
  description: "Test",
  specs: {},
  stock: 5,
  badge: null,
  is_active: true,
  created_at: new Date("2026-01-01"),
});

beforeEach(() => {
  mockLoadMore.mockReset();
});

describe("SearchLoadMore", () => {
  it("renders initial products", () => {
    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={false}
        query="iphone"
        filters={{}}
      />
    );
    expect(screen.getByText("iPhone 16")).toBeInTheDocument();
  });

  it("shows load more button when hasMore is true", () => {
    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={true}
        query="iphone"
        filters={{}}
      />
    );
    expect(screen.getByRole("button", { name: /charger plus/i })).toBeInTheDocument();
  });

  it("hides load more button when hasMore is false", () => {
    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={false}
        query="iphone"
        filters={{}}
      />
    );
    expect(screen.queryByRole("button", { name: /charger plus/i })).not.toBeInTheDocument();
  });

  it("fetches and appends more products on click", async () => {
    const newProduct = makeProduct("2", "iPhone 15");
    mockLoadMore.mockResolvedValue({ products: [newProduct], hasMore: false });

    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={true}
        query="iphone"
        filters={{}}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /charger plus/i }));

    await waitFor(() => {
      expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    });
    expect(screen.getByText("iPhone 16")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /charger plus/i })).not.toBeInTheDocument();
  });

  it("calls loadMoreSearchResults with correct offset", async () => {
    mockLoadMore.mockResolvedValue({ products: [], hasMore: false });

    render(
      <SearchLoadMore
        initialProducts={Array.from({ length: 12 }, (_, i) => makeProduct(`p${i}`, `P ${i}`))}
        initialHasMore={true}
        query="phone"
        filters={{ brand: "Apple" }}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /charger plus/i }));

    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalledWith("phone", { brand: "Apple" }, 12);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test "tests/components/search/search-load-more.test.tsx"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `SearchLoadMore` component**

Create `components/search/search-load-more.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { loadMoreSearchResults } from "@/lib/actions/search";
import type { Product } from "@/lib/db/schema";
import type { SearchFilters } from "@/lib/data/products";

type SearchLoadMoreProps = {
  initialProducts: Product[];
  initialHasMore: boolean;
  query: string;
  filters: SearchFilters;
};

export function SearchLoadMore({
  initialProducts,
  initialHasMore,
  query,
  filters,
}: SearchLoadMoreProps) {
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadMoreSearchResults(query, filters, products.length);
      setProducts((prev) => [...prev, ...result.products]);
      setHasMore(result.hasMore);
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Chargement..." : "Charger plus"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test "tests/components/search/search-load-more.test.tsx"`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add "components/search/search-load-more.tsx" "tests/components/search/search-load-more.test.tsx"
git commit -m "feat(search): add SearchLoadMore component with load-more pagination"
```

---

### Task 6: Search results page

**Files:**
- Create: `app/(main)/recherche/page.tsx`

- [ ] **Step 1: Create the search page**

Create `app/(main)/recherche/page.tsx`:

```tsx
// app/(main)/recherche/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { searchProducts, getPromoProducts } from "@/lib/data/products";
import type { SearchFilters } from "@/lib/data/products";
import { getTopLevelCategories } from "@/lib/data/categories";
import { ProductCard } from "@/components/products/product-card";
import { SearchFilters as SearchFiltersBar } from "@/components/search/search-filters";
import { SearchLoadMore } from "@/components/search/search-load-more";

export const dynamic = "force-dynamic";

const VALID_TRI = ["prix_asc", "prix_desc", "nouveau"] as const;

type Props = {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    marque?: string;
    prix_min?: string;
    prix_max?: string;
    tri?: string;
  }>;
};

export default async function RecherchePage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const db = await getDb();

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>
        <p className="mt-2 text-muted-foreground">
          Tapez un terme dans la barre de recherche pour trouver des produits.
        </p>
      </div>
    );
  }

  const tri = (VALID_TRI as readonly string[]).includes(params.tri ?? "")
    ? (params.tri as SearchFilters["tri"])
    : undefined;
  const prixMin = params.prix_min ? parseInt(params.prix_min, 10) : undefined;
  const prixMax = params.prix_max ? parseInt(params.prix_max, 10) : undefined;

  const filters: SearchFilters = {
    category_id: params.categorie ? await resolveCategorySlug(db, params.categorie) : undefined,
    brand: params.marque,
    prix_min: prixMin !== undefined && Number.isFinite(prixMin) ? prixMin : undefined,
    prix_max: prixMax !== undefined && Number.isFinite(prixMax) ? prixMax : undefined,
    tri,
  };

  const [{ products, hasMore, total }, categories] = await Promise.all([
    searchProducts(db, query, filters, 0, 12),
    getTopLevelCategories(db),
  ]);

  const brands = [...new Set(products.map((p) => p.brand))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <span className="font-medium text-foreground">Recherche</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        Résultats pour &laquo;{query}&raquo;
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} résultat{total !== 1 ? "s" : ""}
      </p>

      {/* Filters */}
      <div className="mt-6">
        <SearchFiltersBar
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          brands={brands}
          current={{
            categorie: params.categorie,
            marque: params.marque,
            prix_max: params.prix_max,
            tri: params.tri,
          }}
        />
      </div>

      {/* Results */}
      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState query={query} db={db} />
        ) : (
          <SearchLoadMore
            initialProducts={products}
            initialHasMore={hasMore}
            query={query}
            filters={filters}
          />
        )}
      </div>
    </div>
  );
}

async function EmptyState({ query, db }: { query: string; db: any }) {
  const popularProducts = await getPromoProducts(db, 8);

  return (
    <div>
      <div className="py-12 text-center">
        <p className="text-lg font-medium">Aucun résultat pour &laquo;{query}&raquo;</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Essayez avec d&apos;autres termes ou parcourez nos catégories.
        </p>
      </div>

      {popularProducts.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Produits populaires</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Helper: resolve category slug to ID for filtering
import { getCategoryBySlug } from "@/lib/data/categories";
import type { Db } from "@/lib/db";

async function resolveCategorySlug(db: Db, slug: string): Promise<string | undefined> {
  const category = await getCategoryBySlug(db, slug);
  return category?.id;
}
```

- [ ] **Step 2: Verify the page compiles**

Run: `bunx tsc --noEmit --pretty`
Expected: No type errors in the new file (pre-existing warnings are OK)

- [ ] **Step 3: Commit**

```bash
git add "app/(main)/recherche/page.tsx"
git commit -m "feat(search): add /recherche page with filters, load more, and empty state"
```

---

### Task 7: Search overlay — live suggestions

**Files:**
- Modify: `components/layout/app-bar/search-overlay.tsx`
- Update: `tests/components/layout/app-bar/search-overlay.test.tsx`

- [ ] **Step 1: Add suggestion tests to existing test file**

Replace the contents of `tests/components/layout/app-bar/search-overlay.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchOverlay } from "@/components/layout/app-bar/search-overlay";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSearchSuggestions = vi.fn();
vi.mock("@/lib/actions/search", () => ({
  searchSuggestions: (...args: unknown[]) => mockSearchSuggestions(...args),
}));

describe("SearchOverlay", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    mockPush.mockClear();
    mockSearchSuggestions.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with dialog role", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<SearchOverlay onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /fermer/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    render(<SearchOverlay onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const { container } = render(<SearchOverlay onClose={onClose} />);
    const backdrop = container.querySelector("[aria-hidden='true']") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not fetch suggestions when query is shorter than 3 characters", async () => {
    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "ip" } });
    await vi.advanceTimersByTimeAsync(400);
    expect(mockSearchSuggestions).not.toHaveBeenCalled();
  });

  it("fetches suggestions after debounce when query >= 3 chars", async () => {
    mockSearchSuggestions.mockResolvedValue([
      { id: "1", name: "iPhone 16 Pro", slug: "iphone-16-pro", brand: "Apple", price: 899000, image: "/img.jpg" },
    ]);

    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "iph" } });
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(mockSearchSuggestions).toHaveBeenCalledWith("iph");
    });
  });

  it("displays suggestion items", async () => {
    mockSearchSuggestions.mockResolvedValue([
      { id: "1", name: "iPhone 16 Pro", slug: "iphone-16-pro", brand: "Apple", price: 899000, image: "/img.jpg" },
    ]);

    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "iphone" } });
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
    });
  });

  it("navigates to /recherche on Enter without selected suggestion", () => {
    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "iphone" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/recherche?q=iphone");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not navigate on Enter with empty query", () => {
    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `bun run test tests/components/layout/app-bar/search-overlay.test.tsx`
Expected: FAIL — tests that reference suggestions behavior fail because the overlay doesn't have suggestion logic yet

- [ ] **Step 3: Rewrite `search-overlay.tsx` with suggestions**

Replace `components/layout/app-bar/search-overlay.tsx`:

```tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { searchSuggestions } from "@/lib/actions/search";
import { formatPrice } from "@/lib/utils";
import type { ProductSuggestion } from "@/lib/data/products";

type SearchOverlayProps = {
  onClose: () => void;
};

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTrapRef = useFocusTrap();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchSuggestions(value);
      setSuggestions(results);
      setSelectedIndex(-1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  }

  function navigateToSearch() {
    if (!query.trim()) return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
    onCloseRef.current();
  }

  function navigateToProduct(slug: string) {
    router.push(`/produits/${slug}`);
    onCloseRef.current();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigateToProduct(suggestions[selectedIndex].slug);
      } else {
        navigateToSearch();
      }
    }
  }

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Recherche">
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-x-0 top-0 z-50 bg-background shadow-sm">
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-4 px-4 lg:px-6">
          <Image src="/images/dbs-store-logo.png" alt="DBS Store" width={70} height={32} />

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher des produits..."
              className="w-full rounded-full bg-muted px-5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
            />

            {isLoading ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : null}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer la recherche">
            <X className="size-5" />
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 ? (
          <ul
            id="search-suggestions"
            role="listbox"
            className="mx-auto max-w-7xl border-t px-4 py-2 lg:px-6"
          >
            {suggestions.map((item, index) => (
              <li
                key={item.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                }`}
                onClick={() => navigateToProduct(item.slug)}
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.brand}</span>
                <span className="ml-auto font-semibold">{formatPrice(item.price)} FCFA</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/search-overlay.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/layout/app-bar/search-overlay.tsx tests/components/layout/app-bar/search-overlay.test.tsx
git commit -m "feat(search): add live autocomplete suggestions to search overlay"
```

---

### Task 8: Run all tests and verify build

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests PASS (pre-existing tests should not be broken)

- [ ] **Step 2: Run type check**

Run: `bunx tsc --noEmit --pretty`
Expected: No new type errors

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: No new errors (pre-existing warnings are OK per CLAUDE.md)

- [ ] **Step 4: Fix any issues found**

If any tests fail or type errors appear, fix them before proceeding.

- [ ] **Step 5: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix(search): address test/type/lint issues"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-04-04-search-page.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
