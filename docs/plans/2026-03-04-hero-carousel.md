# Hero Carousel + Administration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remplacer l'hero statique de la homepage par un carousel de bannières (max 5 slides, auto-play 4s) entièrement configurable depuis `/admin/hero`.

**Architecture:** Table SQLite `hero_slides` via Drizzle ORM. Server Actions pour le CRUD. Composant carousel client-side en CSS pur (fade). Upload images via R2 (même pattern que `admin-upload.ts`). Drag-and-drop réordonnement avec `@dnd-kit/sortable`.

**Tech Stack:** Next.js 16, Drizzle ORM + better-sqlite3, Cloudflare R2, @dnd-kit/sortable, Vitest + React Testing Library

---

## Task 1: Installer @dnd-kit

**Files:**
- Modify: `package.json` (via bun add)

**Step 1: Installer les paquets**

```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Vérifier l'installation**

```bash
bun run build 2>&1 | head -5
```
Expected: pas d'erreur d'import

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: ajouter @dnd-kit pour drag-and-drop hero slides"
```

---

## Task 2: Schema Drizzle — table `hero_slides`

**Files:**
- Modify: `lib/db/schema.ts`

**Step 1: Ajouter la table après `order_items`**

```typescript
// ── Hero Slides ───────────────────────────────────────────────────────────────

export type TextAlign = "left" | "center" | "right";

export const hero_slides = sqliteTable("hero_slides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  badge: text("badge"),
  image_url: text("image_url").notNull(),
  text_align: text("text_align").$type<TextAlign>().default("center").notNull(),
  overlay_color: text("overlay_color").default("#000000").notNull(),
  overlay_opacity: integer("overlay_opacity").default(40).notNull(),
  cta_primary_label: text("cta_primary_label"),
  cta_primary_href: text("cta_primary_href"),
  cta_secondary_label: text("cta_secondary_label"),
  cta_secondary_href: text("cta_secondary_href"),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type HeroSlide = typeof hero_slides.$inferSelect;
export type NewHeroSlide = typeof hero_slides.$inferInsert;
```

**Step 2: Générer la migration**

```bash
bunx drizzle-kit generate
```
Expected: nouveau fichier `drizzle/0002_*.sql` créé

**Step 3: Appliquer la migration**

```bash
bun run db:migrate
```
Expected: `[migrate] done`

**Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: ajouter table hero_slides au schéma Drizzle"
```

---

## Task 3: Données — `lib/data/hero-slides.ts`

**Files:**
- Create: `lib/data/hero-slides.ts`
- Create: `tests/lib/data/hero-slides.test.ts`

**Step 1: Écrire le test en premier**

```typescript
// tests/lib/data/hero-slides.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { getActiveHeroSlides, getAllHeroSlides } from "@/lib/data/hero-slides";

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
```

**Step 2: Lancer le test — vérifier qu'il échoue**

```bash
bun run test tests/lib/data/hero-slides.test.ts
```
Expected: FAIL — module not found

**Step 3: Implémenter `lib/data/hero-slides.ts`**

```typescript
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
```

**Step 4: Relancer les tests**

```bash
bun run test tests/lib/data/hero-slides.test.ts
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add lib/data/hero-slides.ts tests/lib/data/hero-slides.test.ts
git commit -m "feat: ajouter queries hero_slides"
```

---

## Task 4: Server Actions — `lib/actions/admin-hero.ts`

**Files:**
- Create: `lib/actions/admin-hero.ts`
- Create: `tests/lib/actions/admin-hero.test.ts`

**Step 1: Écrire les tests**

```typescript
// tests/lib/actions/admin-hero.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock requireOrgMember et getDb
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

vi.mock("@/lib/db", () => {
  let _db: ReturnType<typeof createTestDb> | null = null;
  return {
    getDb: () => {
      if (!_db) _db = createTestDb();
      return _db;
    },
  };
});

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
    const db = getDb();
    await db.delete(schema.hero_slides);
    await db.insert(schema.hero_slides).values(SLIDE);
  });

  it("désactive une slide active", async () => {
    const result = await toggleHeroSlideActive("slide-1", false);
    expect(result).toEqual({});
    const db = getDb();
    const [row] = await db.select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(row.is_active).toBe(false);
  });
});

