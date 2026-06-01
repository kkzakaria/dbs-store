import type { TextAlign } from "@/lib/db/schema";
import type { HeroSlideFormData } from "@/lib/actions/admin-hero";

const VALID_TEXT_ALIGNS: TextAlign[] = ["left", "center", "right"];

/**
 * Validation pure des données d'une bannière. Dans un module sans `"use server"`
 * (les fichiers Server Actions n'autorisent que des exports async).
 */
export function validateSlideData(data: HeroSlideFormData): { error: string } | null {
  if (!data.title.trim()) return { error: "Le titre est requis" };
  const img = data.image_url.trim();
  if (!img) return { error: "L'image est requise" };
  // Image servie par le binding R2 (/api/media/...) ou URL externe https héritée.
  if (!img.startsWith("/api/media/") && !img.startsWith("https://"))
    return { error: "Image invalide" };
  if (!VALID_TEXT_ALIGNS.includes(data.text_align)) return { error: "Alignement de texte invalide" };
  if (data.overlay_opacity < 0 || data.overlay_opacity > 100)
    return { error: "L'opacité doit être entre 0 et 100" };
  return null;
}
