import { z } from "zod"

// ===========================================
// Product Filters Schema (Admin)
// ===========================================

export const adminProductFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  sort: z
    .enum(["name", "price", "stock_quantity", "created_at"])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export type AdminProductFilters = z.infer<typeof adminProductFiltersSchema>

// ===========================================
// Product Schema (Admin Create/Edit)
// ===========================================

export const adminProductSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(255, "Le slug ne peut pas dépasser 255 caractères")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"
    )
    .optional(),
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .optional()
    .nullable(),
  brand: z
    .string()
    .max(100, "La marque ne peut pas dépasser 100 caractères")
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(50, "Le SKU ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  price: z.coerce
    .number()
    .min(0, "Le prix doit être positif"),
  compare_price: z.coerce
    .number()
    .min(0, "Le prix comparatif doit être positif")
    .optional()
    .nullable(),
  category_id: z.string().uuid().optional().nullable(),
  stock_quantity: z.coerce.number().min(0).default(0),
  stock_type: z.enum(["physical", "dropshipping"]).default("physical"),
  low_stock_threshold: z.coerce.number().min(0).default(5),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  meta_title: z
    .string()
    .max(60, "Le titre SEO ne peut pas dépasser 60 caractères")
    .optional()
    .nullable(),
  meta_description: z
    .string()
    .max(160, "La description SEO ne peut pas dépasser 160 caractères")
    .optional()
    .nullable(),
  specifications: z.record(z.string(), z.string()).optional().nullable(),
})

// Use z.input for form input type (before defaults applied)
export type AdminProductInput = z.input<typeof adminProductSchema>
// Use z.infer for output type (after validation with defaults)
export type AdminProductOutput = z.infer<typeof adminProductSchema>

// ===========================================
// Product Image Schema
// ===========================================

export const productImageSchema = z.object({
  product_id: z.string().uuid(),
  url: z.string().url("URL invalide"),
  alt: z.string().max(255).optional(),
  position: z.number().min(0).default(0),
  is_primary: z.boolean().default(false),
})

export type ProductImageInput = z.infer<typeof productImageSchema>

// ===========================================
// Dashboard Filters
// ===========================================

export const dashboardStatsSchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
})

export type DashboardStatsInput = z.infer<typeof dashboardStatsSchema>

// ===========================================
// Helper Functions
// ===========================================

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)+/g, "") // Remove leading/trailing hyphens
}

/**
 * Validate that user has admin role
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin"
}
