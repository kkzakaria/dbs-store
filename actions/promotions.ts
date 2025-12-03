"use server"

import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import type { Promotion, PromoType } from "@/types"

const action = createSafeActionClient()

// Schema for promo code validation
const validatePromoSchema = z.object({
  code: z.string().min(1, "Le code promo est requis"),
  cartTotal: z.number().nonnegative(),
})

// Promo validation result type
export type PromoValidationResult = {
  valid: boolean
  promo?: Promotion
  discount?: number
  freeShipping?: boolean
  error?: string
}

/**
 * Calculate discount amount based on promo type
 */
function calculateDiscount(
  promo: Promotion,
  cartTotal: number
): { discount: number; freeShipping: boolean } {
  let discount = 0
  let freeShipping = false

  switch (promo.type as PromoType) {
    case "percentage":
      // Calculate percentage discount
      discount = Math.round((cartTotal * promo.value) / 100)
      // Apply max_discount cap if set
      if (promo.max_discount && discount > promo.max_discount) {
        discount = promo.max_discount
      }
      break

    case "fixed_amount":
      // Fixed discount amount
      discount = promo.value
      // Don't exceed cart total
      if (discount > cartTotal) {
        discount = cartTotal
      }
      break

    case "free_shipping":
      // Free shipping - discount is 0, we set a flag
      freeShipping = true
      break

    default:
      break
  }

  return { discount, freeShipping }
}

/**
 * Validate a promo code
 * Checks if code exists, is active, within date range, meets min purchase, and usage limits
 */
export const validatePromoCode = action
  .schema(validatePromoSchema)
  .action(async ({ parsedInput }): Promise<PromoValidationResult> => {
    const { code, cartTotal } = parsedInput
    const supabase = await createClient()

    // Get current user (optional - for per-user usage limits)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch promo by code (case insensitive)
    const { data: promo, error } = await supabase
      .from("promotions")
      .select("*")
      .ilike("code", code.trim())
      .single()

    if (error || !promo) {
      return {
        valid: false,
        error: "Code promo invalide",
      }
    }

    // Check if promo is active
    if (!promo.is_active) {
      return {
        valid: false,
        error: "Ce code promo n'est plus actif",
      }
    }

    // Check date range
    const now = new Date()
    const startsAt = new Date(promo.starts_at)
    const endsAt = new Date(promo.ends_at)

    if (now < startsAt) {
      return {
        valid: false,
        error: "Ce code promo n'est pas encore valide",
      }
    }

    if (now > endsAt) {
      return {
        valid: false,
        error: "Ce code promo a expiré",
      }
    }

    // Check minimum purchase requirement
    if (promo.min_purchase && cartTotal < promo.min_purchase) {
      return {
        valid: false,
        error: `Minimum d'achat requis: ${promo.min_purchase.toLocaleString("fr-FR")} FCFA`,
      }
    }

    // Check global usage limit
    if (promo.max_uses && (promo.used_count || 0) >= promo.max_uses) {
      return {
        valid: false,
        error: "Ce code promo a atteint sa limite d'utilisation",
      }
    }

    // Check per-user usage limit (if user is logged in)
    if (user && promo.max_uses_per_user) {
      const { count } = await supabase
        .from("promo_usage")
        .select("*", { count: "exact", head: true })
        .eq("promo_id", promo.id)
        .eq("user_id", user.id)

      if (count && count >= promo.max_uses_per_user) {
        return {
          valid: false,
          error: "Vous avez déjà utilisé ce code promo",
        }
      }
    }

    // Calculate discount
    const { discount, freeShipping } = calculateDiscount(promo, cartTotal)

    return {
      valid: true,
      promo,
      discount,
      freeShipping,
    }
  })

/**
 * Get active promotions (for display purposes)
 */
export async function getActivePromotions() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching promotions:", error)
    return []
  }

  return data as Promotion[]
}
