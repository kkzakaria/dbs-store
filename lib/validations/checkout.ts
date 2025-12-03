import { z } from "zod"
import { phoneSchema } from "./auth"

// City options grouped by shipping zone for Côte d'Ivoire
export const ABIDJAN_CENTRE_CITIES = [
  "Plateau",
  "Cocody",
  "Marcory",
  "Treichville",
  "Koumassi",
] as const

export const ABIDJAN_PERIPHERIE_CITIES = [
  "Yopougon",
  "Abobo",
  "Anyama",
  "Bingerville",
  "Port-Bouet",
] as const

export const HORS_ABIDJAN_CITIES = [
  "Bouaké",
  "San-Pedro",
  "Yamoussoukro",
  "Daloa",
  "Korhogo",
  "Man",
  "Gagnoa",
  "Abengourou",
  "Divo",
  "Grand-Bassam",
] as const

// All cities combined
export const ALL_CITIES = [
  ...ABIDJAN_CENTRE_CITIES,
  ...ABIDJAN_PERIPHERIE_CITIES,
  ...HORS_ABIDJAN_CITIES,
] as const

export type CityName = (typeof ALL_CITIES)[number]

// City groups for Select component
export const CITY_GROUPS = [
  {
    label: "Abidjan - Centre",
    cities: ABIDJAN_CENTRE_CITIES,
  },
  {
    label: "Abidjan - Périphérie",
    cities: ABIDJAN_PERIPHERIE_CITIES,
  },
  {
    label: "Hors Abidjan",
    cities: HORS_ABIDJAN_CITIES,
  },
] as const

// Address form schema
export const addressSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  phone: phoneSchema,
  addressLine: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(500, "L'adresse ne peut pas dépasser 500 caractères"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  commune: z.string().optional(),
  landmark: z.string().optional(),
  isDefault: z.boolean(),
})

// Address with ID (for updates)
export const addressUpdateSchema = addressSchema.extend({
  id: z.string().uuid("ID d'adresse invalide"),
})

// Delete address schema
export const deleteAddressSchema = z.object({
  id: z.string().uuid("ID d'adresse invalide"),
})

// Set default address schema
export const setDefaultAddressSchema = z.object({
  id: z.string().uuid("ID d'adresse invalide"),
})

// Type exports
export type AddressInput = z.infer<typeof addressSchema>
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>
