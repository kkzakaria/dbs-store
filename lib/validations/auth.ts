import { z } from "zod"

// ============================================
// EMAIL/PASSWORD AUTHENTICATION SCHEMAS
// ============================================

// Email schema
export const emailSchema = z
  .string()
  .min(1, "L'email est requis")
  .email("Format d'email invalide")

// Password schema (strong: 8+ chars, uppercase, lowercase, digit)
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")

// Full name schema (reusable)
export const fullNameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(100, "Le nom ne peut pas dépasser 100 caractères")
  .regex(
    /^[a-zA-ZÀ-ÿ\s'-]+$/,
    "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets"
  )

// OTP schema (6 digits) - used for email OTP
export const otpSchema = z
  .string()
  .length(6, "Le code doit contenir 6 chiffres")
  .regex(/^\d+$/, "Le code doit contenir uniquement des chiffres")

// Email login schema
export const emailLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().optional(),
})

// Email register schema
export const emailRegisterSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

// Email OTP verification schema
export const emailOtpSchema = z.object({
  email: emailSchema,
  token: otpSchema,
})

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// Reset password schema
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

// Profile update schema
export const profileSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  avatarUrl: z.string().url("URL invalide").optional().or(z.literal("")),
})

// Type exports
export type EmailLoginInput = z.infer<typeof emailLoginSchema>
export type EmailRegisterInput = z.infer<typeof emailRegisterSchema>
export type EmailOtpInput = z.infer<typeof emailOtpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProfileInput = z.infer<typeof profileSchema>

// ============================================
// PHONE SCHEMAS (kept for addresses/contact)
// ============================================

// Phone number schema for Côte d'Ivoire (+225 followed by 10 digits)
export const phoneSchema = z
  .string()
  .min(1, "Le numéro de téléphone est requis")
  .regex(
    /^\+225\d{10}$/,
    "Format invalide. Utilisez le format +225 XX XX XX XX XX"
  )

export type PhoneInput = z.infer<typeof phoneSchema>

// Helper to format phone for display (with spaces)
export function formatPhoneForDisplay(phone: string): string {
  // Remove +225 prefix and format
  const digits = phone.replace(/^\+225/, "")
  if (digits.length === 10) {
    return `+225 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }
  return phone
}

// Helper to normalize phone (remove spaces and ensure +225 prefix)
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  // If starts with 225, add + prefix
  if (digits.startsWith("225") && digits.length === 13) {
    return `+${digits}`
  }
  // If 10 digits, add +225 prefix
  if (digits.length === 10) {
    return `+225${digits}`
  }
  // Return as-is if already formatted
  if (phone.startsWith("+225")) {
    return phone.replace(/\s/g, "")
  }
  return phone
}

// Helper to mask phone for display (privacy)
export function maskPhone(phone: string): string {
  const formatted = formatPhoneForDisplay(phone)
  // Show: +225 07 ** ** ** 00
  const parts = formatted.split(" ")
  if (parts.length >= 6) {
    return `${parts[0]} ${parts[1]} ** ** ** ${parts[5]}`
  }
  return formatted
}
