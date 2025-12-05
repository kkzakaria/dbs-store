"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import {
  adminOrderFiltersSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  updateTrackingSchema,
  isAdminRole,
} from "@/lib/validations/admin"
import { z } from "zod"

const action = createSafeActionClient()

// ===========================================
// Get Admin Orders (with filters and pagination)
// ===========================================

export const getAdminOrders = action
  .schema(adminOrderFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    const {
      page,
      limit,
      search,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      sort,
      order,
    } = parsedInput

    try {
      let query = supabaseAdmin
        .from("orders")
        .select(
          `
          *,
          user:users(id, full_name, phone, email),
          items:order_items(
            id,
            quantity,
            unit_price,
            total_price,
            product_snapshot
          )
        `,
          { count: "exact" }
        )

      // Apply filters
      if (search && search.trim()) {
        query = query.or(
          `order_number.ilike.%${search}%,tracking_number.ilike.%${search}%`
        )
      }

      if (status) {
        query = query.eq("status", status)
      }

      if (paymentStatus) {
        query = query.eq("payment_status", paymentStatus)
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom)
      }

      if (dateTo) {
        query = query.lte("created_at", dateTo)
      }

      // Sorting
      query = query.order(sort, { ascending: order === "asc" })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: orders, error, count } = await query

      if (error) throw error

      return {
        orders: orders || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get admin orders error:", error)
      return { error: "Erreur lors de la recuperation des commandes" }
    }
  })

// ===========================================
// Get Single Order (Admin)
// ===========================================

export const getAdminOrder = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select(
          `
          *,
          user:users(id, full_name, phone, email, avatar_url, loyalty_points),
          address:addresses(id, full_name, phone, address_line, city, commune, landmark),
          items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            product_snapshot,
            product:products(id, name, slug, images:product_images(url, is_primary))
          ),
          promotion:promotions(id, code, name, type, value)
        `
        )
        .eq("id", parsedInput.id)
        .single()

      if (error) throw error

      return { order }
    } catch (error) {
      console.error("Get admin order error:", error)
      return { error: "Commande non trouvee" }
    }
  })

// ===========================================
// Update Order Status
// ===========================================

export const updateOrderStatus = action
  .schema(updateOrderStatusSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({
          status: parsedInput.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/orders")
      revalidatePath(`/admin/orders/${parsedInput.id}`)

      return { success: true, order }
    } catch (error) {
      console.error("Update order status error:", error)
      return { error: "Erreur lors de la mise a jour du statut" }
    }
  })

// ===========================================
// Update Payment Status
// ===========================================

export const updatePaymentStatus = action
  .schema(updatePaymentStatusSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: parsedInput.paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/orders")
      revalidatePath(`/admin/orders/${parsedInput.id}`)

      return { success: true, order }
    } catch (error) {
      console.error("Update payment status error:", error)
      return { error: "Erreur lors de la mise a jour du statut de paiement" }
    }
  })

// ===========================================
// Update Tracking Number
// ===========================================

export const updateTrackingNumber = action
  .schema(updateTrackingSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({
          tracking_number: parsedInput.trackingNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/orders")
      revalidatePath(`/admin/orders/${parsedInput.id}`)

      return { success: true, order }
    } catch (error) {
      console.error("Update tracking number error:", error)
      return { error: "Erreur lors de la mise a jour du numero de suivi" }
    }
  })

// ===========================================
// Get Order Stats
// ===========================================

export async function getOrderStats() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Acces non autorise" }
  }

  try {
    // Count by status
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from("orders")
      .select("status")

    if (statusError) throw statusError

    const stats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      total: statusCounts?.length || 0,
    }

    statusCounts?.forEach((order) => {
      if (order.status && order.status in stats) {
        stats[order.status as keyof typeof stats]++
      }
    })

    return { stats }
  } catch (error) {
    console.error("Get order stats error:", error)
    return { error: "Erreur lors de la recuperation des statistiques" }
  }
}
