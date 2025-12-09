"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  emailLoginSchema,
  emailRegisterSchema,
  emailOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSchema,
} from "@/lib/validations/auth"

const action = createSafeActionClient()

// ============================================
// EMAIL/PASSWORD AUTHENTICATION
// ============================================

// Sign in with email and password
export const signInWithEmail = action
  .schema(emailLoginSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsedInput.email,
      password: parsedInput.password,
    })

    if (error) {
      console.error("Sign in error:", error)

      if (error.message.includes("Invalid login credentials")) {
        return { error: "Email ou mot de passe incorrect." }
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "Veuillez confirmer votre email avant de vous connecter." }
      }

      return { error: "Erreur de connexion. Veuillez réessayer." }
    }

    // Ensure user profile exists
    if (data.user) {
      await supabaseAdmin.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || "Utilisateur",
          role: "customer" as const,
        },
        { onConflict: "id" }
      )
    }

    revalidatePath("/", "layout")
    return { success: true }
  })

// Sign up with email and password (sends OTP email for verification)
export const signUpWithEmail = action
  .schema(emailRegisterSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", parsedInput.email)
      .single()

    if (existingUser) {
      return { error: "Cet email est déjà associé à un compte." }
    }

    // Sign up with email - Supabase will send OTP email
    const { data, error } = await supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
      options: {
        data: {
          full_name: parsedInput.fullName,
        },
      },
    })

    if (error) {
      console.error("Sign up error:", error)
      return { error: "Impossible de créer le compte. Veuillez réessayer." }
    }

    // Check if email confirmation is required
    const emailConfirmationRequired = !data.session

    return {
      success: true,
      email: parsedInput.email,
      fullName: parsedInput.fullName,
      emailConfirmationRequired,
    }
  })

// Verify email OTP (for email confirmation)
export const verifyEmailOtp = action
  .schema(emailOtpSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: parsedInput.email,
      token: parsedInput.token,
      type: "email",
    })

    if (error) {
      console.error("Verify OTP error:", error)

      if (error.message.includes("expired")) {
        return { error: "Le code a expiré. Veuillez en demander un nouveau." }
      }
      if (error.message.includes("invalid")) {
        return { error: "Code invalide. Veuillez vérifier et réessayer." }
      }

      return { error: "Erreur de vérification. Veuillez réessayer." }
    }

    // Upsert user profile
    if (data.user) {
      await supabaseAdmin.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || "Utilisateur",
          role: "customer" as const,
        },
        { onConflict: "id" }
      )
    }

    revalidatePath("/", "layout")
    return { success: true }
  })

// Resend email OTP
export const resendEmailOtp = action
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsedInput.email,
    })

    if (error) {
      console.error("Resend OTP error:", error)
      return { error: "Impossible de renvoyer le code. Veuillez réessayer." }
    }

    return { success: true }
  })

// Request password reset (sends email)
export const requestPasswordReset = action
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsedInput.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
      }
    )

    if (error) {
      console.error("Password reset error:", error)
      // Don't reveal if email exists for security
    }

    // Always return success to prevent email enumeration
    return { success: true }
  })

// Update password (after clicking reset link)
export const updatePassword = action
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: parsedInput.password,
    })

    if (error) {
      console.error("Update password error:", error)
      return { error: "Impossible de mettre à jour le mot de passe." }
    }

    revalidatePath("/", "layout")
    return { success: true }
  })

// ============================================
// OAUTH AUTHENTICATION
// ============================================

const oauthSchema = z.object({
  provider: z.enum(["google", "apple", "facebook"]),
  redirectTo: z.string().optional(),
})

export const signInWithOAuth = action
  .schema(oauthSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsedInput.provider,
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=${parsedInput.redirectTo || "/"}`,
      },
    })

    if (error) {
      console.error("OAuth error:", error)
      return { error: "Erreur d'authentification. Veuillez réessayer." }
    }

    return { success: true, url: data.url }
  })

// ============================================
// SESSION MANAGEMENT
// ============================================

// Sign out
export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error)
  }

  revalidatePath("/", "layout")
  redirect("/")
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

// ============================================
// PROFILE MANAGEMENT
// ============================================

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
