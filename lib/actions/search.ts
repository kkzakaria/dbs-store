"use server";

import { getDb } from "@/lib/db";
import { searchProducts, suggestProducts } from "@/lib/data/products";
import type { SearchFilters, ProductSuggestion } from "@/lib/data/products";
import type { Product } from "@/lib/db/schema";

export async function searchSuggestions(query: string): Promise<ProductSuggestion[]> {
  if (query.length < 3) return [];
  const db = await getDb();
  return suggestProducts(db, query);
}

export async function loadMoreSearchResults(
  query: string,
  filters: SearchFilters,
  offset: number
): Promise<{ products: Product[]; hasMore: boolean }> {
  const db = await getDb();
  const result = await searchProducts(db, query, filters, offset, 12);
  return { products: result.products, hasMore: result.hasMore };
}