describe("deleteHeroSlide", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.delete(schema.hero_slides);
    await db.insert(schema.hero_slides).values(SLIDE);
  });

  it("supprime une slide existante", async () => {
    const result = await deleteHeroSlide("slide-1");
    expect(result).toEqual({});
    const db = getDb();
    const rows = await db.select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "slide-1"));
    expect(rows).toHaveLength(0);
  });
});

describe("reorderHeroSlides", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.delete(schema.hero_slides);
    await db.insert(schema.hero_slides).values([
      { ...SLIDE, id: "s1", sort_order: 0 },
      { ...SLIDE, id: "s2", sort_order: 1 },
    ]);
  });

  it("met à jour sort_order selon l'ordre des ids", async () => {
    const result = await reorderHeroSlides(["s2", "s1"]);
    expect(result).toEqual({});
    const db = getDb();
    const [r1] = await db.select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "s1"));
    const [r2] = await db.select().from(schema.hero_slides).where(eq(schema.hero_slides.id, "s2"));
    expect(r2.sort_order).toBe(0);
    expect(r1.sort_order).toBe(1);
  });
});
```

**Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
bun run test tests/lib/actions/admin-hero.test.ts
```
Expected: FAIL — module not found

**Step 3: Implémenter `lib/actions/admin-hero.ts`**

```typescript
"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
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

export async function createHeroSlide(data: HeroSlideFormData): Promise<{ error?: string }> {
  await requireOrgMember();
  if (!data.title.trim()) return { error: "Le titre est requis" };
  if (!data.image_url.trim()) return { error: "L'image est requise" };

  const db = getDb();
  const now = new Date();

  const existing = await db.select({ sort_order: hero_slides.sort_order })
    .from(hero_slides)
    .orderBy(hero_slides.sort_order);
  const maxOrder = existing.length > 0
    ? Math.max(...existing.map((s) => s.sort_order))
    : -1;

  try {
    await db.insert(hero_slides).values({
      id: randomUUID(),
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

export async function updateHeroSlide(id: string, data: HeroSlideFormData): Promise<{ error?: string }> {
  await requireOrgMember();
  if (!data.title.trim()) return { error: "Le titre est requis" };
  if (!data.image_url.trim()) return { error: "L'image est requise" };

  const db = getDb();
  try {
    await db.update(hero_slides).set({
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
    }).where(eq(hero_slides.id, id));
  } catch (err) {
    console.error("[updateHeroSlide]", err);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}

export async function toggleHeroSlideActive(id: string, isActive: boolean): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = getDb();
  try {
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
    for (let i = 0; i < ids.length; i++) {
      await db.update(hero_slides)
        .set({ sort_order: i, updated_at: new Date() })
        .where(eq(hero_slides.id, ids[i]));
    }
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[reorderHeroSlides]", err);
    return { error: "Erreur lors du réordonnement" };
  }
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/lib/actions/admin-hero.test.ts
```
Expected: PASS (3 suites, 4 tests)

**Step 5: Commit**

```bash
git add lib/actions/admin-hero.ts tests/lib/actions/admin-hero.test.ts
git commit -m "feat: server actions CRUD hero slides"
```

---

## Task 5: Upload R2 pour les bannières

**Files:**
- Modify: `lib/actions/admin-upload.ts`

**Step 1: Ajouter `generateBannerPresignedUrl` dans le fichier existant**

Ajouter à la fin de `lib/actions/admin-upload.ts` :

```typescript
export async function generateBannerPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  const key = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
```

**Step 2: Vérifier que les tests existants passent toujours**

```bash
bun run test tests/lib/actions/admin-upload.test.ts
```
Expected: PASS

**Step 3: Commit**

```bash
git add lib/actions/admin-upload.ts
git commit -m "feat: ajouter generateBannerPresignedUrl pour R2"
```

---

## Task 6: Composant `HeroCarousel`

**Files:**
- Create: `components/hero/hero-carousel.tsx`
- Create: `tests/components/hero/hero-carousel.test.tsx`

**Step 1: Écrire le test**

