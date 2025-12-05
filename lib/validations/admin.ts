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

// ===========================================
// Order Filters Schema (Admin)
// ===========================================

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
}

export const adminOrderFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(["created_at", "total", "order_number"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export type AdminOrderFilters = z.infer<typeof adminOrderFiltersSchema>

export const updateOrderStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
})

export const updatePaymentStatusSchema = z.object({
  id: z.string().uuid(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
})

export const updateTrackingSchema = z.object({
  id: z.string().uuid(),
  trackingNumber: z.string().min(1, "Numéro de suivi requis").max(100),
})

// ===========================================
// Category Schema (Admin)
// ===========================================

export const adminCategoryFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  parentId: z.string().uuid().optional().nullable(),
})

export type AdminCategoryFilters = z.infer<typeof adminCategoryFiltersSchema>

export const adminCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"
    )
    .optional(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  image_url: z.string().url("URL invalide").optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  position: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
})

export type AdminCategoryInput = z.input<typeof adminCategorySchema>

// ===========================================
// Promotion Schema (Admin)
// ===========================================

export const PROMO_TYPES = ["percentage", "fixed_amount", "free_shipping"] as const

export const adminPromotionFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  type: z.enum(PROMO_TYPES).optional(),
})

export type AdminPromotionFilters = z.infer<typeof adminPromotionFiltersSchema>

export const adminPromotionSchema = z.object({
  code: z
    .string()
    .min(3, "Le code doit contenir au moins 3 caractères")
    .max(50, "Le code ne peut pas dépasser 50 caractères")
    .regex(/^[A-Z0-9]+$/, "Le code doit contenir uniquement des lettres majuscules et chiffres"),
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  type: z.enum(PROMO_TYPES),
  value: z.coerce.number().min(0, "La valeur doit être positive"),
  min_purchase: z.coerce.number().min(0).default(0),
  max_discount: z.coerce.number().min(0).optional().nullable(),
  max_uses: z.coerce.number().min(1).optional().nullable(),
  max_uses_per_user: z.coerce.number().min(1).default(1),
  starts_at: z.string().min(1, "Date de début requise"),
  ends_at: z.string().min(1, "Date de fin requise"),
  is_active: z.boolean().default(true),
})

export type AdminPromotionInput = z.input<typeof adminPromotionSchema>

// ===========================================
// Review Filters Schema (Admin)
// ===========================================

export const adminReviewFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isApproved: z.coerce.boolean().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  productId: z.string().uuid().optional(),
})

export type AdminReviewFilters = z.infer<typeof adminReviewFiltersSchema>

// ===========================================
// Customer Filters Schema (Admin)
// ===========================================

export const adminCustomerFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z.enum(["created_at", "full_name", "loyalty_points"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export type AdminCustomerFilters = z.infer<typeof adminCustomerFiltersSchema>

// ===========================================
// Inventory Filters Schema (Admin)
// ===========================================

export const adminInventoryFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
  categoryId: z.string().uuid().optional(),
})

export type AdminInventoryFilters = z.infer<typeof adminInventoryFiltersSchema>

export const updateStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().min(0, "La quantité doit être positive"),
})

// ===========================================
// Shipping Zone Schema (Admin)
// ===========================================

export const adminShippingZoneSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  cities: z.array(z.string()).min(1, "Au moins une ville requise"),
  fee: z.coerce.number().min(0, "Les frais doivent être positifs"),
  estimated_days: z
    .string()
    .max(50, "Le délai ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
})

export type AdminShippingZoneInput = z.input<typeof adminShippingZoneSchema>

// ===========================================
// Admin Users Schema (Settings)
// ===========================================

export const adminUsersFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
})

export type AdminUsersFilters = z.infer<typeof adminUsersFiltersSchema>

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "super_admin"]),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
