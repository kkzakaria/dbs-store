# Phase 2 — Catégories dynamiques en D1 + Admin CRUD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 54 hardcoded categories from `lib/data/categories.ts` to a D1 table with admin CRUD, updating all consumers to read from D1.

**Architecture:** Add a `categories` table in D1 via Drizzle migration. Rewrite `lib/data/categories.ts` to export async functions reading D1. Create admin CRUD at `/admin/categories` with server actions. Update navigation (passed as props from layout) and all pages to use async category queries.

**Tech Stack:** Drizzle ORM, D1, Next.js Server Actions, Shadcn UI (Dialog, Select), R2 presigned uploads, Vitest

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `lib/db/schema.ts` | Add `categories` table definition + types |
| Create | `drizzle/0003_*.sql` | Generated migration for categories table |
| Rewrite | `lib/data/categories.ts` | Async D1 query functions (replaces static array) |
| Create | `lib/actions/admin-categories.ts` | Server actions: create, update, delete |
| Create | `app/(admin)/admin/categories/page.tsx` | Admin categories list page |
| Create | `components/admin/category-list.tsx` | Client component: indented list + edit/delete modals |
| Create | `components/admin/category-form-dialog.tsx` | Client component: create/edit category modal |
| Modify | `components/admin/sidebar.tsx` | Add "Catégories" nav item |
| Modify | `app/(main)/layout.tsx` | Load categories from D1, pass to AppBar |
| Modify | `components/layout/app-bar/app-bar.tsx` | Accept + forward category props |
| Modify | `components/layout/app-bar/desktop-nav.tsx` | Accept categories as props instead of importing |
| Modify | `components/layout/app-bar/mobile-menu.tsx` | Accept categories as props instead of importing |
| Modify | `app/(main)/[slug]/page.tsx` | Use async D1 queries, remove `generateStaticParams` |
| Modify | `app/(main)/produits/[slug]/page.tsx` | Use async D1 queries for breadcrumbs |
| Modify | `components/admin/product-form.tsx` | Accept categories as props |
| Modify | `app/(admin)/admin/produits/page.tsx` | Load categories from D1 |
| Modify | `app/(admin)/admin/produits/nouveau/page.tsx` | Load + pass categories to ProductForm |
| Modify | `app/(admin)/admin/produits/[id]/page.tsx` | Load + pass categories to ProductForm |
| Create | `scripts/seed-categories.ts` | Seed 54 categories into D1 |
| Rewrite | `tests/lib/data/categories.test.ts` | Test async D1 query functions |
| Create | `tests/lib/actions/admin-categories.test.ts` | Test server actions |
| Modify | `tests/components/layout/app-bar/desktop-nav.test.tsx` | Pass categories as props |
| Modify | `tests/components/layout/app-bar/mobile-menu.test.tsx` | Pass categories as props |

---

### Task 1: Drizzle schema + migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0003_*.sql` (generated)

- [ ] **Step 1: Add categories table to schema**

Add to `lib/db/schema.ts`, after the `hero_slides` table definition:

```typescript
// ── Categories ───────────────────────────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  image: text("image"),
  parent_id: text("parent_id"),
  order: integer("order").default(0).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

- [ ] **Step 2: Generate migration**

Run: `bun run db:generate`
Expected: New file `drizzle/0003_*.sql` with CREATE TABLE categories.

- [ ] **Step 3: Apply migration locally**

Run: `bun run db:migrate:local`
Expected: Migration applied successfully.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(phase2): add categories table schema + migration"
```

---

### Task 2: Rewrite `lib/data/categories.ts` — async D1 queries

**Files:**
- Rewrite: `lib/data/categories.ts`
- Rewrite: `tests/lib/data/categories.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace `tests/lib/data/categories.test.ts` with:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq, isNull, asc } from "drizzle-orm";

const mockRows: Array<{
  id: string;
  slug: string;
  name: string;
  icon: string;
  image: string | null;
  parent_id: string | null;
  order: number;
  created_at: Date;
}> = [];

const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn(() => Promise.resolve(mockRows));
const mockLimit = vi.fn(() => Promise.resolve(mockRows));

const mockDb = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
};

type MockDb = typeof mockDb;

beforeEach(() => {
  mockRows.length = 0;
  vi.clearAllMocks();
  mockSelect.mockReturnThis();
  mockFrom.mockReturnThis();
  mockWhere.mockReturnThis();
  mockOrderBy.mockImplementation(() => Promise.resolve(mockRows));
  mockLimit.mockImplementation(() => Promise.resolve(mockRows));
});

import {
  getTopLevelCategories,
  getSubcategories,
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
} from "@/lib/data/categories";

const now = new Date();

function makeCategory(overrides: Partial<{
  id: string; slug: string; name: string; icon: string;
  image: string | null; parent_id: string | null; order: number; created_at: Date;
}> = {}) {
  return {
    id: "test", slug: "test", name: "Test", icon: "box",
    image: null, parent_id: null, order: 0, created_at: now,
    ...overrides,
  };
}

describe("getTopLevelCategories", () => {
  it("queries categories with null parent_id ordered by order", async () => {
    const cats = [makeCategory({ id: "a", order: 0 }), makeCategory({ id: "b", order: 1 })];
    mockOrderBy.mockResolvedValueOnce(cats);

    const result = await getTopLevelCategories(mockDb as unknown as MockDb);
    expect(mockSelect).toHaveBeenCalled();
    expect(result).toEqual(cats);
  });
});

describe("getSubcategories", () => {
  it("queries categories by parent_id ordered by order", async () => {
    const subs = [makeCategory({ id: "sub1", parent_id: "smartphones" })];
    mockOrderBy.mockResolvedValueOnce(subs);

    const result = await getSubcategories(mockDb as unknown as MockDb, "smartphones");
    expect(result).toEqual(subs);
  });
});

describe("getAllCategories", () => {
  it("returns all categories ordered", async () => {
    const all = [makeCategory()];
    mockOrderBy.mockResolvedValueOnce(all);

    const result = await getAllCategories(mockDb as unknown as MockDb);
    expect(result).toEqual(all);
  });
});

describe("getCategoryBySlug", () => {
  it("returns category matching slug", async () => {
    const cat = makeCategory({ slug: "smartphones" });
    mockLimit.mockResolvedValueOnce([cat]);

    const result = await getCategoryBySlug(mockDb as unknown as MockDb, "smartphones");
    expect(result).toEqual(cat);
  });

  it("returns null when not found", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const result = await getCategoryBySlug(mockDb as unknown as MockDb, "nope");
    expect(result).toBeNull();
  });
});

describe("getCategoryById", () => {
  it("returns category matching id", async () => {
    const cat = makeCategory({ id: "smartphones" });
    mockLimit.mockResolvedValueOnce([cat]);

    const result = await getCategoryById(mockDb as unknown as MockDb, "smartphones");
    expect(result).toEqual(cat);
  });

  it("returns null when not found", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const result = await getCategoryById(mockDb as unknown as MockDb, "nope");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test tests/lib/data/categories.test.ts`