```typescript
// tests/components/hero/hero-carousel.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroCarousel } from "@/components/hero/hero-carousel";
import type { HeroSlide } from "@/lib/db/schema";

const makeSlide = (overrides: Partial<HeroSlide> = {}): HeroSlide => ({
  id: "s1",
  title: "iPhone 16 Pro",
  subtitle: "La puissance de la tech",
  badge: "Nouveau",
  image_url: "https://example.com/img.jpg",
  text_align: "center",
  overlay_color: "#000000",
  overlay_opacity: 40,
  cta_primary_label: "Voir les smartphones",
  cta_primary_href: "/smartphones",
  cta_secondary_label: null,
  cta_secondary_href: null,
  is_active: true,
  sort_order: 0,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe("HeroCarousel", () => {
  it("affiche le titre de la première slide", () => {
    render(<HeroCarousel slides={[makeSlide()]} />);
    expect(screen.getByText("iPhone 16 Pro")).toBeDefined();
  });

  it("affiche le badge si présent", () => {
    render(<HeroCarousel slides={[makeSlide({ badge: "Promo -20%" })]} />);
    expect(screen.getByText("Promo -20%")).toBeDefined();
  });

  it("affiche le CTA primaire", () => {
    render(<HeroCarousel slides={[makeSlide()]} />);
    expect(screen.getByText("Voir les smartphones")).toBeDefined();
  });

  it("affiche le fallback si aucune slide", () => {
    render(<HeroCarousel slides={[]} />);
    expect(screen.getByText("Bienvenue sur DBS Store")).toBeDefined();
  });

  it("affiche les dots de navigation si plusieurs slides", () => {
    const slides = [makeSlide({ id: "s1" }), makeSlide({ id: "s2", title: "Slide 2" })];
    render(<HeroCarousel slides={slides} />);
    const dots = screen.getAllByRole("button", { name: /slide/i });
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2: Lancer le test — vérifier qu'il échoue**

```bash
bun run test tests/components/hero/hero-carousel.test.tsx
```
Expected: FAIL

**Step 3: Créer `components/hero/hero-carousel.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/db/schema";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

