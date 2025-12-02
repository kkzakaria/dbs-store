"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  profileSchema,
  normalizePhone,
} from "@/lib/validations/auth"

const action = createSafeActionClient()

// Send OTP to existing user (login)
export const sendOTP = action
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const phone = normalizePhone(parsedInput.phone)

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single()

    if (!existingUser) {
      return {
        error: "Aucun compte associé à ce numéro. Créez un compte d'abord.",
      }
    }

    // Send OTP
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error("Send OTP error:", error)
      return {
        error: "Impossible d'envoyer le code. Veuillez réessayer.",
      }
    }

    return {
      success: true,
      phone,
    }
  })

// Sign up new user and send OTP
export const signUp = action
  .schema(registerSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const phone = normalizePhone(parsedInput.phone)

    // Check if phone already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .single()

    if (existingUser) {
      return {
        error: "Ce numéro est déjà associé à un compte. Connectez-vous.",
      }
    }

    // Send OTP with user creation
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: parsedInput.fullName,
        },
      },
    })

    if (error) {
      console.error("Sign up error:", error)
      return {
        error: "Impossible de créer le compte. Veuillez réessayer.",
      }
    }

    return {
      success: true,
      phone,
      fullName: parsedInput.fullName,
    }
  })

// Verify OTP and complete sign in
export const verifyOTP = action
  .schema(verifyOtpSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const phone = normalizePhone(parsedInput.phone)

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: parsedInput.token,
      type: "sms",
    })

    if (error) {
      console.error("Verify OTP error:", error)
      return {
        error: "Code invalide ou expiré. Veuillez réessayer.",
      }
    }

    if (data.user) {
      // Upsert user profile in public.users table
      const { error: upsertError } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            id: data.user.id,
            phone: phone,
            full_name:
              data.user.user_metadata?.full_name ||
              data.user.phone ||
              "Utilisateur",
            role: "customer" as const,
          },
          {
            onConflict: "id",
          }
        )

      if (upsertError) {
        console.error("Upsert user error:", upsertError)
        // Don't fail the login, profile can be updated later
      }
    }

    revalidatePath("/", "layout")

    return {
      success: true,
      user: data.user,
    }
  })

// Resend OTP
export const resendOTP = action
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const phone = normalizePhone(parsedInput.phone)

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true, // Allow both new and existing users
      },
    })

    if (error) {
      console.error("Resend OTP error:", error)
      return {
        error: "Impossible de renvoyer le code. Veuillez réessayer.",
      }
    }

    return {
      success: true,
    }
  })

// Sign out
export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error)
  }

  revalidatePath("/", "layout")
  redirect("/login")
}

// Get current user (helper function, not an action)
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()

  return user
}

// Update user profile
export const updateProfile = action
  .schema(profileSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return {
        error: "Vous devez être connecté pour modifier votre profil.",
      }
    }

    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    }

    if (parsedInput.fullName) {
      updateData.full_name = parsedInput.fullName
    }

    if (parsedInput.email !== undefined) {
      updateData.email = parsedInput.email || ""
    }

    if (parsedInput.avatarUrl !== undefined) {
      updateData.avatar_url = parsedInput.avatarUrl || ""
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", authUser.id)

    if (error) {
      console.error("Update profile error:", error)
      return {
        error: "Impossible de mettre à jour le profil. Veuillez réessayer.",
      }
    }

    revalidatePath("/account", "layout")

    return {
      success: true,
    }
  })
