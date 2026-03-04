import { asc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { hero_slides } from "@/lib/db/schema";

export async function getActiveHeroSlides(db: Db) {
  return db
    .select()
    .from(hero_slides)
    .where(eq(hero_slides.is_active, true))
    .orderBy(asc(hero_slides.sort_order));
}

export async function getAllHeroSlides(db: Db) {
  return db
    .select()
    .from(hero_slides)
    .orderBy(asc(hero_slides.sort_order));
}

export async function getHeroSlide(db: Db, id: string) {
  const rows = await db
    .select()
    .from(hero_slides)
    .where(eq(hero_slides.id, id));
  return rows[0] ?? null;
}
