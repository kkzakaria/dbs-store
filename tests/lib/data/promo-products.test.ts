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
