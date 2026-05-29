import { eq, inArray, asc } from "drizzle-orm";
import { product_variants } from "@/lib/db/schema";
import type { ProductVariant } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export async function getVariantsByProductId(
  db: Db,
  productId: string
): Promise<ProductVariant[]> {
  return db
    .select()
    .from(product_variants)
    .where(eq(product_variants.product_id, productId))
    .orderBy(asc(product_variants.sort_order));
}

export async function getVariantsByProductIds(
  db: Db,
  productIds: string[]
): Promise<ProductVariant[]> {
  if (productIds.length === 0) return [];
  return db
    .select()
    .from(product_variants)
    .where(inArray(product_variants.product_id, productIds))
    .orderBy(asc(product_variants.sort_order));
}
