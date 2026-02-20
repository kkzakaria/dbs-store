// lib/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category_id: text("category_id").notNull(),
  subcategory_id: text("subcategory_id"),
  price: integer("price").notNull(),
  old_price: integer("old_price"),
  brand: text("brand").notNull(),
  images: text("images").notNull(),        // JSON string[]
  description: text("description").notNull(),
  specs: text("specs").notNull(),           // JSON Record<string, string>
  stock: integer("stock").default(0).notNull(),
  badge: text("badge"),                     // "Nouveau" | "Populaire" | "Promo" | null
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type ProductBadge = "Nouveau" | "Populaire" | "Promo";

// Ligne brute telle que retournée par Drizzle (images/specs en JSON string)
type ProductRow = typeof products.$inferSelect;

// Type utilisé dans les composants et les pages (images/specs parsés, badge union)
export type Product = Omit<ProductRow, "images" | "specs" | "badge"> & {
  images: string[];
  specs: Record<string, string>;
  badge: ProductBadge | null;
};

export type NewProduct = typeof products.$inferInsert;
