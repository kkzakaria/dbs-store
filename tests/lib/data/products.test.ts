// tests/lib/data/products.test.ts
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import {
  getProductsByCategory,
  getProduct,
  getRelatedProducts,
  getPromoProducts,
} from "@/lib/data/products";

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
  return drizzle(sqlite, { schema });
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
  description: "Top smartphone.",
  specs: JSON.stringify({ RAM: "8 Go" }),
  stock: 5,
  badge: "Nouveau",
  is_active: true,
  created_at: new Date("2026-01-01"),
} as const;

describe("getProductsByCategory", () => {
  it("returns products matching category_id", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await getProductsByCategory(db, "smartphones");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("iPhone 16 Pro");
  });

  it("returns products matching subcategory_id", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await getProductsByCategory(db, "iphone");
    expect(result).toHaveLength(1);
  });

  it("returns empty array for unknown category", async () => {
    const db = createTestDb();
    const result = await getProductsByCategory(db, "unknown");
    expect(result).toHaveLength(0);
  });

  it("filters by brand", async () => {
    const db = createTestDb();
    const samsung = { ...BASE, id: "s25", slug: "s25", brand: "Samsung", subcategory_id: null };
    await db.insert(schema.products).values([BASE, samsung]);
    const result = await getProductsByCategory(db, "smartphones", { brand: "Apple" });
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe("Apple");
  });

  it("filters by prix_max", async () => {
    const db = createTestDb();
    const cheap = { ...BASE, id: "cheap", slug: "cheap", price: 50000, subcategory_id: null };
    await db.insert(schema.products).values([BASE, cheap]);
    const result = await getProductsByCategory(db, "smartphones", { prix_max: 100000 });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(50000);
  });
});

describe("getProduct", () => {
  it("returns product by slug", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await getProduct(db, "iphone-16-pro");
    expect(result?.name).toBe("iPhone 16 Pro");
  });

  it("returns null for unknown slug", async () => {
    const db = createTestDb();
    const result = await getProduct(db, "does-not-exist");
    expect(result).toBeNull();
  });
});

describe("getRelatedProducts", () => {
  it("returns products from same subcategory excluding current product", async () => {
    const db = createTestDb();
    const other = { ...BASE, id: "iphone-15", slug: "iphone-15", name: "iPhone 15" };
    await db.insert(schema.products).values([BASE, other]);
    const result = await getRelatedProducts(db, "iphone-16-pro", "iphone");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("iphone-15");
  });
});

describe("getPromoProducts", () => {
  it("returns only products with old_price set", async () => {
    const db = createTestDb();
    const promo = { ...BASE, id: "promo", slug: "promo", old_price: 999000 };
    await db.insert(schema.products).values([BASE, promo]);
    const result = await getPromoProducts(db);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("promo");
  });
});
