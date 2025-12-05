"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import {
  adminInventoryFiltersSchema,
  updateStockSchema,
  isAdminRole,
} from "@/lib/validations/admin"

const action = createSafeActionClient()

// ===========================================
// Get Inventory (Products with stock info)
// ===========================================

export const getInventory = action
  .schema(adminInventoryFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    const { page, limit, search, lowStock, outOfStock, categoryId } = parsedInput

    try {
      let query = supabaseAdmin
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          sku,
          stock_quantity,
          low_stock_threshold,
          stock_type,
          is_active,
          category:categories(id, name),
          images:product_images(url, is_primary)
        `,
          { count: "exact" }
        )
        .eq("is_active", true)

      // Apply filters
      if (search && search.trim()) {
        query = query.or(
          `name.ilike.%${search}%,sku.ilike.%${search}%`
        )
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId)
      }

      if (outOfStock) {
        query = query.eq("stock_quantity", 0)
      } else if (lowStock) {
        query = query.gt("stock_quantity", 0)
        // Filter low stock in post-processing since we need to compare with threshold
      }

      // Sorting
      query = query.order("stock_quantity", { ascending: true })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: products, error, count } = await query

      if (error) throw error

      // Filter low stock products if needed
      let filteredProducts = products || []
      if (lowStock && !outOfStock) {
        filteredProducts = filteredProducts.filter(
          (p) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 5) && (p.stock_quantity || 0) > 0
        )
      }

      return {
        products: filteredProducts,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get inventory error:", error)
      return { error: "Erreur lors de la recuperation de l'inventaire" }
    }
  })

// ===========================================
// Update Stock
// ===========================================

export const updateStock = action
  .schema(updateStockSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .update({
          stock_quantity: parsedInput.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.productId)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/inventory")
      revalidatePath("/admin/products")

      return { success: true, product }
    } catch (error) {
      console.error("Update stock error:", error)
      return { error: "Erreur lors de la mise a jour du stock" }
    }
  })

// ===========================================
// Get Low Stock Products Count
// ===========================================

export async function getLowStockCount() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Acces non autorise" }
  }

  try {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, stock_quantity, low_stock_threshold")
      .eq("is_active", true)

    if (error) throw error

    const lowStockCount = (products || []).filter(
      (p) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 5) && (p.stock_quantity || 0) > 0
    ).length

    const outOfStockCount = (products || []).filter(
      (p) => (p.stock_quantity || 0) === 0
    ).length

    return {
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      total: products?.length || 0,
    }
  } catch (error) {
    console.error("Get low stock count error:", error)
    return { error: "Erreur lors du comptage" }
  }
}
