"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { isAdminRole } from "@/lib/validations/admin"
import { z } from "zod"

const action = createSafeActionClient()

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

// ===========================================
// Upload Product Image
// ===========================================

export async function uploadProductImage(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Acces non autorise" }
  }

  const file = formData.get("file") as File
  const productId = formData.get("productId") as string | null

  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Type de fichier non supporte. Utilisez JPG, PNG ou WebP." }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Le fichier est trop volumineux. Maximum 5MB." }
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = productId ? `${productId}/${fileName}` : `temp/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("products")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("products").getPublicUrl(uploadData.path)

    // If product ID is provided, create database record
    let imageId: string | null = null
    if (productId) {
      // Get current max position
      const { data: existingImages } = await supabaseAdmin
        .from("product_images")
        .select("position")
        .eq("product_id", productId)
        .order("position", { ascending: false })
        .limit(1)

      const nextPosition = existingImages?.[0]?.position
        ? existingImages[0].position + 1
        : 0

      // Check if this is the first image (make it primary)
      const { count } = await supabaseAdmin
        .from("product_images")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId)

      const isPrimary = count === 0

      // Insert image record
      const { data: imageData, error: imageError } = await supabaseAdmin
        .from("product_images")
        .insert({
          product_id: productId,
          url: publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          position: nextPosition,
          is_primary: isPrimary,
        })
        .select("id")
        .single()

      if (imageError) throw imageError
      imageId = imageData.id

      revalidatePath(`/admin/products/${productId}`)
    }

    return {
      success: true,
      url: publicUrl,
      path: uploadData.path,
      imageId,
    }
  } catch (error) {
    console.error("Upload product image error:", error)
    return { error: "Erreur lors de l'upload de l'image" }
  }
}

// ===========================================
// Delete Product Image
// ===========================================

export const deleteProductImage = action
  .schema(z.object({ imageId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      // Get image record
      const { data: image, error: fetchError } = await supabaseAdmin
        .from("product_images")
        .select("id, url, product_id, is_primary")
        .eq("id", parsedInput.imageId)
        .single()

      if (fetchError) throw fetchError

      // Extract path from URL
      const urlParts = image.url.split("/storage/v1/object/public/products/")
      const storagePath = urlParts[1]

      // Delete from storage
      if (storagePath) {
        const { error: storageError } = await supabaseAdmin.storage
          .from("products")
          .remove([storagePath])

        if (storageError) {
          console.error("Storage delete error:", storageError)
          // Continue anyway to delete database record
        }
      }

      // Delete database record
      const { error: deleteError } = await supabaseAdmin
        .from("product_images")
        .delete()
        .eq("id", parsedInput.imageId)

      if (deleteError) throw deleteError

      // If this was the primary image, set another image as primary
      if (image.is_primary && image.product_id) {
        const { data: nextImage } = await supabaseAdmin
          .from("product_images")
          .select("id")
          .eq("product_id", image.product_id)
          .order("position", { ascending: true })
          .limit(1)
          .single()

        if (nextImage) {
          await supabaseAdmin
            .from("product_images")
            .update({ is_primary: true })
            .eq("id", nextImage.id)
        }
      }

      revalidatePath(`/admin/products/${image.product_id}`)

      return { success: true }
    } catch (error) {
      console.error("Delete product image error:", error)
      return { error: "Erreur lors de la suppression de l'image" }
    }
  })

// ===========================================
// Reorder Product Images
// ===========================================

export const reorderProductImages = action
  .schema(
    z.object({
      productId: z.string().uuid(),
      imageIds: z.array(z.string().uuid()),
    })
  )
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      // Update position for each image
      const updates = parsedInput.imageIds.map((id, index) =>
        supabaseAdmin
          .from("product_images")
          .update({ position: index })
          .eq("id", id)
          .eq("product_id", parsedInput.productId)
      )

      await Promise.all(updates)

      revalidatePath(`/admin/products/${parsedInput.productId}`)

      return { success: true }
    } catch (error) {
      console.error("Reorder product images error:", error)
      return { error: "Erreur lors de la reorganisation des images" }
    }
  })

// ===========================================
// Set Primary Image
// ===========================================

export const setPrimaryImage = action
  .schema(
    z.object({
      productId: z.string().uuid(),
      imageId: z.string().uuid(),
    })
  )
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      // Reset all images to non-primary
      await supabaseAdmin
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", parsedInput.productId)

      // Set the selected image as primary
      const { error } = await supabaseAdmin
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", parsedInput.imageId)
        .eq("product_id", parsedInput.productId)

      if (error) throw error

      revalidatePath(`/admin/products/${parsedInput.productId}`)

      return { success: true }
    } catch (error) {
      console.error("Set primary image error:", error)
      return { error: "Erreur lors de la definition de l'image principale" }
    }
  })
