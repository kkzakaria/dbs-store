import { z } from "zod"

// ===========================================
// Product Filter Schemas
// ===========================================

export const sortOptions = [
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
  "popular",
] as const

export type SortOption = (typeof sortOptions)[number]

export const productFiltersSchema = z.object({
  categorySlug: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(sortOptions).default("newest"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export type ProductFilters = z.infer<typeof productFiltersSchema>

// ===========================================
// Search Schema
// ===========================================

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).default(5),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>

// ===========================================
// Product Slug Schema
// ===========================================

export const productSlugSchema = z.object({
  slug: z.string().min(1).max(255),
})

export type ProductSlug = z.infer<typeof productSlugSchema>

// ===========================================
// Related Products Schema
// ===========================================

export const relatedProductsSchema = z.object({
  productId: z.string().uuid(),
  categoryId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(10).default(4),
})

export type RelatedProducts = z.infer<typeof relatedProductsSchema>

// ===========================================
// Category Slug Schema
// ===========================================

export const categorySlugSchema = z.object({
  slug: z.string().min(1).max(255),
})

export type CategorySlug = z.infer<typeof categorySlugSchema>

// ===========================================
// Sort Labels (for UI)
// ===========================================

export const sortLabels: Record<SortOption, string> = {
  newest: "Plus récents",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
  name_asc: "Nom A-Z",
  name_desc: "Nom Z-A",
  popular: "Populaires",
}
