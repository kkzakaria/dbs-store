// lib/data/products.ts
import { cache } from "react";
import { eq, or, and, ne, lte, gte, asc, desc, isNotNull } from "drizzle-orm";
import { products } from "@/lib/db/schema";
import type { Product, ProductBadge } from "@/lib/db/schema";
import { getDb, type Db } from "@/lib/db";

export type ProductFilters = {
  brand?: string;
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};

type ProductRow = typeof products.$inferSelect;

function parseProduct(row: ProductRow): Product {
  const { images: _images, specs: _specs, badge: _badge, ...rest } = row;
  let images: string[] = [];
  let specs: Record<string, string> = {};

  try {
    const parsed = JSON.parse(_images);
    if (Array.isArray(parsed)) {
      images = parsed.filter((v): v is string => typeof v === "string");
    } else {
      console.error(`[products] images non-tableau pour "${row.slug}"`);
    }
  } catch {
    console.error(`[products] JSON invalide dans images pour "${row.slug}"`);
  }

  try {
    const parsed = JSON.parse(_specs);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      specs = parsed as Record<string, string>;
    } else {
      console.error(`[products] specs non-objet pour "${row.slug}"`);
    }
  } catch {
    console.error(`[products] JSON invalide dans specs pour "${row.slug}"`);
  }

  return { ...rest, images, specs, badge: _badge as ProductBadge | null };
}

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
  if (filters.prix_min !== undefined) conditions.push(gte(products.price, filters.prix_min));
  if (filters.prix_max !== undefined) conditions.push(lte(products.price, filters.prix_max));

  const order =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : desc(products.created_at);

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(order);
  return rows.map(parseProduct);
}

export async function getProduct(db: Db, slug: string): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_active, true)))
    .limit(1);
  return result[0] ? parseProduct(result[0]) : null;
}

export async function getRelatedProducts(
  db: Db,
  productId: string,
  subcategoryId: string
): Promise<Product[]> {
  const rows = await db
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
  return rows.map(parseProduct);
}

export async function getPromoProducts(db: Db, limit = 4): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(and(isNotNull(products.old_price), eq(products.is_active, true)))
    .orderBy(desc(products.created_at))
    .limit(limit);
  return rows.map(parseProduct);
}

// React.cache() — déduplication par requête (scope: arbre React d'un seul rendu).
// Évite une double requête DB quand generateMetadata et le composant page
// appellent getProduct pour le même slug dans la même requête.
// Pour un cache cross-requêtes persistant, utiliser unstable_cache de next/cache.
export const getProductCached = cache(async (slug: string): Promise<Product | null> => {
  return getProduct(getDb(), slug);
});
