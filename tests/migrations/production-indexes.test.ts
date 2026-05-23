// @vitest-environment node
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const migrationsDir = fileURLToPath(new URL("../../migrations", import.meta.url));

function applyAllMigrations(): Database.Database {
  const db = new Database(":memory:");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    db.exec(readFileSync(`${migrationsDir}/${file}`, "utf-8"));
  }
  return db;
}

const EXPECTED_INDEXES = [
  "idx_products_category_is_active",
  "idx_products_subcategory_is_active",
  "idx_products_created_at",
  "idx_products_brand",
  "idx_products_old_price",
  "idx_orders_user_id",
  "idx_orders_status",
  "idx_order_items_order_id",
  "idx_hero_slides_active_sort",
  "idx_categories_parent_id",
];

describe("production indexes migration", () => {
  it("creates all expected indexes after applying migrations", () => {
    const db = applyAllMigrations();
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as { name: string }[];
    const names = new Set(rows.map((r) => r.name));
    for (const idx of EXPECTED_INDEXES) {
      expect(names.has(idx), `missing index: ${idx}`).toBe(true);
    }
    db.close();
  });
});
