// lib/data/products.ts
import { eq, or, and, ne, lte, gte, asc, desc, isNotNull } from "drizzle-orm";
import { products, type Product } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export type ProductFilters = {
  brand?: string;
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};

export async function getProductsByCategory(
  db: Db,
  categoryId: string,
  filters: ProductFilters = {}
): Promise<Product[]> {
  const conditions = [
    or(eq(products.category_id, categoryId), eq(products.subcategory_id, categoryId)),
    eq(products.is_active, true),
  ];

  if (filters.brand) conditions.push(eq(products.brand, filters.brand));
  if (filters.prix_min) conditions.push(gte(products.price, filters.prix_min));
  if (filters.prix_max) conditions.push(lte(products.price, filters.prix_max));

  const order =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : desc(products.created_at);

  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(order);
}

export async function getProduct(db: Db, slug: string): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_active, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function getRelatedProducts(
  db: Db,
  productId: string,
  subcategoryId: string
): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.subcategory_id, subcategoryId),
        ne(products.id, productId),
        eq(products.is_active, true)
      )
    )
    .limit(4);
}

export async function getPromoProducts(db: Db, limit = 4): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(and(isNotNull(products.old_price), eq(products.is_active, true)))
    .orderBy(desc(products.created_at))
    .limit(limit);
}
