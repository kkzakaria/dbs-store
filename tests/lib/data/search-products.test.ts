// tests/lib/data/search-products.test.ts
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { searchProducts, suggestProducts, getSearchBrands } from "@/lib/data/products";

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

describe("searchProducts — escapeLike", () => {
  it("treats % in query as literal, not wildcard", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await searchProducts(db, "%");
    expect(result.products).toHaveLength(0);
  });

  it("treats _ in query as literal, not wildcard", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await searchProducts(db, "_");
    expect(result.products).toHaveLength(0);
  });

  it("treats backslash in query as literal", async () => {
    const db = createTestDb();
    const item = {
      ...BASE, id: "slash", slug: "slash", name: "Test\\Product",
      subcategory_id: null,
    };
    await db.insert(schema.products).values(item);
    const result = await searchProducts(db, "\\");
    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe("Test\\Product");
  });
});

describe("searchProducts — prix_min filter", () => {
  it("filters by prix_min", async () => {
    const db = createTestDb();
    const cheap = {
      ...BASE, id: "se", slug: "se", name: "iPhone SE",
      price: 350000, subcategory_id: null, description: "iPhone abordable.",
    };
    await db.insert(schema.products).values([BASE, cheap]);
    const result = await searchProducts(db, "iPhone", { prix_min: 500000 });
    expect(result.products).toHaveLength(1);
    expect(result.products[0].price).toBe(899000);
  });
});

describe("getSearchBrands", () => {
  it("returns distinct brands for matching products", async () => {
    const db = createTestDb();
    const samsung = {
      ...BASE, id: "s25", slug: "s25", name: "Galaxy S25",
      brand: "Samsung", subcategory_id: null, description: "Smartphone Samsung.",
    };
    await db.insert(schema.products).values([BASE, samsung]);
    const brands = await getSearchBrands(db, "Galaxy");
    expect(brands).toEqual(["Samsung"]);
  });

  it("returns brands from all matching products, not just first page", async () => {
    const db = createTestDb();
    const items = [
      { ...BASE, id: "a1", slug: "a1", name: "Phone Alpha", brand: "Alpha", subcategory_id: null },
      { ...BASE, id: "b1", slug: "b1", name: "Phone Beta", brand: "Beta", subcategory_id: null },
      { ...BASE, id: "g1", slug: "g1", name: "Phone Gamma", brand: "Gamma", subcategory_id: null },
    ];
    await db.insert(schema.products).values(items);
    const brands = await getSearchBrands(db, "Phone");
    expect(brands).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("excludes inactive products", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values({ ...BASE, is_active: false });
    const brands = await getSearchBrands(db, "iPhone");
    expect(brands).toEqual([]);
  });

  it("respects category_id filter", async () => {
    const db = createTestDb();
    const tablet = {
      ...BASE, id: "ipad", slug: "ipad", name: "iPad Pro",
      category_id: "tablettes", subcategory_id: null,
      description: "Tablette Apple.", brand: "Apple",
    };
    await db.insert(schema.products).values([BASE, tablet]);
    const brands = await getSearchBrands(db, "Apple", { category_id: "tablettes" });
    expect(brands).toEqual(["Apple"]);
  });

  it("returns empty array when no products match", async () => {
    const db = createTestDb();
    const brands = await getSearchBrands(db, "nonexistent");
    expect(brands).toEqual([]);
  });
});
