import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { getActiveHeroSlides, getAllHeroSlides, getHeroSlide } from "@/lib/data/hero-slides";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE hero_slides (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      badge TEXT,
      image_url TEXT NOT NULL,
      text_align TEXT NOT NULL DEFAULT 'center',
      overlay_color TEXT NOT NULL DEFAULT '#000000',
      overlay_opacity INTEGER NOT NULL DEFAULT 40,
      cta_primary_label TEXT,
      cta_primary_href TEXT,
      cta_secondary_label TEXT,
      cta_secondary_href TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  // Cast to any: BetterSQLite3Database is used for tests while D1 is used in production
  return drizzle(sqlite, { schema }) as any;
}

const NOW = Math.floor(Date.now() / 1000);

const SLIDE_BASE = {
  title: "Slide 1",
  image_url: "https://example.com/image.jpg",
  text_align: "center" as const,
  overlay_color: "#000000",
  overlay_opacity: 40,
  is_active: true,
  sort_order: 0,
  created_at: new Date(NOW * 1000),
  updated_at: new Date(NOW * 1000),
};

describe("getActiveHeroSlides", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it("retourne uniquement les slides actives triées par sort_order", async () => {
    await db.insert(schema.hero_slides).values([
      { id: "s1", ...SLIDE_BASE, sort_order: 2, title: "Slide 2" },
      { id: "s2", ...SLIDE_BASE, sort_order: 1, title: "Slide 1" },
      { id: "s3", ...SLIDE_BASE, sort_order: 3, title: "Slide inactif", is_active: false },
    ]);
    const slides = await getActiveHeroSlides(db);
    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe("Slide 1");
    expect(slides[1].title).toBe("Slide 2");
  });

  it("retourne un tableau vide s'il n'y a pas de slides actives", async () => {
    const slides = await getActiveHeroSlides(db);
    expect(slides).toHaveLength(0);
  });
});

describe("getAllHeroSlides", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it("retourne toutes les slides (actives et inactives) triées par sort_order", async () => {
    await db.insert(schema.hero_slides).values([
      { id: "s1", ...SLIDE_BASE, sort_order: 1, is_active: false },
      { id: "s2", ...SLIDE_BASE, sort_order: 0, is_active: true },
    ]);
    const slides = await getAllHeroSlides(db);
    expect(slides).toHaveLength(2);
    expect(slides[0].sort_order).toBe(0);
  });
});

describe("getHeroSlide", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it("retourne la slide correspondant à l'id", async () => {
    await db.insert(schema.hero_slides).values({ id: "s1", ...SLIDE_BASE });
    const slide = await getHeroSlide(db, "s1");
    expect(slide).not.toBeNull();
    expect(slide?.id).toBe("s1");
  });

  it("retourne null si aucune slide ne correspond", async () => {
    const slide = await getHeroSlide(db, "inexistant");
    expect(slide).toBeNull();
  });
});
