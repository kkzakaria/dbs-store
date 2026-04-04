"use server";

import { getDb } from "@/lib/db";
import { searchProducts, suggestProducts } from "@/lib/data/products";
import type { SearchFilters, ProductSuggestion } from "@/lib/data/products";
import type { Product } from "@/lib/db/schema";

const VALID_TRI = ["prix_asc", "prix_desc", "nouveau"] as const;

function parseSearchFilters(raw: unknown): SearchFilters {
  if (!raw || typeof raw !== "object") return {};
  const f = raw as Record<string, unknown>;
  return {
    category_id: typeof f.category_id === "string" ? f.category_id : undefined,
    brand: typeof f.brand === "string" ? f.brand : undefined,
    prix_min:
      typeof f.prix_min === "number" && Number.isFinite(f.prix_min) && f.prix_min >= 0
        ? f.prix_min
        : undefined,
    prix_max:
      typeof f.prix_max === "number" && Number.isFinite(f.prix_max) && f.prix_max >= 0
        ? f.prix_max
        : undefined,
    tri: (VALID_TRI as readonly string[]).includes(f.tri as string)
      ? (f.tri as SearchFilters["tri"])
      : undefined,
  };
}

export async function searchSuggestions(query: string): Promise<ProductSuggestion[]> {
  if (typeof query !== "string" || query.length < 3 || query.length > 200) return [];
  try {
    const db = await getDb();
    return await suggestProducts(db, query);
  } catch (error) {
    console.error("[searchSuggestions] Failed", { query, error });
    return [];
  }
}

export async function loadMoreSearchResults(
  query: string,
  filters: SearchFilters,
  offset: number
): Promise<{ products: Product[]; hasMore: boolean }> {
  if (typeof query !== "string" || !query || query.length > 200) {
    return { products: [], hasMore: false };
  }
  if (typeof offset !== "number" || offset < 0 || !Number.isInteger(offset)) {
    return { products: [], hasMore: false };
  }
  const safeFilters = parseSearchFilters(filters);
  try {
    const db = await getDb();
    const result = await searchProducts(db, query, safeFilters, offset, 12);
    return { products: result.products, hasMore: result.hasMore };
  } catch (error) {
    console.error("[loadMoreSearchResults] Failed", { query, offset, error });
    return { products: [], hasMore: false };
  }
}
