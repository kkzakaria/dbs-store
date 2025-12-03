"use server"

import { createSafeActionClient } from "next-safe-action"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  addressSchema,
  addressUpdateSchema,
  deleteAddressSchema,
  setDefaultAddressSchema,
} from "@/lib/validations/checkout"
import type { Address } from "@/types"

const action = createSafeActionClient()

/**
 * Get all addresses for current user
 * Sorted by is_default (default first) then created_at (newest first)
 */
export async function getAddresses(): Promise<{
  addresses: Address[]
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { addresses: [], error: "Non authentifié" }
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get addresses error:", error)
    return { addresses: [], error: "Erreur lors du chargement des adresses" }
  }

  return { addresses: data as Address[], error: null }
}

/**
 * Get a single address by ID
 */
export async function getAddress(
  id: string
): Promise<{ address: Address | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { address: null, error: "Non authentifié" }
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) {
    console.error("Get address error:", error)
    return { address: null, error: "Adresse non trouvée" }
  }

  return { address: data as Address, error: null }
}

/**
 * Create a new address
 * Name and phone are automatically taken from user profile
 */
export const createAddress = action
  .schema(addressSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté pour ajouter une adresse" }
    }

    // Fetch user profile for name and phone
    const { data: userProfile } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()

    if (!userProfile?.full_name || !userProfile?.phone) {
      return { error: "Veuillez compléter votre profil (nom et téléphone)" }
    }

    // If setting as default, unset other defaults first
    if (parsedInput.isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
    }

    // Check if this is the first address - make it default automatically
    const { count } = await supabase
      .from("addresses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    const isFirstAddress = count === 0

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        address_line: parsedInput.addressLine,
        city: parsedInput.city,
        commune: parsedInput.commune || null,
        landmark: parsedInput.landmark || null,
        is_default: parsedInput.isDefault || isFirstAddress,
      })
      .select()
      .single()

    if (error) {
      console.error("Create address error:", error)
      return { error: "Erreur lors de la création de l'adresse" }
    }

    revalidatePath("/checkout")
    revalidatePath("/account/addresses")

    return { success: true, address: data as Address }
  })

/**
 * Update an existing address
 * Name and phone are automatically synced from user profile
 */
export const updateAddress = action
  .schema(addressUpdateSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté" }
    }

    // Fetch user profile for name and phone (in case they changed)
    const { data: userProfile } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()

    if (!userProfile?.full_name || !userProfile?.phone) {
      return { error: "Veuillez compléter votre profil (nom et téléphone)" }
    }

    // If setting as default, unset other defaults first
    if (parsedInput.isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", parsedInput.id)
    }

    const { data, error } = await supabase
      .from("addresses")
      .update({
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        address_line: parsedInput.addressLine,
        city: parsedInput.city,
        commune: parsedInput.commune || null,
        landmark: parsedInput.landmark || null,
        is_default: parsedInput.isDefault,
      })
      .eq("id", parsedInput.id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Update address error:", error)
      return { error: "Erreur lors de la mise à jour de l'adresse" }
    }

    revalidatePath("/checkout")
    revalidatePath("/account/addresses")

    return { success: true, address: data as Address }
  })

/**
 * Delete an address
 */
export const deleteAddress = action
  .schema(deleteAddressSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté" }
    }

    // Check if this is the default address
    const { data: addressToDelete } = await supabase
      .from("addresses")
      .select("is_default")
      .eq("id", parsedInput.id)
      .eq("user_id", user.id)
      .single()

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", parsedInput.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Delete address error:", error)
      return { error: "Erreur lors de la suppression de l'adresse" }
    }

    // If we deleted the default, set another address as default
    if (addressToDelete?.is_default) {
      const { data: remainingAddresses } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (remainingAddresses && remainingAddresses.length > 0) {
        await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remainingAddresses[0].id)
      }
    }

    revalidatePath("/checkout")
    revalidatePath("/account/addresses")

    return { success: true }
  })

/**
 * Set an address as default
 */
export const setDefaultAddress = action
  .schema(setDefaultAddressSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté" }
    }

    // Unset all defaults
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)

    // Set the new default
    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", parsedInput.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Set default address error:", error)
      return { error: "Erreur lors de la mise à jour" }
    }

    revalidatePath("/checkout")
    revalidatePath("/account/addresses")

    return { success: true }
  })
