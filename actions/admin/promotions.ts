"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import {
  adminPromotionFiltersSchema,
  adminPromotionSchema,
  isAdminRole,
} from "@/lib/validations/admin"

const action = createSafeActionClient()

// ===========================================
// Get Promotions List
// ===========================================

export const getAdminPromotions = action
  .schema(adminPromotionFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    const { page, limit, search, isActive, type } = parsedInput

    try {
      let query = supabaseAdmin
        .from("promotions")
        .select("*", { count: "exact" })

      // Apply filters
      if (search && search.trim()) {
        query = query.or(
          `name.ilike.%${search}%,code.ilike.%${search}%`
        )
      }

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive)
      }

      if (type) {
        query = query.eq("type", type)
      }

      // Sorting by starts_at desc
      query = query.order("starts_at", { ascending: false })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: promotions, error, count } = await query

      if (error) throw error

      return {
        promotions: promotions || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get promotions error:", error)
      return { error: "Erreur lors de la récupération des promotions" }
    }
  })

// ===========================================
// Get Single Promotion
// ===========================================

export const getAdminPromotion = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { data: promotion, error } = await supabaseAdmin
        .from("promotions")
        .select("*")
        .eq("id", parsedInput.id)
        .single()

      if (error) throw error

      return { promotion }
    } catch (error) {
      console.error("Get promotion error:", error)
      return { error: "Erreur lors de la récupération de la promotion" }
    }
  })

// ===========================================
// Create Promotion
// ===========================================

export const createPromotion = action
  .schema(adminPromotionSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      // Check for duplicate code
      const { data: existing } = await supabaseAdmin
        .from("promotions")
        .select("id")
        .eq("code", parsedInput.code.toUpperCase())
        .single()

      if (existing) {
        return { error: "Ce code promo existe déjà" }
      }

      const { data: promotion, error } = await supabaseAdmin
        .from("promotions")
        .insert({
          code: parsedInput.code.toUpperCase(),
          name: parsedInput.name,
          description: parsedInput.description,
          type: parsedInput.type,
          value: parsedInput.value,
          min_purchase: parsedInput.min_purchase,
          max_discount: parsedInput.max_discount,
          max_uses: parsedInput.max_uses,
          max_uses_per_user: parsedInput.max_uses_per_user,
          starts_at: parsedInput.starts_at,
          ends_at: parsedInput.ends_at,
          is_active: parsedInput.is_active,
        })
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/promotions")

      return { success: true, promotion }
    } catch (error) {
      console.error("Create promotion error:", error)
      return { error: "Erreur lors de la création de la promotion" }
    }
  })

// ===========================================
// Update Promotion
// ===========================================

export const updatePromotion = action
  .schema(adminPromotionSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    const { id, ...data } = parsedInput

    try {
      // Check for duplicate code (excluding current)
      const { data: existing } = await supabaseAdmin
        .from("promotions")
        .select("id")
        .eq("code", data.code.toUpperCase())
        .neq("id", id)
        .single()

      if (existing) {
        return { error: "Ce code promo existe déjà" }
      }

      const { data: promotion, error } = await supabaseAdmin
        .from("promotions")
        .update({
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description,
          type: data.type,
          value: data.value,
          min_purchase: data.min_purchase,
          max_discount: data.max_discount,
          max_uses: data.max_uses,
          max_uses_per_user: data.max_uses_per_user,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/promotions")
      revalidatePath(`/admin/promotions/${id}`)

      return { success: true, promotion }
    } catch (error) {
      console.error("Update promotion error:", error)
      return { error: "Erreur lors de la mise à jour de la promotion" }
    }
  })

// ===========================================
// Delete Promotion
// ===========================================

export const deletePromotion = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { error } = await supabaseAdmin
        .from("promotions")
        .delete()
        .eq("id", parsedInput.id)

      if (error) throw error

      revalidatePath("/admin/promotions")

      return { success: true }
    } catch (error) {
      console.error("Delete promotion error:", error)
      return { error: "Erreur lors de la suppression de la promotion" }
    }
  })

// ===========================================
// Toggle Promotion Status
// ===========================================

export const togglePromotionStatus = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      // Get current status
      const { data: current, error: fetchError } = await supabaseAdmin
        .from("promotions")
        .select("is_active")
        .eq("id", parsedInput.id)
        .single()

      if (fetchError) throw fetchError

      const { data: promotion, error } = await supabaseAdmin
        .from("promotions")
        .update({
          is_active: !current.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/promotions")

      return { success: true, promotion }
    } catch (error) {
      console.error("Toggle promotion status error:", error)
      return { error: "Erreur lors du changement de statut" }
    }
  })

// ===========================================
// Get Promotion Stats
// ===========================================

export async function getPromotionStats() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  try {
    const now = new Date().toISOString()

    const { data: promotions, error } = await supabaseAdmin
      .from("promotions")
      .select("id, is_active, starts_at, ends_at, used_count")

    if (error) throw error

    const stats = {
      total: promotions?.length || 0,
      active: (promotions || []).filter(
        (p) => p.is_active && new Date(p.starts_at) <= new Date() && new Date(p.ends_at) >= new Date()
      ).length,
      expired: (promotions || []).filter(
        (p) => new Date(p.ends_at) < new Date()
      ).length,
      scheduled: (promotions || []).filter(
        (p) => p.is_active && new Date(p.starts_at) > new Date()
      ).length,
      totalUsed: (promotions || []).reduce((sum, p) => sum + (p.used_count || 0), 0),
    }

    return stats
  } catch (error) {
    console.error("Get promotion stats error:", error)
    return { error: "Erreur lors du comptage" }
  }
}
