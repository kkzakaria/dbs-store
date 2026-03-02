import { eq, like, and, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { products } from "@/lib/db/schema";
import type { Product } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export const PAGE_SIZE = 25;

export type AdminProductFilters = {
  search?: string;
  category_id?: string;
};

type ProductRow = typeof products.$inferSelect;

function parseAdminProduct(row: ProductRow): Product {
  return {
    ...row,
    images: (() => {
      try {
        const parsed = JSON.parse(row.images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    specs: (() => {
      try {
        return JSON.parse(row.specs) as Record<string, string>;
      } catch {
        return {};
      }
    })(),
    badge: row.badge as Product["badge"],
  };
}

export function buildProductFiltersForAdmin(filters: AdminProductFilters) {
  const conditions: SQL[] = [];
  if (filters.search) {
    conditions.push(like(products.name, `%${filters.search}%`));
  }
  if (filters.category_id) {
    conditions.push(eq(products.category_id, filters.category_id));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getAdminProducts(
  db: Db,
  filters: AdminProductFilters = {},
  page = 1
): Promise<{ products: Product[]; total: number }> {
  const where = buildProductFiltersForAdmin(filters);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.created_at))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ]);

  return {
    products: rows.map(parseAdminProduct),
    total: Number(countResult[0]?.count ?? 0),
  };
}

export async function getAdminProductById(db: Db, id: string): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ? parseAdminProduct(rows[0]) : null;
}
