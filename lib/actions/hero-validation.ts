import type { TextAlign } from "@/lib/db/schema";
import type { HeroSlideFormData } from "@/lib/actions/admin-hero";

const VALID_TEXT_ALIGNS: TextAlign[] = ["left", "center", "right"];

// Sources d'images autorisées. Doit rester aligné avec next.config.ts
// `images.remotePatterns` : une URL hors de cette liste ferait planter
// next/image au rendu de la home (hôte non configuré).
const ALLOWED_IMAGE_PREFIXES = [
  "/api/media/", // uploads servis par le binding R2 (même origine)
  "https://cdn.dbs-store.ci/", // CDN R2 public (slides héritées)
  "https://images.unsplash.com/", // démo/seed
];

/**
 * Validation pure des données d'une bannière. Volontairement dans un module
 * sans `"use server"` : cette validation est synchrone, or un fichier Server
 * Actions n'autorise que des exports async.
 */
export function validateSlideData(data: HeroSlideFormData): { error: string } | null {
  if (typeof data.title !== "string" || !data.title.trim()) return { error: "Le titre est requis" };
  const img = typeof data.image_url === "string" ? data.image_url.trim() : "";
  if (!img) return { error: "L'image est requise" };
  if (!ALLOWED_IMAGE_PREFIXES.some((p) => img.startsWith(p)))
    return { error: "Source d'image non autorisée" };
  if (!VALID_TEXT_ALIGNS.includes(data.text_align)) return { error: "Alignement de texte invalide" };
  if (data.overlay_opacity < 0 || data.overlay_opacity > 100)
    return { error: "L'opacité doit être entre 0 et 100" };
  return null;
}
