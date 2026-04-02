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
  const db = drizzle(sqlite, { schema });
  // Polyfill D1's batch() method for better-sqlite3 tests
  (db as any).batch = async (statements: any[]) => {
    return Promise.all(statements);
  };
  return db;
}

let _testDb: ReturnType<typeof createTestDb> | null = null;

vi.mock("@/lib/db", () => ({
  getDb: () => {
    if (!_testDb) _testDb = createTestDb();
    return Promise.resolve(_testDb);
  },
}));

import { toggleHeroSlideActive, deleteHeroSlide, reorderHeroSlides, createHeroSlide, updateHeroSlide } from "@/lib/actions/admin-hero";
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
    await (await getDb()).insert(schema.hero_slides).values(SLIDE);
  });

  it("désactive une slide active", async () => {
    const result = await toggleHeroSlideActive("slide-1", false);
    expect(result).toEqual({});
    const [row] = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(row.is_active).toBe(false);
  });
});

describe("deleteHeroSlide", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await (await getDb()).insert(schema.hero_slides).values(SLIDE);
  });

  it("supprime une slide existante", async () => {
    const result = await deleteHeroSlide("slide-1");
    expect(result).toEqual({});
    const rows = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(rows).toHaveLength(0);
  });
});

describe("reorderHeroSlides", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await (await getDb()).insert(schema.hero_slides).values([
      { ...SLIDE, id: "s1", sort_order: 0 },
      { ...SLIDE, id: "s2", sort_order: 1 },
    ]);
  });

  it("met à jour sort_order selon l'ordre des ids", async () => {
    const result = await reorderHeroSlides(["s2", "s1"]);
    expect(result).toEqual({});
    const [r1] = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "s1"));
    const [r2] = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "s2"));
    expect(r2.sort_order).toBe(0);
    expect(r1.sort_order).toBe(1);
  });
});

describe("toggleHeroSlideActive — activation", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await (await getDb()).insert(schema.hero_slides).values({ ...SLIDE, is_active: false });
  });

  it("active une slide inactive", async () => {
    const result = await toggleHeroSlideActive("slide-1", true);
    expect(result).toEqual({});
    const [row] = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(row.is_active).toBe(true);
  });
});

describe("reorderHeroSlides — tableau vide", () => {
  beforeEach(() => {
    _testDb = createTestDb();
  });

  it("retourne {} sans erreur pour un tableau vide", async () => {
    const result = await reorderHeroSlides([]);
    expect(result).toEqual({});
  });
});

describe("createHeroSlide", () => {
  beforeEach(() => {
    _testDb = createTestDb();
    vi.clearAllMocks();
  });

  const VALID_DATA = {
    title: "Nouvelle bannière",
    image_url: "https://cdn.dbs-store.ci/banner.jpg",
    text_align: "center" as const,
    overlay_color: "#000000",
    overlay_opacity: 40,
    is_active: true,
  };

  it("crée une slide avec sort_order = 0 quand la table est vide", async () => {
    await createHeroSlide(VALID_DATA);
    const rows = await (await getDb()).select().from(schema.hero_slides);
    expect(rows).toHaveLength(1);
    expect(rows[0].sort_order).toBe(0);
    expect(rows[0].title).toBe("Nouvelle bannière");
  });

  it("assigne sort_order = maxOrder + 1 quand des slides existent", async () => {
    await (await getDb()).insert(schema.hero_slides).values([
      { ...SLIDE, id: "s1", sort_order: 0 },
      { ...SLIDE, id: "s2", sort_order: 5 },
    ]);
    await createHeroSlide(VALID_DATA);
    const rows = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.title, "Nouvelle bannière"));
    expect(rows[0].sort_order).toBe(6);
  });

  it("retourne une erreur si le titre est vide", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, title: "  " });
    expect(result).toEqual({ error: "Le titre est requis" });
    const rows = await (await getDb()).select().from(schema.hero_slides);
    expect(rows).toHaveLength(0);
  });

  it("retourne une erreur si l'image est vide", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, image_url: "" });
    expect(result.error).toBeTruthy();
  });

  it("retourne une erreur si l'image ne commence pas par https://", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, image_url: "http://cdn.example.com/img.jpg" });
    expect(result.error).toBeTruthy();
  });

  it("retourne une erreur si text_align est invalide", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, text_align: "invalid" as "left" });
    expect(result.error).toBeTruthy();
  });

  it("retourne une erreur si overlay_opacity est hors plage", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, overlay_opacity: 150 });
    expect(result.error).toBeTruthy();
  });

  it("convertit les champs optionnels vides en null", async () => {
    await createHeroSlide({ ...VALID_DATA, subtitle: "  ", badge: "" });
    const rows = await (await getDb()).select().from(schema.hero_slides);
    expect(rows[0].subtitle).toBeNull();
    expect(rows[0].badge).toBeNull();
  });

  it("appelle redirect après succès", async () => {
    const { redirect } = await import("next/navigation");
    await createHeroSlide(VALID_DATA);
    expect(redirect).toHaveBeenCalledWith("/admin/hero");
  });
});

describe("updateHeroSlide", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    vi.clearAllMocks();
    await (await getDb()).insert(schema.hero_slides).values(SLIDE);
  });

  const UPDATE_DATA = {
    title: "Titre modifié",
    image_url: "https://cdn.dbs-store.ci/banner-new.jpg",
    text_align: "left" as const,
    overlay_color: "#111111",
    overlay_opacity: 60,
    is_active: false,
  };

  it("met à jour une slide existante", async () => {
    await updateHeroSlide("slide-1", UPDATE_DATA);
    const [row] = await (await getDb()).select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(row.title).toBe("Titre modifié");
    expect(row.is_active).toBe(false);
  });

  it("retourne une erreur si la slide n'existe pas", async () => {
    const result = await updateHeroSlide("inexistant", UPDATE_DATA);
    expect(result).toEqual({ error: "Bannière introuvable" });
  });

  it("retourne une erreur si le titre est vide", async () => {
    const result = await updateHeroSlide("slide-1", { ...UPDATE_DATA, title: "" });
    expect(result.error).toBeTruthy();
  });
});

describe("requireOrgMember — rejet d'auth", () => {
  beforeEach(() => {
    _testDb = createTestDb();
  });

  it("propage l'erreur d'auth sans toucher la DB", async () => {
    const { requireOrgMember } = await import("@/lib/actions/admin-auth");
    (requireOrgMember as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    await expect(deleteHeroSlide("slide-1")).rejects.toThrow("UNAUTHORIZED");
  });
});
