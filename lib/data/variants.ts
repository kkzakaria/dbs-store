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

const BATCH_SIZE = 100;

export async function getVariantsByProductIds(
  db: Db,
  productIds: string[]
): Promise<ProductVariant[]> {
  if (productIds.length === 0) return [];
  if (productIds.length <= BATCH_SIZE) {
    return db
      .select()
      .from(product_variants)
      .where(inArray(product_variants.product_id, productIds))
      .orderBy(asc(product_variants.sort_order));
  }
  // Chunk to respect D1's 100 bound-parameter limit
  const chunks: string[][] = [];
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    chunks.push(productIds.slice(i, i + BATCH_SIZE));
  }
  const results = await Promise.all(
    chunks.map((chunk) =>
      db
        .select()
        .from(product_variants)
        .where(inArray(product_variants.product_id, chunk))
        .orderBy(asc(product_variants.sort_order))
    )
  );
  return results.flat();
}
