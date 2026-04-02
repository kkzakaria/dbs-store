# PR Review Fixes — Hero Carousel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical and important issues identified in the PR review of the Hero Carousel feature.

**Architecture:** Each task is self-contained and produces a passing test suite after completion. Tasks are ordered by severity: critical first, then important, then test coverage gaps.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, better-sqlite3, Vitest, React Testing Library, Tailwind CSS v4, Bun.

---

## Context / Key Facts

- Dev server: `bun run dev` on port 33000
- Tests: `bun run test` (Vitest)
- `better-sqlite3` transactions are SYNCHRONOUS — `db.transaction()` callback must NOT be async; call `.run()` on each statement inside (no `await`)
- `redirect()` from `next/navigation` throws internally — must NOT be inside a try/catch
- `requireOrgMember()` throws `new Error("UNAUTHORIZED")` — server actions currently don't catch this; it propagates as unhandled
- `proxy.ts` exports `proxy()` and `config` — Next.js requires `middleware.ts` exporting `middleware()` and `config`
- `tests/proxy.test.ts` = good test file; `tests/middleware.test.ts` = bad duplicate (tests `@/proxy` with broken mocks)

---

## Task 1: Restore Middleware (proxy.ts → middleware.ts)

**Problem:** Next.js only invokes `middleware.ts` at root exporting `middleware`. `proxy.ts` is dead code. `/compte` routes bypass email verification check.

**Files:**
- Rename: `proxy.ts` → `middleware.ts` (rename the exported function too)
- Modify: `tests/proxy.test.ts` (update import path)
- Delete: `tests/middleware.test.ts` (inferior duplicate)

**Step 1: Create middleware.ts from proxy.ts contents**

Create `middleware.ts` with this exact content (rename `proxy` → `middleware`):

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    console.error(`[proxy] getSession failed (${pathname}):`, err);
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!session?.user) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/email-non-verifie", request.url));
  }

  if (isAdminRoute) {
    let orgs: Awaited<ReturnType<typeof auth.api.listOrganizations>>;
    try {
      orgs = await auth.api.listOrganizations({ headers: request.headers });
    } catch (err) {
      console.error(`[proxy] listOrganizations failed (${pathname}):`, err);
      return NextResponse.redirect(new URL("/", request.url));
    }

    const isMember =
      Array.isArray(orgs) &&
      orgs.some((org: { slug: string }) => org.slug === "dbs-store");

    if (!isMember) {
      console.warn(`[proxy] accès admin refusé (${pathname}): non membre de l'organisation`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
```

**Step 2: Delete proxy.ts**

```bash
rm proxy.ts
```

**Step 3: Update tests/proxy.test.ts — change import from `@/proxy` to `@/middleware`, rename `proxy` → `middleware`**

In `tests/proxy.test.ts`, change:
- Line 38: `const mod = await import("@/proxy");` → `const mod = await import("@/middleware");`
- Line 39: `proxy = mod.proxy;` → `proxy = mod.middleware;`
- Also update the `proxy config` describe block: `await import("@/proxy")` → `await import("@/middleware")`

**Step 4: Delete tests/middleware.test.ts**

```bash
rm tests/middleware.test.ts
```

**Step 5: Run tests to verify**

```bash
bun run test tests/proxy.test.ts
```
Expected: All 10 tests pass.

**Step 6: Commit**

```bash
git add middleware.ts tests/proxy.test.ts
git rm proxy.ts tests/middleware.test.ts
git commit -m "fix: renommer proxy.ts en middleware.ts pour Next.js (restaure protection email)"
```

---

## Task 2: Fix hero-slide-list.tsx — Silent Error Swallowing

**Problem:** `handleDragEnd`, `handleToggle`, `handleDelete` discard server action results. On failure, UI shows wrong state with no error shown to user.

**Files:**
- Modify: `components/admin/hero-slide-list.tsx`

**Step 1: Add error state and fix the three handlers**

Replace `HeroSlideList` component body (lines 115–186). The key changes:
1. Add `const [actionError, setActionError] = useState<string | null>(null);`
2. Each handler: save `previous`, call action, check `result?.error`, rollback if error
3. Render error below the table

Here is the full updated component (replace lines 115–186):

```tsx
export function HeroSlideList({ initialSlides }: HeroSlideListProps) {
  const [slides, setSlides] = useState(initialSlides);
  const [actionError, setActionError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const previous = slides;
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(slides, oldIndex, newIndex);
      setSlides(reordered);
      setActionError(null);

      const result = await reorderHeroSlides(reordered.map((s) => s.id));
      if (result?.error) {
        setSlides(previous);
        setActionError(result.error);
      }
    },
    [slides]
  );

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    const previous = slides;
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: active } : s)));
    setActionError(null);

    const result = await toggleHeroSlideActive(id, active);
    if (result?.error) {
      setSlides(previous);
      setActionError(result.error);
    }
  }, [slides]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    const previous = slides;
    setSlides((prev) => prev.filter((s) => s.id !== id));
    setActionError(null);

    const result = await deleteHeroSlide(id);
    if (result?.error) {
      setSlides(previous);
      setActionError(result.error);
    }
  }, [slides]);

  if (slides.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucune bannière. Créez votre première bannière.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="overflow-hidden rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="w-8 px-3 py-2" />
                  <th className="w-20 px-3 py-2">Aperçu</th>
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
    </div>
  );
}
```

**Step 2: Run tests**

```bash
bun run test
```
Expected: All tests pass (no unit tests for this component — covered by Task 8 if added).

**Step 3: Commit**

```bash
git add components/admin/hero-slide-list.tsx
git commit -m "fix: vérifier les résultats des server actions dans HeroSlideList avec rollback"
```

---

## Task 3: Fix admin-upload.ts — Env Var Validation + File Type Allowlist

**Problem:** Missing R2 env vars produce literal `"undefined/..."` stored as valid image URLs. Client-controlled `contentType` allows arbitrary file types.

**Files:**
- Modify: `lib/actions/admin-upload.ts`

**Step 1: Rewrite admin-upload.ts with validation**

Replace entire file content:

```ts
"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireOrgMember } from "@/lib/actions/admin-auth";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Configuration R2 manquante (variables d'environnement)");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

