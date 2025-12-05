"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { adminCustomerFiltersSchema, isAdminRole } from "@/lib/validations/admin"

const action = createSafeActionClient()

// ===========================================
// Get Customers List
// ===========================================

export const getAdminCustomers = action
  .schema(adminCustomerFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    const { page, limit, search } = parsedInput

    try {
      // First get users - only customers (not admins)
      let query = supabaseAdmin
        .from("users")
        .select("*", { count: "exact" })
        .eq("role", "customer")

      // Apply search filter
      if (search && search.trim()) {
        query = query.or(
          `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      // Sorting
      query = query.order("created_at", { ascending: false })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: users, error, count } = await query

      if (error) throw error

      // Get order stats for each user
      const userIds = (users || []).map((u) => u.id)

      let orderStats: Record<string, { orders_count: number; total_spent: number }> = {}

      if (userIds.length > 0) {
        const { data: orders } = await supabaseAdmin
          .from("orders")
          .select("user_id, total")
          .in("user_id", userIds)
          .eq("status", "delivered")

        if (orders) {
          orderStats = orders.reduce(
            (acc, order) => {
              if (!acc[order.user_id]) {
                acc[order.user_id] = { orders_count: 0, total_spent: 0 }
              }
              acc[order.user_id].orders_count++
              acc[order.user_id].total_spent += order.total || 0
              return acc
            },
            {} as Record<string, { orders_count: number; total_spent: number }>
          )
        }
      }

      // Merge users with order stats
      const customers = (users || []).map((u) => ({
        ...u,
        orders_count: orderStats[u.id]?.orders_count || 0,
        total_spent: orderStats[u.id]?.total_spent || 0,
      }))

      return {
        customers,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get customers error:", error)
      return { error: "Erreur lors de la récupération des clients" }
    }
  })

// ===========================================
// Get Customer Detail
// ===========================================

export const getAdminCustomer = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { data: customer, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", parsedInput.id)
        .single()

      if (error) throw error

      // Get recent orders
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .eq("user_id", parsedInput.id)
        .order("created_at", { ascending: false })
        .limit(5)

      return { customer, orders: orders || [] }
    } catch (error) {
      console.error("Get customer error:", error)
      return { error: "Erreur lors de la récupération du client" }
    }
  })

// ===========================================
// Update Customer Role
// ===========================================

export const updateCustomerRole = action
  .schema(
    z.object({
      id: z.string().uuid(),
      role: z.enum(["customer", "admin", "super_admin"]),
    })
  )
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    // Only super_admin can change roles
    if (user.role !== "super_admin") {
      return { error: "Seul un super admin peut changer les rôles" }
    }

    try {
      const { data: customer, error } = await supabaseAdmin
        .from("users")
        .update({
          role: parsedInput.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/customers")

      return { success: true, customer }
    } catch (error) {
      console.error("Update customer role error:", error)
      return { error: "Erreur lors de la mise à jour du rôle" }
    }
  })

// ===========================================
// Get Customer Stats
// ===========================================

export async function getCustomerStats() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  try {
    // Only get customers (not admins)
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, role, created_at, loyalty_points")
      .eq("role", "customer")

    if (error) throw error

    // Get this month's new customers
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const stats = {
      total: users?.length || 0,
      newThisMonth: (users || []).filter(
        (u) => u.created_at && new Date(u.created_at) >= startOfMonth
      ).length,
      totalLoyaltyPoints: (users || []).reduce((sum, u) => sum + (u.loyalty_points || 0), 0),
    }

    return stats
  } catch (error) {
    console.error("Get customer stats error:", error)
    return { error: "Erreur lors du comptage" }
  }
}
