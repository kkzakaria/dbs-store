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
// Color Value Schema (for color variant options)
// ===========================================

export const colorValueSchema = z.object({
  name: z.string().min(1, "Le nom de la couleur est requis"),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format hex invalide (ex: #FF0000)"),
})

export type ColorValue = z.infer<typeof colorValueSchema>

// Predefined colors palette for electronics products
export const PREDEFINED_COLORS: ColorValue[] = [
  // Basic colors
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Gris", hex: "#808080" },
  { name: "Argent", hex: "#C0C0C0" },
  // Gold tones
  { name: "Or", hex: "#FFD700" },
  { name: "Or Rose", hex: "#E8B4B8" },
  // Apple Titanium colors
  { name: "Titane Naturel", hex: "#B4B4B4" },
  { name: "Titane Bleu", hex: "#5A7B9A" },
  { name: "Titane Blanc", hex: "#F5F5F5" },
  { name: "Titane Noir", hex: "#1C1C1C" },
  // Common product colors
  { name: "Bleu", hex: "#0066CC" },
  { name: "Rouge", hex: "#CC0000" },
  { name: "Vert", hex: "#008000" },
  { name: "Violet", hex: "#8B00FF" },
  { name: "Rose", hex: "#FF69B4" },
  { name: "Orange", hex: "#FF8C00" },
]

// Helper to check if an option is a color option
export function isColorOptionName(name: string): boolean {
  const colorNames = ["couleur", "color", "colour"]
  return colorNames.includes(name.toLowerCase().trim())
}

// ===========================================
// Product Options Schema (for variants)
// ===========================================

// Option values can be either simple strings OR color objects
export const productOptionValueSchema = z.union([
  z.string().min(1, "La valeur ne peut pas être vide"),
  colorValueSchema,
])

export type ProductOptionValue = z.infer<typeof productOptionValueSchema>

export const productOptionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, "Le nom de l'option est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  values: z
    .array(productOptionValueSchema)
    .min(1, "Au moins une valeur requise"),
  position: z.number().min(0).default(0),
})

export type ProductOptionInput = z.infer<typeof productOptionSchema>

// Helper to extract value name (works for both string and ColorValue)
export function getOptionValueName(value: ProductOptionValue): string {
  return typeof value === "string" ? value : value.name
}

// Helper to get color hex if value is ColorValue
export function getOptionValueHex(value: ProductOptionValue): string | null {
  return typeof value === "object" && "hex" in value ? value.hex : null
}

// ===========================================
// Product Variant Schema
// ===========================================

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z
    .string()
    .min(1, "Le SKU est requis")
    .max(100, "Le SKU ne peut pas dépasser 100 caractères"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  compare_price: z.coerce.number().min(0).optional().nullable(),
  stock_quantity: z.coerce.number().min(0).default(0),
  low_stock_threshold: z.coerce.number().min(0).default(5),
  options: z.record(z.string(), z.string()),
  position: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
})

export type ProductVariantInput = z.infer<typeof productVariantSchema>

// ===========================================
// Product with Variants Schema (Admin)
// ===========================================

export const adminProductWithVariantsSchema = adminProductSchema.extend({
  has_variants: z.boolean().default(false),
  options: z.array(productOptionSchema).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
})

export type AdminProductWithVariantsInput = z.input<typeof adminProductWithVariantsSchema>
export type AdminProductWithVariantsOutput = z.infer<typeof adminProductWithVariantsSchema>

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

export const createAdminUserSchema = z.object({
  full_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z
    .string()
    .email("Email invalide"),
  phone: z
    .string()
    .regex(/^\+225\d{10}$/, "Format: +225XXXXXXXXXX")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["admin", "super_admin"]),
})

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>