function createR2Client(accountId: string, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function generatePresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl: baseUrl } = getR2Config();
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;

  const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(createR2Client(accountId, accessKeyId, secretAccessKey), command, { expiresIn: 300 });

  return { uploadUrl, publicUrl: `${baseUrl}/${key}` };
}

export async function generateBannerPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl: baseUrl } = getR2Config();
  const key = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;

  const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(createR2Client(accountId, accessKeyId, secretAccessKey), command, { expiresIn: 300 });

  return { uploadUrl, publicUrl: `${baseUrl}/${key}` };
}
```

**Step 2: Run tests**

```bash
bun run test
```
Expected: Passes (no unit tests yet for this file — added in Task 8).

**Step 3: Commit**

```bash
git add lib/actions/admin-upload.ts
git commit -m "fix: valider les variables R2 et le type de fichier dans admin-upload"
```

---

## Task 4: Fix admin-hero.ts — Transaction + Input Validation + updateHeroSlide existence check

**Problem:**
- `reorderHeroSlides` does N separate UPDATEs with no transaction — partial failure leaves inconsistent state
- `createHeroSlide` SELECT is outside try/catch; sort_order has a race condition
- No server-side validation on `text_align`, `overlay_opacity`, `image_url`
- `updateHeroSlide` silently no-ops if record doesn't exist

**Files:**
- Modify: `lib/actions/admin-hero.ts`

**Step 1: Add shared validation helper and fix createHeroSlide**

Replace the entire file:

```ts
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

