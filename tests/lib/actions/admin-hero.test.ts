import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/actions/admin-auth", () => ({
  requireOrgMember: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

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
  return drizzle(sqlite, { schema });
}

let _testDb: ReturnType<typeof createTestDb> | null = null;

vi.mock("@/lib/db", () => ({
  getDb: () => {
    if (!_testDb) _testDb = createTestDb();
    return _testDb;
  },
}));

import { toggleHeroSlideActive, deleteHeroSlide, reorderHeroSlides } from "@/lib/actions/admin-hero";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";

const SLIDE = {
  id: "slide-1",
  title: "Promo",
  image_url: "https://example.com/img.jpg",
  text_align: "center" as const,
  overlay_color: "#000000",
  overlay_opacity: 40,
  is_active: true,
  sort_order: 0,
  created_at: new Date(),
  updated_at: new Date(),
};

describe("toggleHeroSlideActive", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await getDb().insert(schema.hero_slides).values(SLIDE);
  });

  it("désactive une slide active", async () => {
    const result = await toggleHeroSlideActive("slide-1", false);
    expect(result).toEqual({});
    const [row] = await getDb().select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(row.is_active).toBe(false);
  });
});

describe("deleteHeroSlide", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await getDb().insert(schema.hero_slides).values(SLIDE);
  });

  it("supprime une slide existante", async () => {
    const result = await deleteHeroSlide("slide-1");
    expect(result).toEqual({});
    const rows = await getDb().select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(rows).toHaveLength(0);
  });
});

describe("reorderHeroSlides", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await getDb().insert(schema.hero_slides).values([
      { ...SLIDE, id: "s1", sort_order: 0 },
      { ...SLIDE, id: "s2", sort_order: 1 },
    ]);
  });

  it("met à jour sort_order selon l'ordre des ids", async () => {
    const result = await reorderHeroSlides(["s2", "s1"]);
    expect(result).toEqual({});
    const [r1] = await getDb().select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "s1"));
    const [r2] = await getDb().select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "s2"));
    expect(r2.sort_order).toBe(0);
    expect(r1.sort_order).toBe(1);
  });
});
