"use server";

import { randomUUID } from "crypto";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { getDb } from "@/lib/db";
import { hero_slides } from "@/lib/db/schema";
import type { TextAlign } from "@/lib/db/schema";

export interface HeroSlideFormData {
  title: string;
  subtitle?: string;
  badge?: string;
  image_url: string;
  text_align: TextAlign;
  overlay_color: string;
  overlay_opacity: number;
  cta_primary_label?: string;
  cta_primary_href?: string;
  cta_secondary_label?: string;
  cta_secondary_href?: string;
  is_active: boolean;
}

const VALID_TEXT_ALIGNS: TextAlign[] = ["left", "center", "right"];
const MAX_ACTIVE_SLIDES = 5;

function validateSlideData(data: HeroSlideFormData): { error: string } | null {
  if (!data.title.trim()) return { error: "Le titre est requis" };
  if (!data.image_url.trim()) return { error: "L'image est requise" };
  if (!data.image_url.trim().startsWith("https://"))
    return { error: "L'URL de l'image doit commencer par https://" };
  if (!VALID_TEXT_ALIGNS.includes(data.text_align)) return { error: "Alignement de texte invalide" };
  if (data.overlay_opacity < 0 || data.overlay_opacity > 100)
    return { error: "L'opacité doit être entre 0 et 100" };
  return null;
}

export async function createHeroSlide(data: HeroSlideFormData): Promise<{ error?: string }> {
  await requireOrgMember();

  const validationError = validateSlideData(data);
  if (validationError) return validationError;

  const db = getDb();
  const now = new Date();
  const id = randomUUID();

  try {
    db.transaction((tx) => {
      if (data.is_active) {
        const activeSlides = tx
          .select({ count: count() })
          .from(hero_slides)
          .where(eq(hero_slides.is_active, true))
          .all();
        if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
          throw new Error("MAX_ACTIVE_SLIDES_REACHED");
        }
      }

      const existing = tx
        .select({ sort_order: hero_slides.sort_order })
        .from(hero_slides)
        .all();
      const maxOrder =
        existing.length > 0 ? Math.max(...existing.map((s) => s.sort_order)) : -1;

      tx.insert(hero_slides)
        .values({
          id,
          title: data.title.trim(),
          subtitle: data.subtitle?.trim() || null,
          badge: data.badge?.trim() || null,
          image_url: data.image_url.trim(),
          text_align: data.text_align,
          overlay_color: data.overlay_color,
          overlay_opacity: data.overlay_opacity,
          cta_primary_label: data.cta_primary_label?.trim() || null,
          cta_primary_href: data.cta_primary_href?.trim() || null,
          cta_secondary_label: data.cta_secondary_label?.trim() || null,
          cta_secondary_href: data.cta_secondary_href?.trim() || null,
          is_active: data.is_active,
          sort_order: maxOrder + 1,
          created_at: now,
          updated_at: now,
        })
        .run();
    });
  } catch (err) {
    if (err instanceof Error && err.message === "MAX_ACTIVE_SLIDES_REACHED") {
      return { error: "Maximum 5 bannières actives autorisées" };
    }
    console.error("[createHeroSlide]", err);
    return { error: "Erreur lors de la création" };
  }

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function updateHeroSlide(
  id: string,
  data: HeroSlideFormData
): Promise<{ error?: string }> {
  await requireOrgMember();

  const validationError = validateSlideData(data);
  if (validationError) return validationError;

  const db = getDb();

  const existing = db
    .select({ id: hero_slides.id, is_active: hero_slides.is_active })
    .from(hero_slides)
    .where(eq(hero_slides.id, id))
    .all();
  if (existing.length === 0) return { error: "Bannière introuvable" };

  try {
    db.transaction((tx) => {
      if (data.is_active && !existing[0].is_active) {
        const activeSlides = tx
          .select({ count: count() })
          .from(hero_slides)
          .where(eq(hero_slides.is_active, true))
          .all();
        if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
          throw new Error("MAX_ACTIVE_SLIDES_REACHED");
        }
      }

      tx.update(hero_slides)
        .set({
          title: data.title.trim(),
          subtitle: data.subtitle?.trim() || null,
          badge: data.badge?.trim() || null,
          image_url: data.image_url.trim(),
          text_align: data.text_align,
          overlay_color: data.overlay_color,
          overlay_opacity: data.overlay_opacity,
          cta_primary_label: data.cta_primary_label?.trim() || null,
          cta_primary_href: data.cta_primary_href?.trim() || null,
          cta_secondary_label: data.cta_secondary_label?.trim() || null,
          cta_secondary_href: data.cta_secondary_href?.trim() || null,
          is_active: data.is_active,
          updated_at: new Date(),
        })
        .where(eq(hero_slides.id, id))
        .run();
    });
  } catch (err) {
    if (err instanceof Error && err.message === "MAX_ACTIVE_SLIDES_REACHED") {
      return { error: "Maximum 5 bannières actives autorisées" };
    }
    console.error("[updateHeroSlide]", err);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function toggleHeroSlideActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = getDb();

  try {
    db.transaction((tx) => {
      if (isActive) {
        const activeSlides = tx
          .select({ count: count() })
          .from(hero_slides)
          .where(eq(hero_slides.is_active, true))
          .all();
        if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
          throw new Error("MAX_ACTIVE_SLIDES_REACHED");
        }
      }

      tx.update(hero_slides)
        .set({ is_active: isActive, updated_at: new Date() })
        .where(eq(hero_slides.id, id))
        .run();
    });
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message === "MAX_ACTIVE_SLIDES_REACHED") {
      return { error: "Maximum 5 bannières actives autorisées" };
    }
    console.error("[toggleHeroSlideActive]", err);
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteHeroSlide(id: string): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = getDb();
  try {
    await db.delete(hero_slides).where(eq(hero_slides.id, id));
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[deleteHeroSlide]", err);
    return { error: "Erreur lors de la suppression" };
  }
}

export async function reorderHeroSlides(ids: string[]): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = getDb();
  try {
    const now = new Date();
    db.transaction((tx) => {
      for (let i = 0; i < ids.length; i++) {
        tx.update(hero_slides)
          .set({ sort_order: i, updated_at: now })
          .where(eq(hero_slides.id, ids[i]))
          .run();
      }
    });
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[reorderHeroSlides]", err);
    return { error: "Erreur lors du réordonnement" };
  }
}
