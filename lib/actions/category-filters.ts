// lib/actions/category-filters.ts
"use server";

import { getDb } from "@/lib/db";
import { countProductsByCategory } from "@/lib/data/products";

export type CountInput = {
  categoryId: string;
  brands?: string[];
  prixMin?: number;
  prixMax?: number;
};

export async function countCategoryProducts(input: CountInput): Promise<number | null> {
  if (!input || typeof input !== "object") return null;
  if (typeof input.categoryId !== "string" || input.categoryId.length === 0) return null;

  const brands = Array.isArray(input.brands)
    ? input.brands.filter((b): b is string => typeof b === "string" && b.length > 0)
    : [];

  const toPrice = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined;

  try {
    const db = await getDb();
    return await countProductsByCategory(db, input.categoryId, {
      brands: brands.length > 0 ? brands : undefined,
      prix_min: toPrice(input.prixMin),
      prix_max: toPrice(input.prixMax),
    });
  } catch (error) {
    console.error("[countCategoryProducts] Failed", { categoryId: input.categoryId, error });
    return null;
  }
}