Expected: FAIL — current module exports sync functions without `db` parameter.

- [ ] **Step 3: Rewrite `lib/data/categories.ts`**

Replace the entire file with:

```typescript
import { eq, isNull, asc } from "drizzle-orm";
import { categories as categoriesTable } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export type { Category } from "@/lib/db/schema";

export async function getTopLevelCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categoriesTable)
    .where(isNull(categoriesTable.parent_id))
    .orderBy(asc(categoriesTable.order));
}

export async function getSubcategories(db: Db, parentId: string): Promise<Category[]> {
  return db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.parent_id, parentId))
    .orderBy(asc(categoriesTable.order));
}

export async function getAllCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.order));
}

export async function getCategoryBySlug(db: Db, slug: string): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCategoryById(db: Db, id: string): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/lib/data/categories.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/data/categories.ts tests/lib/data/categories.test.ts
git commit -m "feat(phase2): rewrite categories as async D1 queries"
```

---

### Task 3: Seed script for categories

**Files:**
- Create: `scripts/seed-categories.ts`

- [ ] **Step 1: Create the seed script**

Create `scripts/seed-categories.ts`:

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { categories } from "../lib/db/schema";

const db = drizzle(new Database(process.env.DATABASE_URL ?? "./dev.db"));
const now = new Date();

