"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      error: "Vous devez être connecté pour modifier votre avatar.",
    }
  }

  const file = formData.get("file") as File | null

  if (!file) {
    return {
      error: "Aucun fichier sélectionné.",
    }
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      error: "Format non supporté. Utilisez JPG, PNG ou WebP.",
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: "Le fichier est trop volumineux. Taille max: 2MB.",
    }
  }

  // Get current avatar to delete later
  const { data: currentUser } = await supabaseAdmin
    .from("users")
    .select("avatar_url")
    .eq("id", authUser.id)
    .single()

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const fileName = `${authUser.id}/${Date.now()}.${fileExt}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    console.error("Upload avatar error:", uploadError)
    return {
      error: "Impossible d'uploader l'image. Veuillez réessayer.",
    }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("avatars").getPublicUrl(uploadData.path)

  // Update user profile with new avatar URL
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUser.id)

  if (updateError) {
    console.error("Update avatar URL error:", updateError)
    // Try to delete the uploaded file
    await supabaseAdmin.storage.from("avatars").remove([uploadData.path])
    return {
      error: "Impossible de mettre à jour le profil. Veuillez réessayer.",
    }
  }

  // Delete old avatar if exists
  if (currentUser?.avatar_url) {
    const oldPath = extractStoragePath(currentUser.avatar_url)
    if (oldPath) {
      await supabaseAdmin.storage.from("avatars").remove([oldPath])
    }
  }

  revalidatePath("/account", "layout")

  return {
    success: true,
    url: publicUrl,
  }
}

export async function deleteAvatar() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return {
      error: "Vous devez être connecté.",
    }
  }

  // Get current avatar
  const { data: currentUser } = await supabaseAdmin
    .from("users")
    .select("avatar_url")
    .eq("id", authUser.id)
    .single()

  if (!currentUser?.avatar_url) {
    return {
      error: "Aucun avatar à supprimer.",
    }
  }

  // Delete from storage
  const path = extractStoragePath(currentUser.avatar_url)
  if (path) {
    await supabaseAdmin.storage.from("avatars").remove([path])
  }

  // Update profile
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authUser.id)

  if (error) {
    console.error("Delete avatar error:", error)
    return {
      error: "Impossible de supprimer l'avatar. Veuillez réessayer.",
    }
  }

  revalidatePath("/account", "layout")

  return {
    success: true,
  }
}

// Helper to extract storage path from public URL
function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
