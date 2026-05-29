// lib/data/products.ts
import { cache } from "react";
import { eq, or, and, ne, lte, gte, gt, asc, desc, isNotNull, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { products } from "@/lib/db/schema";
import type { Product, ProductBadge, ProductColor, ProductVariant } from "@/lib/db/schema";
import { getDb, type Db } from "@/lib/db";
import { getVariantsByProductIds } from "@/lib/data/variants";

export type ProductFilters = {
  brand?: string;
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};

type ProductRow = typeof products.$inferSelect;

function parseProduct(row: ProductRow): Product {
  const { images: _images, specs: _specs, badge: _badge, colors: _colors, ...rest } = row;
  let images: string[] = [];
  let specs: Record<string, string> = {};
  let colors: ProductColor[] = [];

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

  try {
    const parsed = JSON.parse(_colors);
    if (Array.isArray(parsed)) {
      colors = parsed.filter(
        (c): c is ProductColor =>
          c != null && typeof c.name === "string" && typeof c.hex === "string"
      );
    } else {
      console.error(`[products] colors non-tableau pour "${row.slug}"`);
    }
  } catch {
    console.error(`[products] JSON invalide dans colors pour "${row.slug}"`);
  }

  return { ...rest, images, specs, colors, badge: _badge as ProductBadge | null, variants: [] };
}

async function attachVariants(db: Db, productList: Product[]): Promise<Product[]> {
  if (productList.length === 0) return productList;
  const ids = productList.map((p) => p.id);
  const allVariants = await getVariantsByProductIds(db, ids);
  const byProductId = new Map<string, ProductVariant[]>();
  for (const v of allVariants) {
    const arr = byProductId.get(v.product_id) ?? [];
    arr.push(v);
    byProductId.set(v.product_id, arr);
  }
  return productList.map((p) => ({ ...p, variants: byProductId.get(p.id) ?? [] }));
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
  return attachVariants(db, rows.map(parseProduct));
}

export async function getProduct(db: Db, slug: string): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_active, true)))
    .limit(1);
  if (!result[0]) return null;
  const [withVariants] = await attachVariants(db, [parseProduct(result[0])]);
  return withVariants ?? null;
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
  return attachVariants(db, rows.map(parseProduct));
}

export async function getPromoProducts(db: Db, limit = 4): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(and(isNotNull(products.old_price), eq(products.is_active, true)))
    .orderBy(desc(products.created_at))
    .limit(limit);
  return attachVariants(db, rows.map(parseProduct));
}

export type PromoFilters = {
  category_id?: string;
  tri?: "remise_desc" | "prix_asc" | "prix_desc" | "nouveau";
};

export async function getPromoProductsFiltered(
  db: Db,
  filters: PromoFilters = {}
): Promise<Product[]> {
  const conditions = [
    gt(products.old_price, 0),
    eq(products.is_active, true),
  ];

  if (filters.category_id) {
    conditions.push(
      or(
        eq(products.category_id, filters.category_id),
        eq(products.subcategory_id, filters.category_id)
      )!
    );
  }

  const orderBy =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : filters.tri === "nouveau"
          ? desc(products.created_at)
          : sql`(${products.old_price} - ${products.price}) * 1.0 / ${products.old_price} DESC`;

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(orderBy);

  return attachVariants(db, rows.map(parseProduct));
}

// React.cache() — déduplication par requête (scope: arbre React d'un seul rendu).
// Évite une double requête DB quand generateMetadata et le composant page
// appellent getProduct pour le même slug dans la même requête.
// Pour un cache cross-requêtes persistant, utiliser unstable_cache de next/cache.
export const getProductCached = cache(async (slug: string): Promise<Product | null> => {
  return getProduct(await getDb(), slug);
});

export type SearchFilters = {
  category_id?: string;
  brand?: string;
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};

function escapeLike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function searchProducts(
  db: Db,
  query: string,
  filters: SearchFilters = {},
  offset = 0,
  limit = 12
): Promise<{ products: Product[]; hasMore: boolean; total: number }> {
  const pattern = `%${escapeLike(query)}%`;

  const conditions: SQL[] = [
    or(
      sql`${products.name} LIKE ${pattern} ESCAPE '\\'`,
      sql`${products.description} LIKE ${pattern} ESCAPE '\\'`,
      sql`${products.brand} LIKE ${pattern} ESCAPE '\\'`
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
          : sql`CASE WHEN ${products.name} LIKE ${pattern} ESCAPE '\\' THEN 0 ELSE 1 END, ${products.created_at} DESC`;

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

  const parsedProducts = await attachVariants(db, sliced.map(parseProduct));
  return {
    products: parsedProducts,
    hasMore,
    total: Number(countResult[0]?.count ?? 0),
  };
}

export async function getSearchBrands(
  db: Db,
  query: string,
  filters: Omit<SearchFilters, "brand"> = {}
): Promise<string[]> {
  const pattern = `%${escapeLike(query)}%`;

  const conditions: SQL[] = [
    or(
      sql`${products.name} LIKE ${pattern} ESCAPE '\\'`,
      sql`${products.description} LIKE ${pattern} ESCAPE '\\'`,
      sql`${products.brand} LIKE ${pattern} ESCAPE '\\'`
    )!,
    eq(products.is_active, true),
  ];

  if (filters.category_id) conditions.push(eq(products.category_id, filters.category_id));
  if (filters.prix_min !== undefined) conditions.push(gte(products.price, filters.prix_min));
  if (filters.prix_max !== undefined) conditions.push(lte(products.price, filters.prix_max));

  const rows = await db
    .selectDistinct({ brand: products.brand })
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.brand));

  return rows.map((r) => r.brand);
}

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
  const pattern = `%${escapeLike(query)}%`;

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
        or(
          sql`${products.name} LIKE ${pattern} ESCAPE '\\'`,
          sql`${products.brand} LIKE ${pattern} ESCAPE '\\'`
        ),
        eq(products.is_active, true)
      )
    )
    .limit(limit);

  return rows.map((row) => {
    let image = "/images/products/placeholder.svg";
    try {
      const parsed = JSON.parse(row.images);
      if (Array.isArray(parsed)) {
        const first = parsed.find((v): v is string => typeof v === "string" && v.length > 0);
        if (first) image = first;
      }
    } catch {
      console.error(`[suggestProducts] JSON invalide dans images pour "${row.slug}"`);
    }
    return { id: row.id, name: row.name, slug: row.slug, brand: row.brand, price: row.price, image };
  });
}