const seed = [
  // Top-level
  { id: "smartphones",    slug: "smartphones",        name: "Smartphones",          icon: "smartphone",  image: null, parent_id: null, order: 0,  created_at: now },
  { id: "tablettes",      slug: "tablettes",          name: "Tablettes",            icon: "tablet",      image: null, parent_id: null, order: 1,  created_at: now },
  { id: "ordinateurs",    slug: "ordinateurs",        name: "Ordinateurs",          icon: "laptop",      image: null, parent_id: null, order: 2,  created_at: now },
  { id: "montres",        slug: "montres-connectees", name: "Montres connectées",   icon: "watch",       image: null, parent_id: null, order: 3,  created_at: now },
  { id: "audio",          slug: "audio",              name: "Audio",                icon: "headphones",  image: null, parent_id: null, order: 4,  created_at: now },
  { id: "cameras-drones", slug: "cameras-drones",     name: "Caméras & Drones",     icon: "camera",      image: null, parent_id: null, order: 5,  created_at: now },
  { id: "gaming",         slug: "gaming",             name: "Gaming",               icon: "gamepad-2",   image: null, parent_id: null, order: 6,  created_at: now },
  { id: "imprimantes",    slug: "imprimantes",        name: "Imprimantes",          icon: "printer",     image: null, parent_id: null, order: 7,  created_at: now },
  { id: "accessoires",    slug: "accessoires",        name: "Accessoires",          icon: "cable",       image: null, parent_id: null, order: 8,  created_at: now },
  { id: "offres",         slug: "offres",             name: "Offres",               icon: "percent",     image: null, parent_id: null, order: 9,  created_at: now },
  { id: "support",        slug: "support",            name: "Support",              icon: "life-buoy",   image: null, parent_id: null, order: 10, created_at: now },

  // Smartphones
  { id: "iphone",         slug: "iphone",             name: "iPhone",               icon: "smartphone",  image: null, parent_id: "smartphones", order: 0, created_at: now },
  { id: "samsung-galaxy", slug: "samsung-galaxy",     name: "Samsung Galaxy",       icon: "smartphone",  image: null, parent_id: "smartphones", order: 1, created_at: now },
  { id: "google-pixel",   slug: "google-pixel",       name: "Google Pixel",         icon: "smartphone",  image: null, parent_id: "smartphones", order: 2, created_at: now },
  { id: "xiaomi",         slug: "xiaomi",             name: "Xiaomi",               icon: "smartphone",  image: null, parent_id: "smartphones", order: 3, created_at: now },
  { id: "huawei",         slug: "huawei",             name: "Huawei",               icon: "smartphone",  image: null, parent_id: "smartphones", order: 4, created_at: now },
  { id: "autres-marques", slug: "autres-marques",     name: "Autres marques",       icon: "smartphone",  image: null, parent_id: "smartphones", order: 5, created_at: now },

  // Tablettes
  { id: "ipad",                  slug: "ipad",                  name: "iPad",                  icon: "tablet",     image: null, parent_id: "tablettes", order: 0, created_at: now },
  { id: "samsung-tab",           slug: "samsung-tab",           name: "Samsung Tab",           icon: "tablet",     image: null, parent_id: "tablettes", order: 1, created_at: now },
  { id: "tablettes-android",     slug: "tablettes-android",     name: "Tablettes Android",     icon: "tablet",     image: null, parent_id: "tablettes", order: 2, created_at: now },
  { id: "accessoires-tablettes", slug: "accessoires-tablettes", name: "Accessoires tablettes", icon: "tablet",     image: null, parent_id: "tablettes", order: 3, created_at: now },

  // Ordinateurs
  { id: "laptops",     slug: "laptops",     name: "Laptops",     icon: "laptop",  image: null, parent_id: "ordinateurs", order: 0, created_at: now },
  { id: "desktops",    slug: "desktops",    name: "Desktops",    icon: "monitor", image: null, parent_id: "ordinateurs", order: 1, created_at: now },
  { id: "tout-en-un",  slug: "tout-en-un",  name: "Tout-en-un",  icon: "monitor", image: null, parent_id: "ordinateurs", order: 2, created_at: now },
  { id: "chromebooks", slug: "chromebooks", name: "Chromebooks",  icon: "laptop",  image: null, parent_id: "ordinateurs", order: 3, created_at: now },

  // Montres connectées
  { id: "apple-watch",          slug: "apple-watch",          name: "Apple Watch",          icon: "watch", image: null, parent_id: "montres", order: 0, created_at: now },
  { id: "samsung-galaxy-watch", slug: "samsung-galaxy-watch", name: "Samsung Galaxy Watch", icon: "watch", image: null, parent_id: "montres", order: 1, created_at: now },
  { id: "huawei-watch",         slug: "huawei-watch",         name: "Huawei Watch",         icon: "watch", image: null, parent_id: "montres", order: 2, created_at: now },
  { id: "google-pixel-watch",   slug: "google-pixel-watch",   name: "Google Pixel Watch",   icon: "watch", image: null, parent_id: "montres", order: 3, created_at: now },
  { id: "fitbit",               slug: "fitbit",               name: "Fitbit",               icon: "watch", image: null, parent_id: "montres", order: 4, created_at: now },
  { id: "autres-montres",       slug: "autres-montres",       name: "Autres montres",       icon: "watch", image: null, parent_id: "montres", order: 5, created_at: now },

  // Audio
  { id: "ecouteurs-sans-fil",      slug: "ecouteurs-sans-fil",      name: "Écouteurs sans fil",      icon: "headphones", image: null, parent_id: "audio", order: 0, created_at: now },
  { id: "casques",                  slug: "casques",                  name: "Casques",                  icon: "headphones", image: null, parent_id: "audio", order: 1, created_at: now },
  { id: "enceintes-bluetooth",     slug: "enceintes-bluetooth",     name: "Enceintes Bluetooth",     icon: "speaker",    image: null, parent_id: "audio", order: 2, created_at: now },
  { id: "enceintes-intelligentes", slug: "enceintes-intelligentes", name: "Enceintes intelligentes", icon: "speaker",    image: null, parent_id: "audio", order: 3, created_at: now },
  { id: "micros",                  slug: "micros",                  name: "Micros",                  icon: "mic",        image: null, parent_id: "audio", order: 4, created_at: now },
  { id: "barres-de-son",           slug: "barres-de-son",           name: "Barres de son",           icon: "speaker",    image: null, parent_id: "audio", order: 5, created_at: now },

  // Caméras & Drones
  { id: "drones",          slug: "drones",          name: "Drones",           icon: "camera", image: null, parent_id: "cameras-drones", order: 0, created_at: now },
  { id: "cameras-action",  slug: "cameras-action",  name: "Caméras d'action", icon: "camera", image: null, parent_id: "cameras-drones", order: 1, created_at: now },
  { id: "stabilisateurs",  slug: "stabilisateurs",  name: "Stabilisateurs",   icon: "camera", image: null, parent_id: "cameras-drones", order: 2, created_at: now },
  { id: "appareils-photo", slug: "appareils-photo", name: "Appareils photo",  icon: "camera", image: null, parent_id: "cameras-drones", order: 3, created_at: now },

  // Gaming
  { id: "consoles",        slug: "consoles",        name: "Consoles", icon: "gamepad-2", image: null, parent_id: "gaming", order: 0, created_at: now },
  { id: "manettes-gaming", slug: "manettes-gaming", name: "Manettes", icon: "gamepad-2", image: null, parent_id: "gaming", order: 1, created_at: now },

  // Imprimantes
  { id: "imprimantes-laser", slug: "imprimantes-laser", name: "Laser",          icon: "printer",    image: null, parent_id: "imprimantes", order: 0, created_at: now },
  { id: "jet-encre",         slug: "jet-encre",         name: "Jet d'encre",    icon: "printer",    image: null, parent_id: "imprimantes", order: 1, created_at: now },
  { id: "multifonctions",   slug: "multifonctions",     name: "Multifonctions", icon: "printer",    image: null, parent_id: "imprimantes", order: 2, created_at: now },
  { id: "projecteurs",      slug: "projecteurs",        name: "Projecteurs",    icon: "projector",  image: null, parent_id: "imprimantes", order: 3, created_at: now },

  // Accessoires
  { id: "coques-protections", slug: "coques-protections", name: "Coques & protections", icon: "shield",     image: null, parent_id: "accessoires", order: 0, created_at: now },
  { id: "chargeurs-cables",   slug: "chargeurs-cables",   name: "Chargeurs & câbles",   icon: "cable",      image: null, parent_id: "accessoires", order: 1, created_at: now },
  { id: "stockage",           slug: "stockage",           name: "Stockage",             icon: "hard-drive", image: null, parent_id: "accessoires", order: 2, created_at: now },
  { id: "supports-docks",     slug: "supports-docks",     name: "Supports & docks",     icon: "monitor",    image: null, parent_id: "accessoires", order: 3, created_at: now },
  { id: "claviers-souris",    slug: "claviers-souris",    name: "Claviers & souris",    icon: "keyboard",   image: null, parent_id: "accessoires", order: 4, created_at: now },
  { id: "maison-connectee",   slug: "maison-connectee",   name: "Maison connectée",     icon: "home",       image: null, parent_id: "accessoires", order: 5, created_at: now },
  { id: "wearables",          slug: "wearables",          name: "Wearables",            icon: "glasses",    image: null, parent_id: "accessoires", order: 6, created_at: now },
];