const VALID_TEXT_ALIGNS: TextAlign[] = ["left", "center", "right"];

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

  const existing = await db
    .select({ id: hero_slides.id })
    .from(hero_slides)
    .where(eq(hero_slides.id, id));
  if (existing.length === 0) return { error: "Bannière introuvable" };

  try {
    await db
      .update(hero_slides)
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
  const db = getDb();
  try {
    await db
      .update(hero_slides)
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
```

**Step 2: Run tests**

```bash
bun run test tests/lib/actions/admin-hero.test.ts
```
Expected: All existing tests pass (new tests added in Task 7).

**Step 3: Commit**

```bash
git add lib/actions/admin-hero.ts
git commit -m "fix: transaction pour reorderHeroSlides, validation image_url/text_align/opacity, vérif existence updateHeroSlide"
```

---

## Task 5: Fix hero-slide-form.tsx — Spinner Lock + Upload Error Logging

**Problem:**
- `handleSubmit`: if `action(data)` throws, `setSubmitting(false)` is never called → permanent spinner
- `handleFileUpload`: catch block doesn't bind the error → actual reason lost, nothing logged

**Files:**
- Modify: `components/admin/hero-slide-form.tsx`

**Step 1: Fix handleFileUpload (lines 45–64)**

Replace the catch block — bind error and log:

```ts
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setServerError(null);
    try {
      const { uploadUrl, publicUrl } = await generateBannerPresignedUrl(file.name, file.type);
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error(`Upload échoué: ${res.status}`);
      setImageUrl(publicUrl);
    } catch (err) {
      console.error("[HeroSlideForm] handleFileUpload:", err);
      setServerError(
        err instanceof Error ? err.message : "Échec de l'upload de l'image"
      );
    } finally {
      setUploading(false);
    }
  }
```

**Step 2: Fix handleSubmit (lines 66–91)**

Add try/catch/finally so spinner always releases:

```ts
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

    try {
      const result = await action(data);
      if (result?.error) {
        setServerError(result.error);
      }
    } catch (err) {
      console.error("[HeroSlideForm] handleSubmit:", err);
      setServerError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }
```

**Step 3: Run tests**

```bash
bun run test
```
Expected: All tests pass.

**Step 4: Commit**

```bash
git add components/admin/hero-slide-form.tsx
git commit -m "fix: débloquer le spinner en cas d'exception et logger les erreurs d'upload"
```

---

## Task 6: Fix Homepage — Hero Slides Query Crash Resilience

**Problem:** `getActiveHeroSlides` is inside `Promise.all`. A DB error crashes the entire homepage (products and all), even though `HeroFallback` exists for graceful degradation.

**Files:**
- Modify: `app/(main)/page.tsx`

**Step 1: Separate heroSlides from Promise.all (lines 21–25)**

Replace:
```ts
  const [featured, promos, heroSlides] = await Promise.all([
    getProductsByCategory(db, "smartphones", { tri: "nouveau" }),
    getPromoProducts(db, 4),
    getActiveHeroSlides(db),
  ]);
```

With:
```ts
  const [featured, promos] = await Promise.all([
    getProductsByCategory(db, "smartphones", { tri: "nouveau" }),
    getPromoProducts(db, 4),
  ]);
  const heroSlides = await getActiveHeroSlides(db).catch((err: unknown) => {
    console.error("[HomePage] getActiveHeroSlides failed:", err);
    return [];
  });
```

**Step 2: Run tests**

```bash
bun run test
```
Expected: All tests pass.

**Step 3: Commit**

```bash
git add app/(main)/page.tsx
git commit -m "fix: isoler getActiveHeroSlides de Promise.all pour éviter crash homepage"
```

---

## Task 7: Add Missing Tests for admin-hero Actions

**Problem:** `createHeroSlide` and `updateHeroSlide` have zero tests. Auth rejection path is untested on any action. `toggleHeroSlideActive` only tests deactivating.

**Files:**
- Modify: `tests/lib/actions/admin-hero.test.ts`

**Step 1: Add tests**

Add the following describes at the end of the existing file (after the `reorderHeroSlides` describe block). Note: import `createHeroSlide` and `updateHeroSlide` by updating line 48:

```ts
import {
  toggleHeroSlideActive,
  deleteHeroSlide,
  reorderHeroSlides,
  createHeroSlide,
  updateHeroSlide,
} from "@/lib/actions/admin-hero";
```

Then add these describe blocks at the end of the file:

```ts
describe("toggleHeroSlideActive — activation", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    await getDb()
      .insert(schema.hero_slides)
      .values({ ...SLIDE, is_active: false });
  });

  it("active une slide inactive", async () => {
    const result = await toggleHeroSlideActive("slide-1", true);
    expect(result).toEqual({});
    const [row] = await getDb()
      .select()
      .from(schema.hero_slides)
      .where(eq(schema.hero_slides.id, "slide-1"));
    expect(row.is_active).toBe(true);
  });
});

describe("reorderHeroSlides — cas limites", () => {
  beforeEach(() => {
    _testDb = createTestDb();
  });

  it("retourne {} sans erreur pour un tableau vide", async () => {
    const result = await reorderHeroSlides([]);
    expect(result).toEqual({});
  });
});

