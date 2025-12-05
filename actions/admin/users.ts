"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { z } from "zod"
import { adminUsersFiltersSchema, updateUserRoleSchema, isAdminRole } from "@/lib/validations/admin"

const action = createSafeActionClient()

// ===========================================
// Get Admin Users List (admin + super_admin only)
// ===========================================

export const getAdminUsers = action
  .schema(adminUsersFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    const { page, limit, search } = parsedInput

    try {
      let query = supabaseAdmin
        .from("users")
        .select("*", { count: "exact" })
        .in("role", ["admin", "super_admin"])

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

      return {
        users: users || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get admin users error:", error)
      return { error: "Erreur lors de la récupération des utilisateurs" }
    }
  })

// ===========================================
// Update User Role (super_admin only)
// ===========================================

export const updateUserRole = action
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput }) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || !isAdminRole(currentUser.role)) {
      return { error: "Accès non autorisé" }
    }

    // Only super_admin can change roles
    if (currentUser.role !== "super_admin") {
      return { error: "Seul un super admin peut changer les rôles" }
    }

    const { userId, role } = parsedInput

    // Prevent self-demotion
    if (currentUser.id === userId && role !== "super_admin") {
      return { error: "Vous ne pouvez pas vous rétrograder vous-même" }
    }

    try {
      // If demoting a super_admin, check if there's at least one other super_admin
      if (role === "admin") {
        const { data: targetUser } = await supabaseAdmin
          .from("users")
          .select("role")
          .eq("id", userId)
          .single()

        if (targetUser?.role === "super_admin") {
          const { count } = await supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "super_admin")

          if (count && count <= 1) {
            return { error: "Impossible : il doit rester au moins un super admin" }
          }
        }
      }

      const { data: updatedUser, error } = await supabaseAdmin
        .from("users")
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/settings")

      return { success: true, user: updatedUser }
    } catch (error) {
      console.error("Update user role error:", error)
      return { error: "Erreur lors de la mise à jour du rôle" }
    }
  })

// ===========================================
// Get Admin Users Stats
// ===========================================

export async function getAdminUsersStats() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .in("role", ["admin", "super_admin"])

    if (error) throw error

    return {
      total: users?.length || 0,
      admins: (users || []).filter((u) => u.role === "admin").length,
      superAdmins: (users || []).filter((u) => u.role === "super_admin").length,
    }
  } catch (error) {
    console.error("Get admin users stats error:", error)
    return { error: "Erreur lors du comptage" }
  }
}

// ===========================================
// Delete Admin User (demote to customer) - super_admin only
// ===========================================

export const deleteAdminUser = action
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Seul un super admin peut supprimer des administrateurs" }
    }

    const { userId } = parsedInput

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return { error: "Vous ne pouvez pas vous supprimer vous-même" }
    }

    try {
      // Check if target is super_admin and if they're the last one
      const { data: targetUser } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", userId)
        .single()

      if (targetUser?.role === "super_admin") {
        const { count } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "super_admin")

        if (count && count <= 1) {
          return { error: "Impossible : il doit rester au moins un super admin" }
        }
      }

      // Demote to customer
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          role: "customer",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      revalidatePath("/admin/settings")
      revalidatePath("/admin/customers")

      return { success: true }
    } catch (error) {
      console.error("Delete admin user error:", error)
      return { error: "Erreur lors de la suppression de l'administrateur" }
    }
  })

// ===========================================
// Search Customers (for promotion) - super_admin only
// ===========================================

export const searchCustomersForPromotion = action
  .schema(z.object({ search: z.string().min(2) }))
  .action(async ({ parsedInput }) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Seul un super admin peut ajouter des administrateurs" }
    }

    const { search } = parsedInput

    try {
      const { data: customers, error } = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, phone")
        .eq("role", "customer")
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10)

      if (error) throw error

      return { customers: customers || [] }
    } catch (error) {
      console.error("Search customers error:", error)
      return { error: "Erreur lors de la recherche" }
    }
  })

// ===========================================
// Promote Customer to Admin - super_admin only
// ===========================================

export const promoteToAdmin = action
  .schema(z.object({
    userId: z.string().uuid(),
    role: z.enum(["admin", "super_admin"]),
  }))
  .action(async ({ parsedInput }) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Seul un super admin peut ajouter des administrateurs" }
    }

    const { userId, role } = parsedInput

    try {
      const { data: updatedUser, error } = await supabaseAdmin
        .from("users")
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/settings")
      revalidatePath("/admin/customers")

      return { success: true, user: updatedUser }
    } catch (error) {
      console.error("Promote to admin error:", error)
      return { error: "Erreur lors de la promotion" }
    }
  })