async function main() {
  console.log(`Seeding ${seed.length} categories...`);
  await db.insert(categories).values(seed);
  console.log("Done!");
}

main().catch(console.error);
```

- [ ] **Step 2: Add npm script**

In `package.json`, add to `"scripts"`:
```json
"db:seed:categories": "tsx scripts/seed-categories.ts"
```

- [ ] **Step 3: Run seed locally**

Run: `bun run db:seed:categories`
Expected: "Seeding 54 categories... Done!"

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-categories.ts package.json
git commit -m "feat(phase2): add categories seed script"
```

---

### Task 4: Admin server actions for categories

**Files:**
- Create: `lib/actions/admin-categories.ts`
- Create: `tests/lib/actions/admin-categories.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/actions/admin-categories.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockResolvedValue([]);
const mockLimit = vi.fn().mockResolvedValue([]);

const mockDb = {
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  select: mockSelect,
  from: mockFrom,
  values: mockValues,
  set: mockSet,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));
const mockAuthApi = { getSession: vi.fn(), listOrganizations: vi.fn() };
vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn(() => Promise.resolve({ api: mockAuthApi })),
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { ORG_SLUG } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockDelete.mockReturnThis();
  mockSelect.mockReturnThis();
  mockFrom.mockReturnThis();
  mockValues.mockResolvedValue(undefined);
  mockSet.mockReturnThis();
  mockWhere.mockResolvedValue(undefined);
  mockOrderBy.mockResolvedValue([]);
  mockLimit.mockResolvedValue([]);

  mockAuthApi.getSession.mockResolvedValue({ user: { id: "u1" } });
  mockAuthApi.listOrganizations.mockResolvedValue([{ slug: ORG_SLUG }]);
});

import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryFormData,
} from "@/lib/actions/admin-categories";

const validData: CategoryFormData = {
  name: "Smartphones",
  slug: "smartphones",
  icon: "smartphone",
  image: null,
  parent_id: null,
  order: 0,
};

describe("createCategory", () => {
  it("rejects empty name", async () => {
    const result = await createCategory({ ...validData, name: "" });
    expect(result.error).toMatch(/nom/i);
  });

  it("rejects empty slug", async () => {
    const result = await createCategory({ ...validData, slug: "" });
    expect(result.error).toMatch(/slug/i);
  });

  it("rejects empty icon", async () => {
    const result = await createCategory({ ...validData, icon: "" });
    expect(result.error).toMatch(/icône/i);
  });

  it("inserts valid category", async () => {
    const result = await createCategory(validData);
    expect(result.error).toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("updateCategory", () => {
  it("rejects empty name", async () => {
    const result = await updateCategory("smartphones", { ...validData, name: "" });
    expect(result.error).toMatch(/nom/i);
  });

  it("rejects self-referencing parent", async () => {
    const result = await updateCategory("smartphones", { ...validData, parent_id: "smartphones" });
    expect(result.error).toMatch(/parent/i);
  });

  it("updates valid category", async () => {
    const result = await updateCategory("smartphones", validData);
    expect(result.error).toBeUndefined();
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("deleteCategory", () => {
  it("blocks deletion if category has children", async () => {
    // Simulate children exist
    mockOrderBy.mockResolvedValueOnce([{ id: "iphone" }]);
    const result = await deleteCategory("smartphones");
    expect(result.error).toMatch(/sous-catégories/i);
  });

  it("blocks deletion if category has products", async () => {
    // No children
    mockOrderBy.mockResolvedValueOnce([]);
    // Has products
    mockLimit.mockResolvedValueOnce([{ id: "p1" }]);
    const result = await deleteCategory("smartphones");
    expect(result.error).toMatch(/produits/i);
  });

  it("deletes category with no children or products", async () => {
    mockOrderBy.mockResolvedValueOnce([]);  // no children
    mockLimit.mockResolvedValueOnce([]);    // no products
    const result = await deleteCategory("smartphones");
    expect(result.error).toBeUndefined();
    expect(mockDelete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test tests/lib/actions/admin-categories.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement server actions**

Create `lib/actions/admin-categories.ts`:

```typescript
"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { products } from "@/lib/db/schema";
import { getSubcategories } from "@/lib/data/categories";

export type CategoryFormData = {
  name: string;
  slug: string;
  icon: string;
  image: string | null;
  parent_id: string | null;
  order: number;
};

function validate(data: CategoryFormData): string | null {
  if (!data.name?.trim()) return "Le nom est requis";
  if (!data.slug?.trim()) return "Le slug est requis";
  if (!data.icon?.trim()) return "L'icône est requise";
  return null;
}