// Fallback si aucune slide active
function HeroFallback() {
  return (
    <section className="bg-gradient-to-b from-muted/50 to-background">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-6 lg:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          La tech au meilleur prix en Afrique de l&apos;Ouest
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Bienvenue sur DBS Store
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Découvrez notre sélection de smartphones, tablettes, ordinateurs et accessoires.
          Livraison rapide en Côte d&apos;Ivoire et dans toute la zone UEMOA.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/smartphones">Voir les smartphones</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/offres">Offres du moment</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const ALIGN_CLASSES: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [slides.length, paused, next]);

  if (slides.length === 0) return <HeroFallback />;

  const slide = slides[current];
  const overlayStyle = {
    backgroundColor: slide.overlay_color,
    opacity: slide.overlay_opacity / 100,
  };

  return (
    <section
      className="relative h-[480px] overflow-hidden sm:h-[560px] lg:h-[640px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image de fond */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={s.image_url}
            alt={s.title}
            fill
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0" style={{ backgroundColor: s.overlay_color, opacity: s.overlay_opacity / 100 }} />
        </div>
      ))}

      {/* Contenu */}
      <div className={cn(
        "relative z-10 flex h-full flex-col justify-center px-6 lg:px-16",
        ALIGN_CLASSES[slide.text_align]
      )}>
        <div className="max-w-2xl">
          {slide.badge ? (
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {slide.badge}
            </span>
          ) : null}
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p className="mt-4 text-lg text-white/80 sm:text-xl">
              {slide.subtitle}
            </p>
          ) : null}
          {(slide.cta_primary_label && slide.cta_primary_href) ||
          (slide.cta_secondary_label && slide.cta_secondary_href) ? (
            <div className={cn(
              "mt-8 flex flex-wrap gap-4",
              slide.text_align === "center" ? "justify-center" : slide.text_align === "right" ? "justify-end" : "justify-start"
            )}>
              {slide.cta_primary_label && slide.cta_primary_href ? (
                <Button size="lg" asChild>
                  <Link href={slide.cta_primary_href}>{slide.cta_primary_label}</Link>
                </Button>
              ) : null}
              {slide.cta_secondary_label && slide.cta_secondary_href ? (
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href={slide.cta_secondary_href}>{slide.cta_secondary_label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation flèches */}
      {slides.length > 1 ? (
        <>
          <button
            onClick={prev}
            aria-label="Slide précédente"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            aria-label="Slide suivante"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}

      {/* Dots */}
      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "size-2 rounded-full transition-all",
                i === current ? "w-6 bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/components/hero/hero-carousel.test.tsx
```
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add components/hero/hero-carousel.tsx tests/components/hero/hero-carousel.test.tsx
git commit -m "feat: composant HeroCarousel avec fallback et navigation"
```

---

## Task 7: Intégrer le carousel dans la homepage

**Files:**
- Modify: `app/(main)/page.tsx`

**Step 1: Remplacer le bloc hero statique**

Dans `app/(main)/page.tsx` :

1. Supprimer les imports inutilisés si besoin
2. Ajouter l'import :
```typescript
import { HeroCarousel } from "@/components/hero/hero-carousel";
import { getActiveHeroSlides } from "@/lib/data/hero-slides";
```

3. Dans `HomePage`, ajouter `getActiveHeroSlides` au `Promise.all` :
```typescript
const [featured, promos, heroSlides] = await Promise.all([
  getProductsByCategory(db, "smartphones", { tri: "nouveau" }),
  getPromoProducts(db, 4),
  getActiveHeroSlides(db),
]);
```

4. Remplacer le bloc `{/* Hero */}` (lignes 26–48) par :
```tsx
<HeroCarousel slides={heroSlides} />
```

**Step 2: Vérifier le build**

```bash
bun run build 2>&1 | tail -10
```
Expected: pas d'erreur de compilation

**Step 3: Commit**

```bash
git add app/\(main\)/page.tsx
git commit -m "feat: intégrer HeroCarousel dans la homepage"
```

---

## Task 8: Composant admin `HeroSlideList` (drag-and-drop)

**Files:**
- Create: `components/admin/hero-slide-list.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleHeroSlideActive, deleteHeroSlide, reorderHeroSlides } from "@/lib/actions/admin-hero";
import type { HeroSlide } from "@/lib/db/schema";

interface SortableRowProps {
  slide: HeroSlide;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ slide, onToggle, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn("border-b", isDragging ? "opacity-50 bg-muted" : "")}
    >
      <td className="px-3 py-3 w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Réordonner"
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="px-3 py-3 w-16">
        <div className="relative h-10 w-16 overflow-hidden rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      </td>
      <td className="px-3 py-3">
        <p className="font-medium text-sm">{slide.title}</p>
        {slide.badge ? (
          <span className="text-xs text-muted-foreground">{slide.badge}</span>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <button
          onClick={() => onToggle(slide.id, !slide.is_active)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            slide.is_active
              ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span className={cn("size-1.5 rounded-full", slide.is_active ? "bg-green-500" : "bg-muted-foreground")} />
          {slide.is_active ? "Actif" : "Inactif"}
        </button>
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/hero/${slide.id}`}>
              <Pencil className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(slide.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface HeroSlideListProps {
  initialSlides: HeroSlide[];
}

export function HeroSlideList({ initialSlides }: HeroSlideListProps) {
  const [slides, setSlides] = useState(initialSlides);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);
    setSlides(reordered);

    await reorderHeroSlides(reordered.map((s) => s.id));
  }, [slides]);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: active } : s))
    );
    await toggleHeroSlideActive(id, active);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    setSlides((prev) => prev.filter((s) => s.id !== id));
    await deleteHeroSlide(id);
  }, []);

  if (slides.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune bannière. Créez votre première bannière.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="overflow-hidden rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 w-8" />
                <th className="px-3 py-2 w-16">Aperçu</th>
                <th className="px-3 py-2">Titre</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide) => (
                <SortableRow
                  key={slide.id}
                  slide={slide}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

**Step 1: Créer le fichier avec le code ci-dessus**

**Step 2: Vérifier la compilation TypeScript**

```bash
bunx tsc --noEmit 2>&1 | grep hero-slide-list
```
Expected: pas d'erreur

**Step 3: Commit**

```bash
git add components/admin/hero-slide-list.tsx
git commit -m "feat: composant HeroSlideList avec drag-and-drop dnd-kit"
```

---

## Task 9: Composant admin `HeroSlideForm`

**Files:**
- Create: `components/admin/hero-slide-form.tsx`

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateBannerPresignedUrl } from "@/lib/actions/admin-upload";
import type { HeroSlide, TextAlign } from "@/lib/db/schema";
import type { HeroSlideFormData } from "@/lib/actions/admin-hero";

interface HeroSlideFormProps {
  initial?: HeroSlide;
  action: (data: HeroSlideFormData) => Promise<{ error?: string }>;
  submitLabel: string;
}

const TEXT_ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Droite" },
];