describe("createHeroSlide", () => {
  const { redirect } = await import("next/navigation");

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
    const rows = await getDb().select().from(schema.hero_slides);
    expect(rows).toHaveLength(1);
    expect(rows[0].sort_order).toBe(0);
    expect(rows[0].title).toBe("Nouvelle bannière");
  });

  it("assigne sort_order = maxOrder + 1 quand des slides existent", async () => {
    await getDb()
      .insert(schema.hero_slides)
      .values([
        { ...SLIDE, id: "s1", sort_order: 0 },
        { ...SLIDE, id: "s2", sort_order: 5 },
      ]);
    await createHeroSlide(VALID_DATA);
    const rows = await getDb()
      .select()
      .from(schema.hero_slides)
      .where(eq(schema.hero_slides.title, "Nouvelle bannière"));
    expect(rows[0].sort_order).toBe(6);
  });

  it("retourne une erreur si le titre est vide", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, title: "  " });
    expect(result).toEqual({ error: "Le titre est requis" });
    const rows = await getDb().select().from(schema.hero_slides);
    expect(rows).toHaveLength(0);
  });

  it("retourne une erreur si l'image est vide", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, image_url: "" });
    expect(result).toEqual({ error: "L'image est requise" });
  });

  it("retourne une erreur si l'image ne commence pas par https://", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, image_url: "http://cdn.example.com/img.jpg" });
    expect(result.error).toBeTruthy();
  });

  it("retourne une erreur si text_align est invalide", async () => {
    const result = await createHeroSlide({
      ...VALID_DATA,
      text_align: "invalid" as "left",
    });
    expect(result.error).toBeTruthy();
  });

  it("retourne une erreur si overlay_opacity est hors plage", async () => {
    const result = await createHeroSlide({ ...VALID_DATA, overlay_opacity: 150 });
    expect(result.error).toBeTruthy();
  });

  it("convertit les champs optionnels vides en null", async () => {
    await createHeroSlide({ ...VALID_DATA, subtitle: "  ", badge: "" });
    const rows = await getDb().select().from(schema.hero_slides);
    expect(rows[0].subtitle).toBeNull();
    expect(rows[0].badge).toBeNull();
  });

  it("appelle redirect après succès", async () => {
    await createHeroSlide(VALID_DATA);
    expect(redirect).toHaveBeenCalledWith("/admin/hero");
  });
});

