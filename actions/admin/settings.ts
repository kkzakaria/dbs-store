"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { adminShippingZoneSchema, isAdminRole } from "@/lib/validations/admin"

const action = createSafeActionClient()

// ===========================================
// Get Shipping Zones
// ===========================================

export async function getShippingZones() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  try {
    const { data: zones, error } = await supabaseAdmin
      .from("shipping_zones")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return { zones: zones || [] }
  } catch (error) {
    console.error("Get shipping zones error:", error)
    return { error: "Erreur lors de la récupération des zones" }
  }
}

// ===========================================
// Get Single Shipping Zone
// ===========================================

export const getShippingZone = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { data: zone, error } = await supabaseAdmin
        .from("shipping_zones")
        .select("*")
        .eq("id", parsedInput.id)
        .single()

      if (error) throw error

      return { zone }
    } catch (error) {
      console.error("Get shipping zone error:", error)
      return { error: "Erreur lors de la récupération de la zone" }
    }
  })

// ===========================================
// Create Shipping Zone
// ===========================================

export const createShippingZone = action
  .schema(adminShippingZoneSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { data: zone, error } = await supabaseAdmin
        .from("shipping_zones")
        .insert({
          name: parsedInput.name,
          cities: parsedInput.cities,
          fee: parsedInput.fee,
          estimated_days: parsedInput.estimated_days,
          is_active: parsedInput.is_active,
        })
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/settings")

      return { success: true, zone }
    } catch (error) {
      console.error("Create shipping zone error:", error)
      return { error: "Erreur lors de la création de la zone" }
    }
  })

// ===========================================
// Update Shipping Zone
// ===========================================

export const updateShippingZone = action
  .schema(adminShippingZoneSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    const { id, ...data } = parsedInput

    try {
      const { data: zone, error } = await supabaseAdmin
        .from("shipping_zones")
        .update({
          name: data.name,
          cities: data.cities,
          fee: data.fee,
          estimated_days: data.estimated_days,
          is_active: data.is_active,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/settings")

      return { success: true, zone }
    } catch (error) {
      console.error("Update shipping zone error:", error)
      return { error: "Erreur lors de la mise à jour de la zone" }
    }
  })

// ===========================================
// Delete Shipping Zone
// ===========================================

export const deleteShippingZone = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      const { error } = await supabaseAdmin
        .from("shipping_zones")
        .delete()
        .eq("id", parsedInput.id)

      if (error) throw error

      revalidatePath("/admin/settings")

      return { success: true }
    } catch (error) {
      console.error("Delete shipping zone error:", error)
      return { error: "Erreur lors de la suppression de la zone" }
    }
  })

// ===========================================
// Toggle Shipping Zone Status
// ===========================================

export const toggleShippingZoneStatus = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Accès non autorisé" }
    }

    try {
      // Get current status
      const { data: current, error: fetchError } = await supabaseAdmin
        .from("shipping_zones")
        .select("is_active")
        .eq("id", parsedInput.id)
        .single()

      if (fetchError) throw fetchError

      const { data: zone, error } = await supabaseAdmin
        .from("shipping_zones")
        .update({
          is_active: !current.is_active,
        })
        .eq("id", parsedInput.id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/settings")

      return { success: true, zone }
    } catch (error) {
      console.error("Toggle shipping zone status error:", error)
      return { error: "Erreur lors du changement de statut" }
    }
  })