export function HeroSlideForm({ initial, action, submitLabel }: HeroSlideFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("url");

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [textAlign, setTextAlign] = useState<TextAlign>(initial?.text_align ?? "center");
  const [overlayColor, setOverlayColor] = useState(initial?.overlay_color ?? "#000000");
  const [overlayOpacity, setOverlayOpacity] = useState(initial?.overlay_opacity ?? 40);
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(initial?.cta_primary_label ?? "");
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(initial?.cta_primary_href ?? "");
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(initial?.cta_secondary_label ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(initial?.cta_secondary_href ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl, publicUrl } = await generateBannerPresignedUrl(file.name, file.type);
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setImageUrl(publicUrl);
    } catch {
      setServerError("Échec de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);

    const data: HeroSlideFormData = {
      title,
      subtitle: subtitle || undefined,
      badge: badge || undefined,
      image_url: imageUrl,
      text_align: textAlign,
      overlay_color: overlayColor,
      overlay_opacity: overlayOpacity,
      cta_primary_label: ctaPrimaryLabel || undefined,
      cta_primary_href: ctaPrimaryHref || undefined,
      cta_secondary_label: ctaSecondaryLabel || undefined,
      cta_secondary_href: ctaSecondaryHref || undefined,
      is_active: isActive,
    };

    const result = await action(data);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Titre */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Titre *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: iPhone 16 Pro — La révolution" />
      </div>

      {/* Sous-titre */}
      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Sous-titre</Label>
        <Textarea id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} placeholder="Description courte" />
      </div>

      {/* Badge */}
      <div className="space-y-1.5">
        <Label htmlFor="badge">Badge (optionnel)</Label>
        <Input id="badge" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Ex: Promo -20%, Nouveau" />
      </div>

      {/* Image */}
      <div className="space-y-2">
        <Label>Image *</Label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={imageMode === "url" ? "default" : "outline"} onClick={() => setImageMode("url")}>
            <LinkIcon className="size-3.5 mr-1" /> URL
          </Button>
          <Button type="button" size="sm" variant={imageMode === "upload" ? "default" : "outline"} onClick={() => setImageMode("upload")}>
            <Upload className="size-3.5 mr-1" /> Upload
          </Button>
        </div>

        {imageMode === "url" ? (
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        ) : (
          <div className="space-y-2">
            <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm" />
            {uploading ? <Loader2 className="size-4 animate-spin" /> : null}
          </div>
        )}

        {imageUrl ? (
          <div className="relative h-32 w-full overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Aperçu" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }} />
          </div>
        ) : null}
      </div>

      {/* Position du texte */}
      <div className="space-y-1.5">
        <Label>Position du texte</Label>
        <div className="flex gap-2">
          {TEXT_ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTextAlign(opt.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                textAlign === opt.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div className="space-y-3">
        <Label>Overlay</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="overlayColor" className="text-xs text-muted-foreground">Couleur</Label>
            <input id="overlayColor" type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} className="size-8 cursor-pointer rounded border" />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Label htmlFor="overlayOpacity" className="text-xs text-muted-foreground">Opacité {overlayOpacity}%</Label>
            <input id="overlayOpacity" type="range" min={0} max={100} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="flex-1" />
          </div>
        </div>
      </div>

      {/* CTA primaire */}
      <div className="space-y-2">
        <Label>Bouton primaire</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input value={ctaPrimaryLabel} onChange={(e) => setCtaPrimaryLabel(e.target.value)} placeholder="Texte du bouton" />
          <Input value={ctaPrimaryHref} onChange={(e) => setCtaPrimaryHref(e.target.value)} placeholder="/smartphones" />
        </div>
      </div>

      {/* CTA secondaire */}
      <div className="space-y-2">
        <Label>Bouton secondaire</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input value={ctaSecondaryLabel} onChange={(e) => setCtaSecondaryLabel(e.target.value)} placeholder="Texte du bouton" />
          <Input value={ctaSecondaryHref} onChange={(e) => setCtaSecondaryHref(e.target.value)} placeholder="/offres" />
        </div>
      </div>

      {/* Actif */}
      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 cursor-pointer" />
        <Label htmlFor="isActive" className="cursor-pointer">Bannière active (visible sur le site)</Label>
      </div>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
```

**Step 1: Créer le fichier**

**Step 2: Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | grep hero-slide-form
```
Expected: pas d'erreur

**Step 3: Commit**

```bash
git add components/admin/hero-slide-form.tsx
git commit -m "feat: formulaire HeroSlideForm avec upload R2 et aperçu"
```

---

## Task 10: Pages admin Hero

**Files:**
- Create: `app/(admin)/admin/hero/page.tsx`
- Create: `app/(admin)/admin/hero/nouveau/page.tsx`
- Create: `app/(admin)/admin/hero/[id]/page.tsx`

**Step 1: Page liste `/admin/hero/page.tsx`**

```typescript
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { getAllHeroSlides } from "@/lib/data/hero-slides";
import { HeroSlideList } from "@/components/admin/hero-slide-list";

export default async function AdminHeroPage() {
  const db = getDb();
  const slides = await getAllHeroSlides(db);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero — Bannières</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Glissez pour réordonner. Maximum 5 bannières actives.
          </p>
        </div>
        <Button asChild disabled={slides.filter((s) => s.is_active).length >= 5}>
          <Link href="/admin/hero/nouveau">
            <Plus className="mr-2 size-4" />
            Nouvelle bannière
          </Link>
        </Button>
      </div>
      <HeroSlideList initialSlides={slides} />
    </div>
  );
}
```

**Step 2: Page création `/admin/hero/nouveau/page.tsx`**

```typescript
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { createHeroSlide } from "@/lib/actions/admin-hero";

export default function AdminHeroNouveauPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nouvelle bannière</h1>
      <HeroSlideForm action={createHeroSlide} submitLabel="Créer la bannière" />
    </div>
  );
}
```

**Step 3: Page édition `/admin/hero/[id]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getHeroSlide } from "@/lib/data/hero-slides";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { updateHeroSlide } from "@/lib/actions/admin-hero";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminHeroEditPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();
  const slide = await getHeroSlide(db, id);

  if (!slide) notFound();

  const action = async (data: Parameters<typeof updateHeroSlide>[1]) => {
    "use server";
    return updateHeroSlide(id, data);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Modifier la bannière</h1>
      <HeroSlideForm initial={slide} action={action} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
```

**Step 4: Créer les 3 fichiers**

**Step 5: Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | grep admin/hero
```
Expected: pas d'erreur

**Step 6: Commit**

```bash
git add app/\(admin\)/admin/hero/
git commit -m "feat: pages admin hero (liste, création, édition)"
```

---

## Task 11: Ajouter Hero dans la sidebar admin

**Files:**
- Modify: `components/admin/sidebar.tsx`

**Step 1: Ajouter l'import `ImagePlay` et l'item nav**

Dans `components/admin/sidebar.tsx`, modifier :

```typescript
// Ajouter ImagePlay à l'import lucide
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Store,
  ImagePlay,
} from "lucide-react";