export async function createCategory(
  data: CategoryFormData
): Promise<{ error?: string }> {
  await requireOrgMember();
  const error = validate(data);
  if (error) return { error };

  const db = await getDb();

  try {
    await db.insert(categories).values({
      id: data.slug.trim(),
      slug: data.slug.trim(),
      name: data.name.trim(),
      icon: data.icon.trim(),
      image: data.image || null,
      parent_id: data.parent_id || null,
      order: data.order,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("[createCategory]", err);
    return { error: "Erreur lors de la création (slug déjà utilisé ?)" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}

export async function updateCategory(
  id: string,
  data: CategoryFormData
): Promise<{ error?: string }> {
  await requireOrgMember();
  const error = validate(data);
  if (error) return { error };

  if (data.parent_id === id) {
    return { error: "Une catégorie ne peut pas être son propre parent" };
  }

  const db = await getDb();

  try {
    await db
      .update(categories)
      .set({
        slug: data.slug.trim(),
        name: data.name.trim(),
        icon: data.icon.trim(),
        image: data.image || null,
        parent_id: data.parent_id || null,
        order: data.order,
      })
      .where(eq(categories.id, id));
  } catch (err) {
    console.error("[updateCategory]", err);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}

export async function deleteCategory(
  id: string
): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = await getDb();

  // Check for children
  const children = await getSubcategories(db, id);
  if (children.length > 0) {
    return { error: "Supprimez d'abord les sous-catégories" };
  }

  // Check for products using this category
  const productUsingCategory = await db
    .select()
    .from(products)
    .where(or(eq(products.category_id, id), eq(products.subcategory_id, id)))
    .limit(1);

  if (productUsingCategory.length > 0) {
    return { error: "Des produits utilisent cette catégorie" };
  }

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (err) {
    console.error("[deleteCategory]", err);
    return { error: "Erreur lors de la suppression" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test tests/lib/actions/admin-categories.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/admin-categories.ts tests/lib/actions/admin-categories.test.ts
git commit -m "feat(phase2): add category server actions with tests"
```

---

### Task 5: Admin sidebar — add Catégories link

**Files:**
- Modify: `components/admin/sidebar.tsx`

- [ ] **Step 1: Add Catégories to nav items**

In `components/admin/sidebar.tsx`, add `FolderTree` to the lucide-react import:

```typescript
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  ImagePlay,
  FolderTree,
} from "lucide-react";
```

Add the Catégories entry to `navItems` array, between Hero and Produits:

```typescript
const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Hero", href: "/admin/hero", icon: ImagePlay, exact: false },
  { label: "Catégories", href: "/admin/categories", icon: FolderTree, exact: false },
  { label: "Produits", href: "/admin/produits", icon: Package, exact: false },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart, exact: false },
  { label: "Équipe", href: "/admin/equipe", icon: Users, exact: false },
];
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/sidebar.tsx
git commit -m "feat(phase2): add Catégories link to admin sidebar"
```

---

### Task 6: Admin categories page + client components

**Files:**
- Create: `app/(admin)/admin/categories/page.tsx`
- Create: `components/admin/category-list.tsx`
- Create: `components/admin/category-form-dialog.tsx`

- [ ] **Step 1: Create the admin categories page**

Create `app/(admin)/admin/categories/page.tsx`:

```typescript
import { getDb } from "@/lib/db";
import { getAllCategories } from "@/lib/data/categories";
import { CategoryList } from "@/components/admin/category-list";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const db = await getDb();
  const categories = await getAllCategories(db);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catégories</h1>
      <CategoryList initialCategories={categories} />
    </div>
  );
}
```

- [ ] **Step 2: Create the category form dialog**

Create `components/admin/category-form-dialog.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";
import type { Category } from "@/lib/db/schema";
import type { CategoryFormData } from "@/lib/actions/admin-categories";
import {
  createCategory,
  updateCategory,
} from "@/lib/actions/admin-categories";

const LUCIDE_ICONS = [
  "smartphone", "tablet", "laptop", "monitor", "watch", "headphones",
  "speaker", "mic", "camera", "gamepad-2", "printer", "projector",
  "cable", "percent", "life-buoy", "shield", "hard-drive", "keyboard",
  "home", "glasses", "box",
] as const;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Category;
  topLevelCategories: Category[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  topLevelCategories,
}: CategoryFormDialogProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "box");
  const [image, setImage] = useState<string[]>(initial?.image ? [initial.image] : []);
  const [parentId, setParentId] = useState(initial?.parent_id ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (!initial) setSlug(slugify(e.target.value));
    },
    [initial]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);

    const data: CategoryFormData = {
      name,
      slug,
      icon,
      image: image[0] || null,
      parent_id: parentId || null,
      order: Number(order),
    };

    const result = initial
      ? await updateCategory(initial.id, data)
      : await createCategory(data);

    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    } else {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError ? (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <div>
            <Label htmlFor="cat-name">Nom</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
            />
          </div>

          <div>
            <Label htmlFor="cat-icon">Icône Lucide</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger id="cat-icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LUCIDE_ICONS.map((ic) => (
                  <SelectItem key={ic} value={ic}>
                    {ic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Image (optionnel)</Label>
            <ImageUploader images={image} onChange={setImage} />
          </div>

          <div>
            <Label htmlFor="cat-parent">Parent</Label>
            <Select
              value={parentId}
              onValueChange={setParentId}
            >
              <SelectTrigger id="cat-parent">
                <SelectValue placeholder="Aucun (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun (top-level)</SelectItem>
                {topLevelCategories
                  .filter((c) => c.id !== initial?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cat-order">Ordre</Label>
            <Input
              id="cat-order"
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Enregistrement..."
                : initial
                  ? "Enregistrer"
                  : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create the category list component**

Create `components/admin/category-list.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryFormDialog } from "./category-form-dialog";
import { deleteCategory } from "@/lib/actions/admin-categories";
import type { Category } from "@/lib/db/schema";

interface CategoryListProps {
  initialCategories: Category[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const topLevel = initialCategories.filter((c) => c.parent_id === null);

  function getChildren(parentId: string) {
    return initialCategories.filter((c) => c.parent_id === parentId);
  }

  function getProductCount(_categoryId: string) {
    // Product counts would require a join query — omitted for simplicity.
    // The server action handles the real check on delete.
    return null;
  }

  function handleEdit(cat: Category) {
    setEditing(cat);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    const result = await deleteCategory(deleteTarget.id);
    if (result.error) {
      setDeleteError(result.error);
    } else {
      setDeleteTarget(null);
      router.refresh();
    }
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={handleNew}>
          <Plus className="mr-2 size-4" />
          Nouvelle catégorie
        </Button>
      </div>

      <div className="rounded-lg border bg-background">
        {topLevel.map((cat) => {
          const children = getChildren(cat.id);
          return (
            <div key={cat.id}>
              {/* Parent row */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.slug}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(cat)}
                    aria-label={`Éditer ${cat.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(cat)}
                    aria-label={`Supprimer ${cat.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Children rows */}
              {children.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between border-b px-4 py-2.5 pl-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-px bg-border" />
                    <span className="text-sm">{sub.name}</span>
                    <span className="text-xs text-muted-foreground">{sub.slug}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(sub)}
                      aria-label={`Éditer ${sub.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(sub)}
                      aria-label={`Supprimer ${sub.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {topLevel.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucune catégorie.
          </div>
        ) : null}
      </div>

      {/* Form dialog */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        topLevelCategories={topLevel}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleteTarget?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La catégorie sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {deleteError}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 4: Verify the admin page renders**

Run: `bun run test`
Expected: No import errors. All existing tests still pass (some nav tests may now fail due to changed category imports — those are fixed in Task 8).

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/categories/page.tsx" components/admin/category-list.tsx components/admin/category-form-dialog.tsx
git commit -m "feat(phase2): add admin categories page with CRUD"
```

---

### Task 7: Update storefront pages — category page + product detail

**Files:**
- Modify: `app/(main)/[slug]/page.tsx`
- Modify: `app/(main)/produits/[slug]/page.tsx`

- [ ] **Step 1: Update the category page**

Replace `app/(main)/[slug]/page.tsx` with:

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCategoryBySlug, getSubcategories } from "@/lib/data/categories";
import { getCategoryById } from "@/lib/data/categories";
import { getProductsByCategory } from "@/lib/data/products";
import type { ProductFilters as Filters } from "@/lib/data/products";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marque?: string; prix_max?: string; tri?: string }>;
};

const VALID_TRI = ["prix_asc", "prix_desc", "nouveau"] as const;

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, filters] = await Promise.all([params, searchParams]);

  const db = await getDb();
  const category = await getCategoryBySlug(db, slug);
  if (!category) notFound();

  const parent = category.parent_id
    ? await getCategoryById(db, category.parent_id)
    : null;

  const prixMax = filters.prix_max ? parseInt(filters.prix_max, 10) : undefined;
  const tri = (VALID_TRI as readonly string[]).includes(filters.tri ?? "")
    ? (filters.tri as Filters["tri"])
    : undefined;

  const items = await getProductsByCategory(db, category.id, {
    brand: filters.marque,
    prix_max: prixMax !== undefined && Number.isFinite(prixMax) ? prixMax : undefined,
    tri,
  });

  const brands = [...new Set(items.map((p) => p.brand))].sort();
  const subcategories = await getSubcategories(db, category.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        {parent ? (
          <>
            <Link href={`/${parent.slug}`} className="hover:text-foreground">{parent.name}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} produit{items.length !== 1 ? "s" : ""}
      </p>

      {/* Subcategory pills */}
      {subcategories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {subcategories.map((sub) => (
            <Link
              key={sub.slug}
              href={`/${sub.slug}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <ProductFilters
          brands={brands}
          current={{ brand: filters.marque, prix_max: filters.prix_max, tri: filters.tri }}
        />

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
    </div>
  );
}
```

- [ ] **Step 2: Update the product detail page**

In `app/(main)/produits/[slug]/page.tsx`, replace the categories import and usage.

Replace the import line:
```typescript
// OLD: import { categories } from "@/lib/data/categories";
// NEW:
import { getCategoryById } from "@/lib/data/categories";
```

Replace the category lookup in `ProductDetailPage` (lines 49-52):
```typescript
  // OLD:
  // const category = categories.find((c) => c.id === product.category_id);
  // const subcategory = product.subcategory_id
  //   ? categories.find((c) => c.id === product.subcategory_id)
  //   : null;
  // NEW:
  const db2 = await getDb();
  const [category, subcategory] = await Promise.all([
    getCategoryById(db2, product.category_id),
    product.subcategory_id
      ? getCategoryById(db2, product.subcategory_id)
      : Promise.resolve(null),
  ]);
```

Note: `db2` avoids shadowing — `getProductCached` calls `getDb()` internally. Alternatively, call `getDb()` once and use it for both, but `getProductCached` already encapsulates its own `getDb()` call.

- [ ] **Step 3: Commit**

```bash
git add "app/(main)/[slug]/page.tsx" "app/(main)/produits/[slug]/page.tsx"
git commit -m "feat(phase2): update storefront pages to use D1 categories"
```

---

### Task 8: Update navigation — pass categories as props

**Files:**
- Modify: `app/(main)/layout.tsx`
- Modify: `components/layout/app-bar/app-bar.tsx`
- Modify: `components/layout/app-bar/desktop-nav.tsx`
- Modify: `components/layout/app-bar/mobile-menu.tsx`
- Modify: `tests/components/layout/app-bar/desktop-nav.test.tsx`

- [ ] **Step 1: Update the main layout to load categories**

Replace `app/(main)/layout.tsx` with:

```typescript
import { AppBar } from "@/components/layout/app-bar";
import { getDb } from "@/lib/db";
import { getAllCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await getDb();
  const allCategories = await getAllCategories(db);

  return (
    <>
      <AppBar categories={allCategories} />
      <main>{children}</main>
    </>
  );
}
```

- [ ] **Step 2: Update AppBar to accept and forward categories**

In `components/layout/app-bar/app-bar.tsx`, add the prop and forward it.

Add the import:
```typescript
import type { Category } from "@/lib/db/schema";
```

Change the component signature and pass categories down:
```typescript
interface AppBarProps {
  categories: Category[];
}

export function AppBar({ categories }: AppBarProps) {
```

Pass categories to `DesktopNav`:
```typescript
<DesktopNav categories={categories} />
```

Pass categories to `MobileMenuTrigger` (which renders `MobileMenu`). Since `MobileMenuTrigger` needs to pass them through, update its usage:
```typescript
<MobileMenuTrigger categories={categories} />
```

- [ ] **Step 3: Update DesktopNav to accept categories as props**

In `components/layout/app-bar/desktop-nav.tsx`:

Remove the imports from `@/lib/data/categories`:
```typescript
// OLD:
// import { getTopLevelCategories, getSubcategories, type Category } from "@/lib/data/categories";
// NEW:
import type { Category } from "@/lib/db/schema";
```

Change the component signature:
```typescript
interface DesktopNavProps {
  categories: Category[];
}

export function DesktopNav({ categories }: DesktopNavProps) {
  const topLevel = categories.filter((c) => c.parent_id === null);
```

Replace `getSubcategories(category.id)` calls inside the component with:
```typescript
const subcategories = categories.filter((c) => c.parent_id === category.id);
```

Apply this change in `NavItem` too — add `allCategories` to its props:
```typescript
function NavItem({
  category,
  allCategories,
  openTray,
  onMouseEnter,
  onMouseLeave,
  onKeyToggle,
  onClose,
}: {
  category: Category;
  allCategories: Category[];
  openTray: string | null;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onKeyToggle: (id: string) => void;
  onClose: () => void;
}) {
  const subcategories = allCategories.filter((c) => c.parent_id === category.id);
```

Pass `allCategories={categories}` when rendering `<NavItem>`.

In the overflow section, replace `getSubcategories(category.id)` with:
```typescript
const subcategories = categories.filter((c) => c.parent_id === category.id);
```

- [ ] **Step 4: Update MobileMenuTrigger to pass categories through**

Check if `MobileMenuTrigger` is a separate component. Read it and update to accept + forward `categories` to `MobileMenu`.

In `components/layout/app-bar/mobile-menu.tsx`:

Remove the imports from `@/lib/data/categories`:
```typescript
// OLD:
// import { getTopLevelCategories, getSubcategories, type Category } from "@/lib/data/categories";
// NEW:
import type { Category } from "@/lib/db/schema";
```

Change the component signature:
```typescript
type MobileMenuProps = {
  categories: Category[];
  onClose: () => void;
};

export function MobileMenu({ categories, onClose }: MobileMenuProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const topLevel = categories.filter((c) => c.parent_id === null);
```

Replace `getSubcategories(category.id)` calls with:
```typescript
categories.filter((c) => c.parent_id === category.id)
```

- [ ] **Step 5: Update DesktopNav test**

In `tests/components/layout/app-bar/desktop-nav.test.tsx`, update to pass categories as props:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopNav } from "@/components/layout/app-bar/desktop-nav";
import type { Category } from "@/lib/db/schema";

const now = new Date();

function cat(overrides: Partial<Category> & { id: string; name: string }): Category {
  return {
    slug: overrides.id,
    icon: "box",
    image: null,
    parent_id: null,
    order: 0,
    created_at: now,
    ...overrides,
  };
}

const testCategories: Category[] = [
  cat({ id: "smartphones", name: "Smartphones", icon: "smartphone", order: 0 }),
  cat({ id: "tablettes", name: "Tablettes", icon: "tablet", order: 1 }),
  cat({ id: "ordinateurs", name: "Ordinateurs", icon: "laptop", order: 2 }),
  cat({ id: "montres", name: "Montres connectées", slug: "montres-connectees", icon: "watch", order: 3 }),
  cat({ id: "audio", name: "Audio", icon: "headphones", order: 4 }),
  cat({ id: "cameras-drones", name: "Caméras & Drones", icon: "camera", order: 5 }),
  cat({ id: "gaming", name: "Gaming", icon: "gamepad-2", order: 6 }),
  cat({ id: "imprimantes", name: "Imprimantes", icon: "printer", order: 7 }),
  cat({ id: "accessoires", name: "Accessoires", icon: "cable", order: 8 }),
  cat({ id: "offres", name: "Offres", icon: "percent", order: 9 }),
  cat({ id: "support", name: "Support", icon: "life-buoy", order: 10 }),
  // Subcategories
  cat({ id: "iphone", name: "iPhone", parent_id: "smartphones", order: 0 }),
  cat({ id: "samsung-galaxy", name: "Samsung Galaxy", parent_id: "smartphones", order: 1 }),
];

describe("DesktopNav", () => {
  it("renders 6 visible category links", () => {
    render(<DesktopNav categories={testCategories} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Montres connectées")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Caméras & Drones")).toBeInTheDocument();
  });

  it("categories with subcategories have chevron buttons", () => {
    render(<DesktopNav categories={testCategories} />);
    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toBeInTheDocument();
  });

  it("shows overflow categories in Plus menu", async () => {
    const user = userEvent.setup();
    render(<DesktopNav categories={testCategories} />);

    await user.hover(screen.getByRole("button", { name: /plus de catégories/i }));

    expect(screen.getByRole("link", { name: /offres/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accessoires/i })).toBeInTheDocument();
  });

  it("opens category tray on hover", async () => {
    const user = userEvent.setup();
    render(<DesktopNav categories={testCategories} />);

    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "false");

    await user.hover(smartphonesButton);
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("iPhone")).toBeInTheDocument();
  });

  it("toggles category tray with keyboard", async () => {
    const user = userEvent.setup();
    render(<DesktopNav categories={testCategories} />);

    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    smartphonesButton.focus();

    await user.keyboard("{Enter}");
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("iPhone")).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "false");
  });
});
```

- [ ] **Step 6: Run all tests**

Run: `bun run test`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add "app/(main)/layout.tsx" components/layout/app-bar/app-bar.tsx components/layout/app-bar/desktop-nav.tsx components/layout/app-bar/mobile-menu.tsx tests/components/layout/app-bar/desktop-nav.test.tsx
git commit -m "feat(phase2): pass categories as props through navigation"
```

Note: Also check and update `components/layout/app-bar/mobile-menu-trigger.tsx` if it needs to forward the `categories` prop to `MobileMenu`. Read it first to see the current structure.

---

### Task 9: Update admin product pages — pass categories as props

**Files:**
- Modify: `components/admin/product-form.tsx`
- Modify: `app/(admin)/admin/produits/page.tsx`
- Modify: `app/(admin)/admin/produits/nouveau/page.tsx`
- Modify: `app/(admin)/admin/produits/[id]/page.tsx`

- [ ] **Step 1: Update ProductForm to receive categories as props**

In `components/admin/product-form.tsx`:

Replace the import:
```typescript
// OLD:
// import { categories } from "@/lib/data/categories";
// NEW:
import type { Category } from "@/lib/db/schema";
```

Remove the module-level computations:
```typescript
// DELETE these two lines:
// const topCategories = categories.filter((c) => c.parent_id === null);
// const subCategories = categories.filter((c) => c.parent_id !== null);
```

Add `categories` to the props interface:
```typescript
interface ProductFormProps {
  initial?: Product;
  action: (data: ProductFormData) => Promise<{ error?: string }>;
  submitLabel: string;
  categories: Category[];
}
```

Update the component to use props:
```typescript
export function ProductForm({ initial, action, submitLabel, categories }: ProductFormProps) {
```

Compute `topCategories` and `subCategories` inside the component:
```typescript
  const topCategories = categories.filter((c) => c.parent_id === null);
```

Update `filteredSubs` to filter from `categories`:
```typescript
  const filteredSubs = categories.filter((s) => s.parent_id === categoryId);
```

- [ ] **Step 2: Update admin products list page**

In `app/(admin)/admin/produits/page.tsx`:

Replace the import:
```typescript
// OLD:
// import { categories } from "@/lib/data/categories";
// NEW:
import { getAllCategories } from "@/lib/data/categories";
```

Move `categoryMap` into the component body (it now needs `await`):
```typescript
// DELETE: const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

// Inside the component, after getting db:
  const allCategories = await getAllCategories(db);
  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));
```

- [ ] **Step 3: Update nouveau (create) page**

Replace `app/(admin)/admin/produits/nouveau/page.tsx` with:

```typescript
import { getDb } from "@/lib/db";
import { getAllCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/actions/admin-products";

export const dynamic = "force-dynamic";

export default async function NouveauProduitPage() {
  const db = await getDb();
  const categories = await getAllCategories(db);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Nouveau produit</h1>
      <ProductForm
        action={createProduct}
        submitLabel="Créer le produit"
        categories={categories}
      />
    </div>
  );
}
```

- [ ] **Step 4: Update edit page**

In `app/(admin)/admin/produits/[id]/page.tsx`, add categories loading:

```typescript
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getAdminProductById } from "@/lib/data/admin-products";
import { getAllCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/lib/actions/admin-products";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProduitPage({ params }: Props) {
  const { id } = await params;
  const db = await getDb();
  const [product, categories] = await Promise.all([
    getAdminProductById(db, id),
    getAllCategories(db),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Éditer : {product.name}</h1>
      <ProductForm
        initial={product}
        action={action}
        submitLabel="Enregistrer"
        categories={categories}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run all tests**

Run: `bun run test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/admin/product-form.tsx "app/(admin)/admin/produits/page.tsx" "app/(admin)/admin/produits/nouveau/page.tsx" "app/(admin)/admin/produits/[id]/page.tsx"
git commit -m "feat(phase2): pass D1 categories to product form and admin pages"
```

---

### Task 10: Update remaining tests + final verification

**Files:**
- Modify: `tests/components/layout/app-bar/mobile-menu.test.tsx`

- [ ] **Step 1: Update mobile menu test**

In `tests/components/layout/app-bar/mobile-menu.test.tsx`, update to pass categories as props (same pattern as desktop-nav test — provide test categories array and pass via `categories` prop).

Read the current test first, then update imports from `@/lib/data/categories` to use the `Category` type from schema, and pass test categories to the component.

- [ ] **Step 2: Run all tests**

Run: `bun run test`
Expected: All tests PASS.

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: No new errors.

- [ ] **Step 4: Run build**

Run: `bun run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "feat(phase2): update remaining tests for categories migration"
```

---

### Task 11: Apply migration to production + seed

This task is manual and should be done after the PR is merged.

- [ ] **Step 1: Apply D1 migration remotely**

Run: `bun run db:migrate:remote`
Expected: Migration applied to production D1.

- [ ] **Step 2: Seed categories in production**

Run the seed via wrangler:
```bash
wrangler d1 execute dbs-store-db --remote --file=scripts/seed-categories-sql.sql
```

Or generate an SQL file from the seed data and execute it. Alternatively, temporarily modify the seed script to use the D1 HTTP API.

Note: The exact production seed approach may need adaptation based on the Cloudflare D1 tooling available.

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Schema + migration | `lib/db/schema.ts`, `drizzle/0003_*.sql` |
| 2 | Async D1 query functions | `lib/data/categories.ts`, tests |
| 3 | Seed script | `scripts/seed-categories.ts` |
| 4 | Admin server actions | `lib/actions/admin-categories.ts`, tests |
| 5 | Admin sidebar link | `components/admin/sidebar.tsx` |
| 6 | Admin CRUD page + components | Page + 2 client components |
| 7 | Storefront pages | Category page, product detail |
| 8 | Navigation props | Layout, AppBar, DesktopNav, MobileMenu |
| 9 | Admin product pages | ProductForm, list, create, edit pages |
| 10 | Tests + verification | Remaining test updates, lint, build |
| 11 | Production deploy | Migration + seed (post-merge) |
