import { z } from "zod"

// Phone number schema for Côte d'Ivoire (+225 followed by 10 digits)
export const phoneSchema = z
  .string()
  .min(1, "Le numéro de téléphone est requis")
  .regex(
    /^\+225\d{10}$/,
    "Format invalide. Utilisez le format +225 XX XX XX XX XX"
  )

// OTP schema (6 digits)
export const otpSchema = z
  .string()
  .length(6, "Le code doit contenir 6 chiffres")
  .regex(/^\d+$/, "Le code doit contenir uniquement des chiffres")

// Login schema (phone only)
export const loginSchema = z.object({
  phone: phoneSchema,
})

// Register schema (name + phone)
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-zA-ZÀ-ÿ\s'-]+$/,
      "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets"
    ),
  phone: phoneSchema,
})

// Verify OTP schema
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  token: otpSchema,
})

// Profile update schema
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  avatarUrl: z.string().url("URL invalide").optional().or(z.literal("")),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type ProfileInput = z.infer<typeof profileSchema>

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