describe("updateHeroSlide", () => {
  beforeEach(async () => {
    _testDb = createTestDb();
    vi.clearAllMocks();
    await getDb().insert(schema.hero_slides).values(SLIDE);
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
    const [row] = await getDb()
      .select()
      .from(schema.hero_slides)
      .where(eq(schema.hero_slides.id, "slide-1"));
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
  const { requireOrgMember } = await import("@/lib/actions/admin-auth");

  beforeEach(() => {
    _testDb = createTestDb();
  });

  it("ne modifie pas la DB si requireOrgMember rejette", async () => {
    (requireOrgMember as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("UNAUTHORIZED")
    );
    await expect(deleteHeroSlide("slide-1")).rejects.toThrow("UNAUTHORIZED");
    // DB untouched — no slide was inserted but confirm no crash on empty table
    const rows = await getDb().select().from(schema.hero_slides);
    expect(rows).toHaveLength(0);
  });
});
```

**Step 2: Run tests**

```bash
bun run test tests/lib/actions/admin-hero.test.ts
```
Expected: All tests pass.

**Step 3: Commit**

```bash
git add tests/lib/actions/admin-hero.test.ts
git commit -m "test: ajouter tests createHeroSlide, updateHeroSlide, activation toggle, auth rejet"
```

---

## Task 8: Add Missing Tests — getHeroSlide, generateBannerPresignedUrl, Carousel Navigation

### 8a: getHeroSlide tests

**Files:**
- Modify: `tests/lib/data/hero-slides.test.ts`

Add at the end of the file:

```ts
import { getHeroSlide } from "@/lib/data/hero-slides";

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
```

### 8b: generateBannerPresignedUrl test

**Files:**
- Modify: `tests/lib/actions/admin-upload.test.ts` (create if doesn't exist)

Check if it exists first. If it does, add to it. If not, create:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/actions/admin-auth", () => ({
  requireOrgMember: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-url"),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
}));

describe("generateBannerPresignedUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      R2_ACCOUNT_ID: "test-account",
      R2_ACCESS_KEY_ID: "test-key",
      R2_SECRET_ACCESS_KEY: "test-secret",
      R2_BUCKET_NAME: "test-bucket",
      R2_PUBLIC_URL: "https://cdn.dbs-store.ci",
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("retourne uploadUrl et publicUrl avec le préfixe banners/", async () => {
    const { generateBannerPresignedUrl } = await import("@/lib/actions/admin-upload");
    const result = await generateBannerPresignedUrl("photo.jpg", "image/jpeg");
    expect(result.uploadUrl).toBe("https://r2.example.com/signed-url");
    expect(result.publicUrl).toMatch(/^https:\/\/cdn\.dbs-store\.ci\/banners\//);
  });

  it("utilise le préfixe products/ pour generatePresignedUrl", async () => {
    const { generatePresignedUrl } = await import("@/lib/actions/admin-upload");
    const result = await generatePresignedUrl("photo.jpg", "image/jpeg");
    expect(result.publicUrl).toMatch(/^https:\/\/cdn\.dbs-store\.ci\/products\//);
  });

  it("lève une erreur pour un type de fichier non autorisé", async () => {
    const { generateBannerPresignedUrl } = await import("@/lib/actions/admin-upload");
    await expect(
      generateBannerPresignedUrl("script.js", "application/javascript")
    ).rejects.toThrow("Type de fichier non autorisé");
  });

  it("lève une erreur si les variables R2 manquent", async () => {
    delete process.env.R2_PUBLIC_URL;
    const { generateBannerPresignedUrl } = await import("@/lib/actions/admin-upload");
    await expect(
      generateBannerPresignedUrl("photo.jpg", "image/jpeg")
    ).rejects.toThrow("Configuration R2 manquante");
  });
});
```

### 8c: HeroCarousel navigation tests

**Files:**
- Modify: `tests/components/hero/hero-carousel.test.tsx`

Add these tests after the existing `it("affiche les dots...")` test. Requires `userEvent` import:

Add to imports: `import userEvent from "@testing-library/user-event";`

```ts
  it("n'affiche pas les flèches ni les dots avec une seule slide", () => {
    render(<HeroCarousel slides={[makeSlide()]} />);
    expect(screen.queryByRole("button", { name: "Slide suivante" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Slide précédente" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Slide 1" })).toBeNull();
  });

  it("affiche la slide suivante après clic sur la flèche droite", async () => {
    const user = userEvent.setup();
    const slides = [
      makeSlide({ id: "s1", title: "Slide A" }),
      makeSlide({ id: "s2", title: "Slide B" }),
    ];
    render(<HeroCarousel slides={slides} />);
    await user.click(screen.getByRole("button", { name: "Slide suivante" }));
    expect(screen.getByText("Slide B")).toBeDefined();
  });

  it("revient à la dernière slide depuis la première (wrap-around)", async () => {
    const user = userEvent.setup();
    const slides = [
      makeSlide({ id: "s1", title: "Slide A" }),
      makeSlide({ id: "s2", title: "Slide B" }),
    ];
    render(<HeroCarousel slides={slides} />);
    await user.click(screen.getByRole("button", { name: "Slide précédente" }));
    expect(screen.getByText("Slide B")).toBeDefined();
  });

  it("navigue vers la slide correspondant au dot cliqué", async () => {
    const user = userEvent.setup();
    const slides = [
      makeSlide({ id: "s1", title: "Slide A" }),
      makeSlide({ id: "s2", title: "Slide B" }),
      makeSlide({ id: "s3", title: "Slide C" }),
    ];
    render(<HeroCarousel slides={slides} />);
    await user.click(screen.getByRole("button", { name: "Slide 3" }));
    expect(screen.getByText("Slide C")).toBeDefined();
  });
```

**Step: Run tests**

```bash
bun run test tests/lib/data/hero-slides.test.ts tests/components/hero/hero-carousel.test.tsx
```
Expected: All tests pass.

**Step: Commit**

```bash
git add tests/lib/data/hero-slides.test.ts tests/components/hero/hero-carousel.test.tsx
git commit -m "test: ajouter tests getHeroSlide et navigation HeroCarousel"
```

Then commit the upload tests:
```bash
git add tests/lib/actions/admin-upload.test.ts
git commit -m "test: ajouter tests generateBannerPresignedUrl et validation R2"
```

---

## Final Verification

```bash
bun run test
```
Expected: All tests pass with no failures.

```bash
bun run lint
```
Note: ~16 pre-existing ESLint errors exist (see CLAUDE.md). Verify no NEW errors introduced.

```bash
bun run build
```
Expected: Build succeeds.
