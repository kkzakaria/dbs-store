// lib/db/schema.ts
import { sqliteTable, text, integer, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

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

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "mobile_money" | "card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  status: text("status").$type<OrderStatus>().default("pending").notNull(),
  payment_method: text("payment_method").$type<PaymentMethod>().notNull(),
  payment_status: text("payment_status").$type<PaymentStatus>().default("pending").notNull(),
  // Adresse de livraison (dénormalisée)
  shipping_name: text("shipping_name").notNull(),
  shipping_phone: text("shipping_phone").notNull(),
  shipping_city: text("shipping_city").notNull(),
  shipping_address: text("shipping_address").notNull(),
  shipping_notes: text("shipping_notes"),
  // Totaux en FCFA
  subtotal: integer("subtotal").notNull(),
  shipping_fee: integer("shipping_fee").default(0).notNull(),
  total: integer("total").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const order_items = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  order_id: text("order_id").notNull().references(() => orders.id),
  product_id: text("product_id").notNull(),
  product_name: text("product_name").notNull(),
  product_slug: text("product_slug").notNull(),
  product_image: text("product_image").notNull(),
  unit_price: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  line_total: integer("line_total").notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof order_items.$inferSelect;
export type NewOrderItem = typeof order_items.$inferInsert;

// ── Hero Slides ───────────────────────────────────────────────────────────────

export type TextAlign = "left" | "center" | "right";

export const hero_slides = sqliteTable("hero_slides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  badge: text("badge"),
  image_url: text("image_url").notNull(),
  text_align: text("text_align").$type<TextAlign>().default("center").notNull(),
  overlay_color: text("overlay_color").default("#000000").notNull(),
  overlay_opacity: integer("overlay_opacity").default(40).notNull(),
  cta_primary_label: text("cta_primary_label"),
  cta_primary_href: text("cta_primary_href"),
  cta_secondary_label: text("cta_secondary_label"),
  cta_secondary_href: text("cta_secondary_href"),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type HeroSlide = typeof hero_slides.$inferSelect;
export type NewHeroSlide = typeof hero_slides.$inferInsert;

// ── Categories ───────────────────────────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  image: text("image"),
  parent_id: text("parent_id").references((): AnySQLiteColumn => categories.id),
  order: integer("order").default(0).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Category = typeof categories.$inferSelect;
