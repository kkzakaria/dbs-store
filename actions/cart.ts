"use server"

import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const action = createSafeActionClient()

// Schema for cart operations
const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
})

const updateCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
})

const removeFromCartSchema = z.object({
  productId: z.string().uuid(),
})

// Get user's cart from database
export async function getServerCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { items: [], error: null }
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      quantity,
      product:products(*)
    `
    )
    .eq("user_id", user.id)

  if (error) {
    console.error("Get cart error:", error)
    return { items: [], error: "Erreur lors du chargement du panier" }
  }

  const items = data
    .filter((item) => item.product !== null)
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }))

  return { items, error: null }
}

// Add item to cart
export const addToCart = action
  .schema(addToCartSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté pour ajouter au panier" }
    }

    // Check if item exists in cart
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", parsedInput.productId)
      .single()

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + parsedInput.quantity })
        .eq("id", existingItem.id)

      if (error) {
        console.error("Update cart error:", error)
        return { error: "Erreur lors de la mise à jour du panier" }
      }
    } else {
      // Insert new item
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: parsedInput.productId,
        quantity: parsedInput.quantity,
      })

      if (error) {
        console.error("Add to cart error:", error)
        return { error: "Erreur lors de l'ajout au panier" }
      }
    }

    revalidatePath("/cart")
    return { success: true }
  })

// Update cart item quantity
export const updateCartItem = action
  .schema(updateCartItemSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté" }
    }

    if (parsedInput.quantity === 0) {
      // Remove item
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", parsedInput.productId)

      if (error) {
        console.error("Remove cart item error:", error)
        return { error: "Erreur lors de la suppression" }
      }
    } else {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: parsedInput.quantity })
        .eq("user_id", user.id)
        .eq("product_id", parsedInput.productId)

      if (error) {
        console.error("Update cart item error:", error)
        return { error: "Erreur lors de la mise à jour" }
      }
    }

    revalidatePath("/cart")
    return { success: true }
  })

// Remove item from cart
export const removeFromCart = action
  .schema(removeFromCartSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté" }
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", parsedInput.productId)

    if (error) {
      console.error("Remove from cart error:", error)
      return { error: "Erreur lors de la suppression" }
    }

    revalidatePath("/cart")
    return { success: true }
  })

// Clear entire cart
export async function clearServerCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Vous devez être connecté" }
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)

  if (error) {
    console.error("Clear cart error:", error)
    return { error: "Erreur lors du vidage du panier" }
  }

  revalidatePath("/cart")
  return { success: true }
}

// Sync local cart to server (called after login)
export const syncCartToServer = action
  .schema(
    z.object({
      items: z.array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().positive(),
        })
      ),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Vous devez être connecté" }
    }

    // Get existing server cart
    const { data: serverItems } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", user.id)

    const serverMap = new Map(
      serverItems?.map((item) => [item.product_id, item.quantity]) || []
    )

    // Merge local items with server (local takes priority for conflicts)
    const mergedItems: { product_id: string; quantity: number }[] = []

    for (const item of parsedInput.items) {
      const existingQuantity = serverMap.get(item.productId)
      if (existingQuantity !== undefined) {
        // Keep local quantity (user's recent action)
        mergedItems.push({
          product_id: item.productId,
          quantity: item.quantity,
        })
        serverMap.delete(item.productId)
      } else {
        // New item from local
        mergedItems.push({
          product_id: item.productId,
          quantity: item.quantity,
        })
      }
    }

    // Add remaining server items not in local
    for (const [productId, quantity] of serverMap) {
      mergedItems.push({
        product_id: productId,
        quantity,
      })
    }

    // Clear and re-insert all items
    await supabase.from("cart_items").delete().eq("user_id", user.id)

    if (mergedItems.length > 0) {
      const { error } = await supabase.from("cart_items").insert(
        mergedItems.map((item) => ({
          user_id: user.id,
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      )

      if (error) {
        console.error("Sync cart error:", error)
        return { error: "Erreur lors de la synchronisation" }
      }
    }

    revalidatePath("/cart")
    return { success: true }
  })
