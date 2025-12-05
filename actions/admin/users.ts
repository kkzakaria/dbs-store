"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { z } from "zod"
import { adminUsersFiltersSchema, updateUserRoleSchema, createAdminUserSchema, isAdminRole } from "@/lib/validations/admin"

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
// Create Admin User - super_admin only
// ===========================================

export const createAdminUser = action
  .schema(createAdminUserSchema)
  .action(async ({ parsedInput }) => {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Seul un super admin peut créer des administrateurs" }
    }

    const { full_name, email, phone, password, role } = parsedInput

    try {
      // Check if email already exists
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single()

      if (existingUser) {
        return { error: "Un utilisateur avec cet email existe déjà" }
      }

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone: phone || null,
        },
      })

      if (authError) {
        console.error("Auth create user error:", authError)
        return { error: "Erreur lors de la création du compte" }
      }

      // Update user role in users table
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          role,
          full_name,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)

      if (updateError) {
        console.error("Update user role error:", updateError)
        // Try to clean up the auth user if role update fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return { error: "Erreur lors de l'attribution du rôle" }
      }

      revalidatePath("/admin/settings")

      return { success: true, userId: authData.user.id }
    } catch (error) {
      console.error("Create admin user error:", error)
      return { error: "Erreur lors de la création de l'administrateur" }
    }
  })
