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

  const db = await getDb();
  const now = new Date();
  const id = randomUUID();

  try {
    if (data.is_active) {
      const activeSlides = await db
        .select({ count: count() })
        .from(hero_slides)
        .where(eq(hero_slides.is_active, true));
      if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
        return { error: "Maximum 5 bannières actives autorisées" };
      }
    }

    const existing = await db
      .select({ sort_order: hero_slides.sort_order })
      .from(hero_slides);
    const maxOrder =
      existing.length > 0 ? Math.max(...existing.map((s) => s.sort_order)) : -1;

    await db.insert(hero_slides).values({
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
    });
  } catch (err) {
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

  const db = await getDb();

  const existing = await db
    .select({ id: hero_slides.id, is_active: hero_slides.is_active })
    .from(hero_slides)
    .where(eq(hero_slides.id, id));
  if (existing.length === 0) return { error: "Bannière introuvable" };

  try {
    if (data.is_active && !existing[0].is_active) {
      const activeSlides = await db
        .select({ count: count() })
        .from(hero_slides)
        .where(eq(hero_slides.is_active, true));
      if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
        return { error: "Maximum 5 bannières actives autorisées" };
      }
    }

    await db.update(hero_slides)
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
      .where(eq(hero_slides.id, id));
  } catch (err) {
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
  const db = await getDb();

  try {
    if (isActive) {
      const activeSlides = await db
        .select({ count: count() })
        .from(hero_slides)
        .where(eq(hero_slides.is_active, true));
      if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
        return { error: "Maximum 5 bannières actives autorisées" };
      }
    }

    await db.update(hero_slides)
      .set({ is_active: isActive, updated_at: new Date() })
      .where(eq(hero_slides.id, id));
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[toggleHeroSlideActive]", err);
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteHeroSlide(id: string): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = await getDb();
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
  const db = await getDb();
  try {
    const now = new Date();
    await db.batch(
      ids.map((id, i) =>
        db.update(hero_slides)
          .set({ sort_order: i, updated_at: now })
          .where(eq(hero_slides.id, id))
      )
    );
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[reorderHeroSlides]", err);
    return { error: "Erreur lors du réordonnement" };
  }
}