// Modifier navItems — insérer entre Dashboard et Produits
const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Hero", href: "/admin/hero", icon: ImagePlay, exact: false },
  { label: "Produits", href: "/admin/produits", icon: Package, exact: false },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart, exact: false },
  { label: "Équipe", href: "/admin/equipe", icon: Users, exact: false },
];
```

**Step 2: Lancer tous les tests**

```bash
bun run test
```
Expected: tous les tests passent

**Step 3: Build de vérification finale**

```bash
bun run build 2>&1 | tail -15
```
Expected: build réussi sans erreur

**Step 4: Commit final**

```bash
git add components/admin/sidebar.tsx
git commit -m "feat: ajouter Hero dans la sidebar admin"
```

---

## Récapitulatif des commits

1. `chore: ajouter @dnd-kit pour drag-and-drop hero slides`
2. `feat: ajouter table hero_slides au schéma Drizzle`
3. `feat: ajouter queries hero_slides`
4. `feat: server actions CRUD hero slides`
5. `feat: ajouter generateBannerPresignedUrl pour R2`
6. `feat: composant HeroCarousel avec fallback et navigation`
7. `feat: intégrer HeroCarousel dans la homepage`
8. `feat: composant HeroSlideList avec drag-and-drop dnd-kit`
9. `feat: formulaire HeroSlideForm avec upload R2 et aperçu`
10. `feat: pages admin hero (liste, création, édition)`
11. `feat: ajouter Hero dans la sidebar admin`

## Points d'attention

- `better-sqlite3` transactions synchrones : les boucles `for` dans `reorderHeroSlides` utilisent `await db.update()` directement (pas de `db.transaction()`)
- R2 : les variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` doivent être dans `.env.local`
- `next/image` avec URLs R2 externes : vérifier que le domaine R2 est dans `next.config.ts` (`images.remotePatterns`)
- Limite 5 slides actives : vérifiée côté UI (bouton désactivé), pas côté serveur (hors scope YAGNI)
- `bun run db:migrate` doit être relancé après la génération de la migration Task 2
