"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { adminReviewFiltersSchema, isAdminRole } from "@/lib/validations/admin"

const action = createSafeActionClient()

// ===========================================
// Get Reviews List (Admin)
// ===========================================

export const getAdminReviews = action
  .schema(adminReviewFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    const { page, limit, search, isApproved, rating, productId } = parsedInput

    try {
      let query = supabaseAdmin
        .from("reviews")
        .select(
          `
          id,
          title,
          comment,
          rating,
          is_approved,
          is_verified_purchase,
          created_at,
          product:products(id, name, slug),
          user:users(id, full_name, phone)
        `,
          { count: "exact" }
        )

      // Apply filters
      if (search && search.trim()) {
        query = query.or(
          `title.ilike.%${search}%,comment.ilike.%${search}%`
        )
      }

      if (isApproved !== undefined) {
        query = query.eq("is_approved", isApproved)
      }

      if (rating !== undefined) {
        query = query.eq("rating", rating)
      }

      if (productId !== undefined) {
        query = query.eq("product_id", productId)
      }

      // Sort by created_at descending (newest first)
      query = query.order("created_at", { ascending: false })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: reviews, error, count } = await query

      if (error) throw error

      return {
        reviews: reviews || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get reviews error:", error)
      return { error: "Erreur lors de la récupération des avis" }
    }
  })

// ===========================================
// Approve Review
// ===========================================

export const approveReview = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { data: review, error } = await supabaseAdmin
        .from("reviews")
        .update({
          is_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/reviews")

      return { success: true, review }
    } catch (error) {
      console.error("Approve review error:", error)
      return { error: "Erreur lors de l'approbation de l'avis" }
    }
  })

// ===========================================
// Reject Review (Delete)
// ===========================================

export const rejectReview = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { error } = await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("id", parsedInput.id)

      if (error) throw error

      revalidatePath("/admin/reviews")

      return { success: true }
    } catch (error) {
      console.error("Reject review error:", error)
      return { error: "Erreur lors de la suppression de l'avis" }
    }
  })

// ===========================================
// Get Review Stats
// ===========================================

export async function getReviewStats() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("id, is_approved, rating")

    if (error) throw error

    const stats = {
      total: reviews?.length || 0,
      pending: (reviews || []).filter((r) => r.is_approved === null || r.is_approved === false).length,
      approved: (reviews || []).filter((r) => r.is_approved === true).length,
      averageRating:
        reviews && reviews.length > 0
          ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
          : 0,
    }

    return stats
  } catch (error) {
    console.error("Get review stats error:", error)
    return { error: "Erreur lors du comptage" }
  }
}
