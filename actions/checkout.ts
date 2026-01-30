"use server"

import { createClient } from "@/lib/supabase/server"
import type { ShippingZone, Promotion, PromoType, Store } from "@/types"

// =====================
// STORE ACTIONS
// =====================

/**
 * Get all active stores
 * Sorted by name
 */
export async function getStores(): Promise<{
  stores: Store[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, city, commune, phone, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("Get stores error:", error)
    return { stores: [], error: "Erreur lors du chargement des magasins" }
  }

  return { stores: data as Store[], error: null }
}

/**
 * Get the closest store based on the customer's commune/city
 * Uses commune matching first, then falls back to same city
 * If no match, returns the first store (default)
 */
export async function getClosestStore(
  commune: string | null,
  city: string
): Promise<{ store: Store | null; error: string | null }> {
  const supabase = await createClient()

  // First, try to find a store in the same commune
  if (commune) {
    const { data: communeMatch } = await supabase
      .from("stores")
      .select("id, name, address, city, commune, phone, is_active")
      .eq("is_active", true)
      .ilike("commune", commune)
      .limit(1)
      .single()

    if (communeMatch) {
      return { store: communeMatch as Store, error: null }
    }
  }

  // Fallback: get the first store in the same city
  const { data: cityMatch } = await supabase
    .from("stores")
    .select("id, name, address, city, commune, phone, is_active")
    .eq("is_active", true)
    .ilike("city", `%${city}%`)
    .limit(1)
    .single()

  if (cityMatch) {
    return { store: cityMatch as Store, error: null }
  }

  // Final fallback: return the first active store
  const { data: defaultStore, error } = await supabase
    .from("stores")
    .select("id, name, address, city, commune, phone, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(1)
    .single()

  if (error || !defaultStore) {
    console.error("Get closest store error:", error)
    return { store: null, error: "Aucun magasin disponible" }
  }

  return { store: defaultStore as Store, error: null }
}

// =====================
// SHIPPING ZONE ACTIONS
// =====================

/**
 * Get all active shipping zones
 * Sorted by fee (lowest first)
 */
export async function getShippingZones(): Promise<{
  zones: ShippingZone[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shipping_zones")
    .select("id, name, fee, cities, is_active")
    .eq("is_active", true)
    .order("fee", { ascending: true })

  if (error) {
    console.error("Get shipping zones error:", error)
    return { zones: [], error: "Erreur lors du chargement des zones de livraison" }
  }

  return { zones: data as ShippingZone[], error: null }
}

/**
 * Get shipping zone for a specific city
 * Uses the cities array column to find matching zone
 */
export async function getShippingZoneByCity(
  city: string
): Promise<{ zone: ShippingZone | null; error: string | null }> {
  const supabase = await createClient()

  // Use contains to search in the cities array
  const { data, error } = await supabase
    .from("shipping_zones")
    .select("id, name, fee, cities, is_active")
    .eq("is_active", true)
    .contains("cities", [city])
    .single()

  if (error) {
    // If no zone found for city, try to get "Hors Abidjan" as fallback
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("shipping_zones")
      .select("id, name, fee, cities, is_active")
      .eq("is_active", true)
      .ilike("name", "%Hors%")
      .single()

    if (fallbackError || !fallbackData) {
      console.error("Get shipping zone by city error:", error)
      return { zone: null, error: "Zone de livraison non trouvée pour cette ville" }
    }

    return { zone: fallbackData as ShippingZone, error: null }
  }

  return { zone: data as ShippingZone, error: null }
}

/**
 * Calculate discount based on promo type
 */
function calculateDiscount(
  promo: Promotion,
  subtotal: number
): { discount: number; freeShipping: boolean } {
  let discount = 0
  let freeShipping = false

  switch (promo.type as PromoType) {
    case "percentage":
      discount = Math.round((subtotal * promo.value) / 100)
      if (promo.max_discount && discount > promo.max_discount) {
        discount = promo.max_discount
      }
      break

    case "fixed_amount":
      discount = Math.min(promo.value, subtotal)
      break

    case "free_shipping":
      freeShipping = true
      break
  }

  return { discount, freeShipping }
}

/**
 * Calculate checkout totals (subtotal, discount, shipping, total)
 */
export async function calculateCheckoutTotals(params: {
  cartItems: Array<{ productId: string; quantity: number; price: number }>
  promoCode?: string | null
  shippingZoneId?: string | null
}): Promise<{
  subtotal: number
  discount: number
  shippingFee: number
  freeShipping: boolean
  total: number
  promoId: string | null
  error: string | null
}> {
  const supabase = await createClient()

  // Calculate subtotal
  const subtotal = params.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // Get discount from promo code
  let discount = 0
  let freeShipping = false
  let promoId: string | null = null

  if (params.promoCode) {
    const { data: promo } = await supabase
      .from("promotions")
      .select("id, code, type, value, is_active, starts_at, ends_at, min_purchase, max_uses, used_count, max_uses_per_user, max_discount")
      .ilike("code", params.promoCode.trim())
      .eq("is_active", true)
      .single()

    if (promo) {
      const now = new Date()
      const startsAt = new Date(promo.starts_at)
      const endsAt = new Date(promo.ends_at)

      // Validate promo is within date range and meets minimum
      if (
        now >= startsAt &&
        now <= endsAt &&
        subtotal >= (promo.min_purchase || 0)
      ) {
        promoId = promo.id
        const result = calculateDiscount(promo as Promotion, subtotal)
        discount = result.discount
        freeShipping = result.freeShipping
      }
    }
  }

  // Get shipping fee
  let shippingFee = 0
  if (params.shippingZoneId && !freeShipping) {
    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("fee")
      .eq("id", params.shippingZoneId)
      .single()

    if (zone) {
      shippingFee = zone.fee
    }
  }

  const total = subtotal - discount + shippingFee

  return {
    subtotal,
    discount,
    shippingFee,
    freeShipping,
    total,
    promoId,
    error: null,
  }
}

/**
 * Validate promo code for checkout (revalidate before final order)
 */
export async function validatePromoForCheckout(params: {
  code: string
  subtotal: number
}): Promise<{
  valid: boolean
  promoId: string | null
  discount: number
  freeShipping: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch promo by code (case insensitive)
  const { data: promo, error } = await supabase
    .from("promotions")
    .select("id, code, type, value, is_active, starts_at, ends_at, min_purchase, max_uses, used_count, max_uses_per_user, max_discount")
    .ilike("code", params.code.trim())
    .single()

  if (error || !promo) {
    return {
      valid: false,
      promoId: null,
      discount: 0,
      freeShipping: false,
      error: "Code promo invalide",
    }
  }

  // Check if promo is active
  if (!promo.is_active) {
    return {
      valid: false,
      promoId: null,
      discount: 0,
      freeShipping: false,
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
      promoId: null,
      discount: 0,
      freeShipping: false,
      error: "Ce code promo n'est pas encore valide",
    }
  }

  if (now > endsAt) {
    return {
      valid: false,
      promoId: null,
      discount: 0,
      freeShipping: false,
      error: "Ce code promo a expiré",
    }
  }

  // Check minimum purchase requirement
  if (promo.min_purchase && params.subtotal < promo.min_purchase) {
    return {
      valid: false,
      promoId: null,
      discount: 0,
      freeShipping: false,
      error: `Minimum d'achat requis: ${promo.min_purchase.toLocaleString("fr-FR")} FCFA`,
    }
  }

  // Check global usage limit
  if (promo.max_uses && (promo.used_count || 0) >= promo.max_uses) {
    return {
      valid: false,
      promoId: null,
      discount: 0,
      freeShipping: false,
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
        promoId: null,
        discount: 0,
        freeShipping: false,
        error: "Vous avez déjà utilisé ce code promo",
      }
    }
  }

  // Calculate discount
  const { discount, freeShipping } = calculateDiscount(
    promo as Promotion,
    params.subtotal
  )

  return {
    valid: true,
    promoId: promo.id,
    discount,
    freeShipping,
    error: null,
  }
}
