# R2 Binding Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace presigned-S3 image upload with the idiomatic Cloudflare R2 **binding** so uploads work in `bun run dev` with no credentials (miniflare local simulation), starting with banners then products.

**Architecture:** Uploads go through a server action that receives the `File` and calls `env.MEDIA.put(key, body)` via `getCloudflareContext()`. Objects are read back through a same-origin Next route handler `GET /api/media/[...key]` that streams `env.MEDIA.get(key)`. The stored `image_url` becomes a same-origin path `/api/media/<key>`, environment-agnostic (local sim in dev, real bucket in prod), removing the dependency on presigned URLs and the `cdn.dbs-store.ci` custom domain.

**Tech Stack:** Next.js 16 App Router, `@opennextjs/cloudflare` (`getCloudflareContext`), Cloudflare R2 binding, `@cloudflare/workers-types` (`R2Bucket`), Vitest + React Testing Library.

---

## Background & key facts (read before starting)

- `getDb()` in `lib/db/index.ts` shows the binding-access pattern: in `bun run dev` it uses better-sqlite3, otherwise `await getCloudflareContext<CloudflareEnv>()` then `env.DB`. For R2 we always use `getCloudflareContext()` — `initOpenNextCloudflareForDev()` (already in `next.config.ts`) provides a **miniflare local R2 simulation** in `next dev`, so no credentials are needed.
- `next/image` renders banner images in `components/hero/hero-carousel.tsx` via `<Image src={s.image_url} fill />`. A same-origin path like `/api/media/banners/...` needs **no** `remotePatterns` entry.
- Existing product images are stored as absolute `https://cdn.dbs-store.ci/...` URLs and stay valid (the `cdn.dbs-store.ci` remotePattern remains). Only **new** uploads use the binding/route.
- Banner `image_url` validation currently requires `https://` (`lib/actions/admin-hero.ts` `validateSlideData`). It must accept the new `/api/media/` path.
- The custom Worker entry `worker/index.ts` wraps the OpenNext worker; Next route handlers run inside it and can call `getCloudflareContext()`.
- **`bucket_name` caveat:** wrangler needs a real bucket name. For local dev miniflare auto-creates it. For prod it must match the actual R2 bucket currently served by `cdn.dbs-store.ci`. Use `dbs-store-media` as a placeholder and **confirm/replace with the real bucket name before deploying** (see Task 1).

## File Structure

- Modify `wrangler.jsonc` — add `r2_buckets` binding `MEDIA`.
- Modify `worker-configuration.d.ts` — add `MEDIA: R2Bucket` to `CloudflareEnv`.
- Modify `lib/r2.ts` — add `mediaKey()` + `putMedia()` helpers (binding-based); keep `sanitizeFilename`.
- Create `app/api/media/[...key]/route.ts` — same-origin read route streaming from the binding.
- Modify `lib/actions/admin-upload.ts` — add `uploadBannerImage(formData)`; (Phase 3) remove presigned fns.
- Modify `lib/actions/admin-hero.ts` — relax `image_url` validation to accept `/api/media/` paths.
- Modify `components/admin/hero-slide-form.tsx` — upload via server action + FormData, keep blob preview.
- Modify `tests/lib/actions/admin-upload.test.ts`, `tests/components/admin/hero-slide-form.test.tsx`; create `tests/lib/actions/upload-banner-image.test.ts`, `tests/app/api/media-route.test.ts`.
- **Phase 2 (products):** Modify `components/admin/image-uploader.tsx`, add `uploadProductImage`.
- **Phase 3 (cleanup):** Remove presigned code from `lib/r2.ts`/`lib/actions/admin-upload.ts`, drop `R2_*` env vars + `@aws-sdk/*` deps.

---

## Phase 1 — Banners

### Task 1: Add the R2 binding to wrangler config and env types

**Files:**
- Modify: `wrangler.jsonc` (after the `d1_databases` block)
- Modify: `worker-configuration.d.ts`

- [ ] **Step 1: Add the `r2_buckets` binding to `wrangler.jsonc`**

Insert after the `d1_databases` array (keep valid JSONC, mind the trailing comma):

```jsonc
  "r2_buckets": [
    {
      "binding": "MEDIA",
      // TODO(before deploy): replace with the real bucket name currently
      // served by cdn.dbs-store.ci. Local dev (miniflare) auto-creates it.
      "bucket_name": "dbs-store-media"
    }
  ],
```

- [ ] **Step 2: Add the binding to the `CloudflareEnv` type**

In `worker-configuration.d.ts`, add inside `interface CloudflareEnv`:

```ts
  MEDIA: R2Bucket;
```

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit`
Expected: no new errors (`R2Bucket` resolves from `@cloudflare/workers-types`; if it does not, add `import type { R2Bucket } from "@cloudflare/workers-types";` is NOT needed for an ambient `.d.ts` — instead verify `@cloudflare/workers-types` is in `tsconfig` `types`/`compilerOptions`; it already powers `D1Database`/`Queue` in this same file, so `R2Bucket` is available).

- [ ] **Step 4: Commit**

```bash
git add wrangler.jsonc worker-configuration.d.ts
git commit -m "feat: add R2 MEDIA binding for image uploads"
```

---

### Task 2: Add `mediaKey()` + `putMedia()` helpers

**Files:**
- Modify: `lib/r2.ts`
- Test: `tests/lib/r2.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

Create/append `tests/lib/r2.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mediaKey, putMedia } from "@/lib/r2";

describe("mediaKey", () => {
  it("préfixe la clé et conserve un nom de fichier assaini", () => {
    const key = mediaKey("banners", "Mon Image (1).JPG");
    expect(key).toMatch(/^banners\/\d+-[a-z0-9]+-Mon-Image-1-.JPG$|^banners\/\d+-[a-z0-9]+-Mon-Image-1.JPG$/);
    expect(key.startsWith("banners/")).toBe(true);
  });
});

describe("putMedia", () => {
  it("écrit dans le bucket et renvoie la clé + le chemin /api/media", async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    const bucket = { put } as unknown as R2Bucket;
    const body = new ArrayBuffer(4);

    const result = await putMedia(bucket, "banners", "photo.png", "image/png", body);

    expect(put).toHaveBeenCalledTimes(1);
    const [calledKey, calledBody, opts] = put.mock.calls[0];
    expect(calledKey).toBe(result.key);
    expect(calledBody).toBe(body);
    expect(opts).toEqual({ httpMetadata: { contentType: "image/png" } });
    expect(result.key.startsWith("banners/")).toBe(true);
    expect(result.path).toBe(`/api/media/${result.key}`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/lib/r2.test.ts`
Expected: FAIL — `mediaKey`/`putMedia` are not exported from `@/lib/r2`.

- [ ] **Step 3: Implement the helpers**

Append to `lib/r2.ts` (keep existing exports for now; `sanitizeFilename` already exists):

```ts
/** Construit une clé d'objet R2 unique et sûre, préfixée par un dossier logique. */
export function mediaKey(keyPrefix: string, filename: string): string {
  const safeName = sanitizeFilename(filename);
  return `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
}

/**
 * Écrit un objet dans le bucket R2 (binding) et renvoie sa clé et son chemin
 * same-origin servi par `app/api/media/[...key]/route.ts`.
 * Le caller DOIT avoir vérifié l'autorisation et le contentType avant d'appeler.
 */
export async function putMedia(
  bucket: R2Bucket,
  keyPrefix: string,
  filename: string,
  contentType: string,
  body: ArrayBuffer | ReadableStream | Blob
): Promise<{ key: string; path: string }> {
  const key = mediaKey(keyPrefix, filename);
  await bucket.put(key, body, { httpMetadata: { contentType } });
  return { key, path: `/api/media/${key}` };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/lib/r2.test.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add lib/r2.ts tests/lib/r2.test.ts
git commit -m "feat: add R2 binding helpers mediaKey/putMedia"
```

---

### Task 3: Add the `uploadBannerImage` server action

**Files:**
- Modify: `lib/actions/admin-upload.ts`
- Test: `tests/lib/actions/upload-banner-image.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/actions/upload-banner-image.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireOrgMember, mockGetContext, putMock } = vi.hoisted(() => ({
  mockRequireOrgMember: vi.fn().mockResolvedValue(undefined),
  mockGetContext: vi.fn(),
  putMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/actions/admin-auth", () => ({ requireOrgMember: mockRequireOrgMember }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetContext }));

import { uploadBannerImage } from "@/lib/actions/admin-upload";

function form(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.append("file", file);
  return fd;
}

describe("uploadBannerImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOrgMember.mockResolvedValue(undefined);
    mockGetContext.mockResolvedValue({ env: { MEDIA: { put: putMock } } });
  });

  it("lève UNAUTHORIZED si pas membre org", async () => {
    mockRequireOrgMember.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    await expect(uploadBannerImage(form(new File(["x"], "a.png", { type: "image/png" })))).rejects.toThrow("UNAUTHORIZED");
  });

  it("retourne une erreur si aucun fichier", async () => {
    const res = await uploadBannerImage(form(null));
    expect(res.error).toBeDefined();
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejette un type de fichier non autorisé", async () => {
    const res = await uploadBannerImage(form(new File(["x"], "a.js", { type: "application/javascript" })));
    expect(res.error).toMatch(/type/i);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("écrit dans MEDIA et renvoie un chemin /api/media/banners/", async () => {
    const res = await uploadBannerImage(form(new File(["x"], "promo.png", { type: "image/png" })));
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(res.path).toMatch(/^\/api\/media\/banners\//);
    expect(res.error).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/lib/actions/upload-banner-image.test.ts`
Expected: FAIL — `uploadBannerImage` not exported.

- [ ] **Step 3: Implement the action**

In `lib/actions/admin-upload.ts`, add imports at the top and the new function. Keep existing presigned functions for now (products still use them).

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { putMedia } from "@/lib/r2";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function uploadBannerImage(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  await requireOrgMember();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier fourni" };
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return { error: `Type de fichier non autorisé: ${file.type}` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Fichier trop volumineux (max 5 Mo)" };
  }

  const { env } = await getCloudflareContext<CloudflareEnv>();
  const { path } = await putMedia(env.MEDIA, "banners", file.name, file.type, await file.arrayBuffer());
  return { path };
}
```

Note: `ALLOWED_CONTENT_TYPES` is already imported in this file from `@/lib/r2`. If not, add it to the existing import.

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/lib/actions/upload-banner-image.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/actions/admin-upload.ts tests/lib/actions/upload-banner-image.test.ts
git commit -m "feat: add uploadBannerImage server action using R2 binding"
```

---

### Task 4: Add the same-origin media read route

**Files:**
- Create: `app/api/media/[...key]/route.ts`
- Test: `tests/app/api/media-route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/app/api/media-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetContext, getMock } = vi.hoisted(() => ({
  mockGetContext: vi.fn(),
  getMock: vi.fn(),
}));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetContext }));

import { GET } from "@/app/api/media/[...key]/route";

function ctx(key: string[]) {
  return { params: Promise.resolve({ key }) };
}

describe("GET /api/media/[...key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockResolvedValue({ env: { MEDIA: { get: getMock } } });
  });

  it("404 pour un préfixe non autorisé", async () => {
    const res = await GET(new Request("http://x/api/media/secret/x"), ctx(["secret", "x"]));
    expect(res.status).toBe(404);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("404 si l'objet est absent", async () => {
    getMock.mockResolvedValueOnce(null);
    const res = await GET(new Request("http://x/api/media/banners/x.png"), ctx(["banners", "x.png"]));
    expect(res.status).toBe(404);
  });

  it("200 + content-type + cache long quand l'objet existe", async () => {
    getMock.mockResolvedValueOnce({
      body: new ReadableStream(),
      httpEtag: '"abc"',
      writeHttpMetadata: (h: Headers) => h.set("content-type", "image/png"),
    });
    const res = await GET(new Request("http://x/api/media/banners/x.png"), ctx(["banners", "x.png"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(getMock).toHaveBeenCalledWith("banners/x.png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/app/api/media-route.test.ts`
Expected: FAIL — route module does not exist.

- [ ] **Step 3: Implement the route**

Create `app/api/media/[...key]/route.ts`:

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare bindings are unavailable at build-time prerender.
export const dynamic = "force-dynamic";

// Seuls les objets uploadés par l'admin sont servis (clés non devinables).
const ALLOWED_PREFIXES = ["banners/", "products/"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
): Promise<Response> {
  const { key: parts } = await params;
  const key = parts.join("/");

  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) {
    return new Response("Not found", { status: 404 });
  }

  const { env } = await getCloudflareContext<CloudflareEnv>();
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/app/api/media-route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add "app/api/media/[...key]/route.ts" tests/app/api/media-route.test.ts
git commit -m "feat: serve uploaded media from R2 binding via /api/media route"
```

---

### Task 5: Accept `/api/media/` paths in banner validation

**Files:**
- Modify: `lib/actions/admin-hero.ts:30-39` (`validateSlideData`)
- Test: `tests/lib/actions/admin-hero.test.ts` (append; if absent, create with the existing mock style)

- [ ] **Step 1: Write the failing test**

Append to the hero actions test (mirror the existing setup in `tests/lib/actions/`; if no file exists, create `tests/lib/actions/admin-hero-validation.test.ts` testing `createHeroSlide` returns no validation error for a `/api/media/...` image). Minimal direct approach — extract and test the validator is overkill; instead assert via `createHeroSlide` that an `/api/media/` path is accepted and a bare `foo` is rejected. Use the existing DB mock pattern from `tests/lib/actions/admin-hero.test.ts` if present. Concretely add:

```ts
it("accepte une image servie par /api/media/", async () => {
  // Arrange: requireOrgMember resolves, db mocked to no active slides + insert ok (see existing setup)
  const res = await createHeroSlide({
    title: "T", image_url: "/api/media/banners/123-abc-x.png",
    text_align: "center", overlay_color: "#000000", overlay_opacity: 40, is_active: false,
  });
  expect(res.error).toBeUndefined();
});

it("rejette une image_url qui n'est ni https ni /api/media/", async () => {
  const res = await createHeroSlide({
    title: "T", image_url: "javascript:alert(1)",
    text_align: "center", overlay_color: "#000000", overlay_opacity: 40, is_active: false,
  });
  expect(res.error).toBeDefined();
});
```

If a hero actions test with DB mocks does not already exist, do NOT hand-roll a fragile DB mock here — instead refactor `validateSlideData` to be exported and unit-test it directly:

```ts
import { validateSlideData } from "@/lib/actions/admin-hero";
it("accepte /api/media/ et https, rejette le reste", () => {
  const base = { title: "T", text_align: "center", overlay_color: "#000", overlay_opacity: 40, is_active: false } as const;
  expect(validateSlideData({ ...base, image_url: "/api/media/banners/x.png" })).toBeNull();
  expect(validateSlideData({ ...base, image_url: "https://cdn.dbs-store.ci/x.png" })).toBeNull();
  expect(validateSlideData({ ...base, image_url: "ftp://x" })).not.toBeNull();
});
```

(Prefer this exported-validator approach — it is deterministic and matches the function being changed.)

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/lib/actions/admin-hero-validation.test.ts`
Expected: FAIL — either `validateSlideData` is not exported, or `/api/media/` is rejected by the current `startsWith("https://")` check.

- [ ] **Step 3: Implement the change**

In `lib/actions/admin-hero.ts`, export the validator and relax the image rule. Replace the two image lines in `validateSlideData`:

```ts
export function validateSlideData(data: HeroSlideFormData): { error: string } | null {
  if (!data.title.trim()) return { error: "Le titre est requis" };
  const img = data.image_url.trim();
  if (!img) return { error: "L'image est requise" };
  // Image servie par le binding R2 (/api/media/...) ou URL externe https héritée.
  if (!img.startsWith("/api/media/") && !img.startsWith("https://")) {
    return { error: "Image invalide" };
  }
  if (!VALID_TEXT_ALIGNS.includes(data.text_align)) return { error: "Alignement de texte invalide" };
  if (data.overlay_opacity < 0 || data.overlay_opacity > 100)
    return { error: "L'opacité doit être entre 0 et 100" };
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run tests/lib/actions/admin-hero-validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full hero action suite to confirm no regression**

Run: `bunx vitest run tests/lib/actions/`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/actions/admin-hero.ts tests/lib/actions/admin-hero-validation.test.ts
git commit -m "feat: accept /api/media paths in banner image validation"
```

---

### Task 6: Switch the banner form to server-action upload

**Files:**
- Modify: `components/admin/hero-slide-form.tsx`
- Modify: `tests/components/admin/hero-slide-form.test.tsx`

- [ ] **Step 1: Update the form test (RED)**

Replace the `admin-upload` mock and add a behavior test in `tests/components/admin/hero-slide-form.test.tsx`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi.fn().mockResolvedValue({ path: "/api/media/banners/123-x.png" }),
}));
vi.mock("@/lib/actions/admin-upload", () => ({ uploadBannerImage: uploadMock }));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";

const noop = vi.fn().mockResolvedValue({});

beforeEach(() => vi.clearAllMocks());

describe("HeroSlideForm", () => {
  it("ne propose plus de champ URL d'image", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.queryByPlaceholderText("https://...")).toBeNull();
  });

  it("affiche un bouton d'ajout d'image (upload)", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.getByRole("button", { name: /ajouter une image/i })).toBeDefined();
  });

  it("affiche l'aperçu live de la bannière", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.getByText("Aperçu")).toBeDefined();
  });

  it("appelle uploadBannerImage quand un fichier est choisi", async () => {
    const { container } = render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "promo.png", { type: "image/png" });
    await userEvent.upload(input, file);
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    const fd = uploadMock.mock.calls[0][0] as FormData;
    expect(fd.get("file")).toBeInstanceOf(File);
  });
});
```

Note: jsdom does not implement `URL.createObjectURL`/`revokeObjectURL`. Add stubs in `tests/setup.ts` (Step 2) so the blob preview path does not throw.

- [ ] **Step 2: Stub object URL APIs in test setup**

Append to `tests/setup.ts`:

```ts
// jsdom n'implémente pas les object URLs — stub pour les aperçus d'upload.
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = () => "blob:mock";
  URL.revokeObjectURL = () => {};
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bunx vitest run tests/components/admin/hero-slide-form.test.tsx`
Expected: FAIL — `uploadBannerImage` export is mocked but the form still imports `generateBannerPresignedUrl`; the "appelle uploadBannerImage" test fails.

- [ ] **Step 4: Implement the form change**

In `components/admin/hero-slide-form.tsx`:

1. Replace the import:
```ts
import { uploadBannerImage } from "@/lib/actions/admin-upload";
```
2. Replace the body of `handleFileUpload` (keep the instant blob preview, swap the presigned block for the server action):
```ts
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aperçu instantané via blob, le temps que l'upload se fasse.
    revokeBlob();
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);

    setUploading(true);
    setServerError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { path, error } = await uploadBannerImage(fd);
      if (error || !path) throw new Error(error ?? "Échec de l'upload de l'image");
      setImageUrl(path);
      setPreviewUrl(path);
      revokeBlob();
    } catch (err) {
      console.error("[HeroSlideForm] handleFileUpload:", err);
      setServerError(err instanceof Error ? err.message : "Échec de l'upload de l'image");
      revokeBlob();
      setPreviewUrl(imageUrl || null);
    } finally {
      setUploading(false);
    }
  }
```

(The `revokeBlob`, `blobUrlRef`, `previewUrl`, and the unmount cleanup `useEffect` already exist from the live-preview work — leave them unchanged.)

- [ ] **Step 5: Run test to verify it passes**

Run: `bunx vitest run tests/components/admin/hero-slide-form.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Lint + typecheck the changed files**

Run: `bunx eslint components/admin/hero-slide-form.tsx lib/actions/admin-upload.ts "app/api/media/[...key]/route.ts" && bunx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/admin/hero-slide-form.tsx tests/components/admin/hero-slide-form.test.tsx tests/setup.ts
git commit -m "feat: upload banner image via R2-binding server action"
```

---

### Task 7: Manual verification in `bun run dev`

**Files:** none (manual).

- [ ] **Step 1: Start the dev server**

Run: `bun run dev` (port 33000). Ensure `bun run db:migrate:dev && bun run db:seed:categories` have been run.

- [ ] **Step 2: Create a banner with an uploaded image**

Go to `/admin/hero/nouveau`, fill the title, click "Ajouter une image", pick a local image.
Expected: instant blob preview, then the live preview keeps showing the image (now via `/api/media/banners/...`), no "Configuration R2 manquante" error.

- [ ] **Step 3: Save and confirm it renders on the homepage**

Submit, mark active, open `/`.
Expected: the hero carousel shows the uploaded image (served by `GET /api/media/banners/...` from the miniflare local R2 sim).

- [ ] **Step 4: Confirm persistence across reload**

Reload `/admin/hero` and edit the slide.
Expected: the image still displays (read from the binding), proving it is not just the in-memory blob.

---

## Phase 2 — Products (consistency)

### Task 8: Add `uploadProductImage` and migrate the product uploader

**Files:**
- Modify: `lib/actions/admin-upload.ts` (add `uploadProductImage`, mirror Task 3 with prefix `"products"`)
- Modify: `components/admin/image-uploader.tsx`
- Test: extend `tests/lib/actions/upload-banner-image.test.ts` or add `tests/lib/actions/upload-product-image.test.ts` (same structure, asserts `/api/media/products/` prefix)

- [ ] **Step 1: Write the failing test for `uploadProductImage`**

Create `tests/lib/actions/upload-product-image.test.ts` — identical structure to Task 3's test, but import `uploadProductImage` and assert `res.path` matches `/^\/api\/media\/products\//`.

- [ ] **Step 2: Run it to verify it fails**

Run: `bunx vitest run tests/lib/actions/upload-product-image.test.ts`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement `uploadProductImage`**

In `lib/actions/admin-upload.ts`, add (mirrors `uploadBannerImage`, prefix `"products"`):

```ts
export async function uploadProductImage(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  await requireOrgMember();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier fourni" };
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return { error: `Type de fichier non autorisé: ${file.type}` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Fichier trop volumineux (max 5 Mo)" };
  }
  const { env } = await getCloudflareContext<CloudflareEnv>();
  const { path } = await putMedia(env.MEDIA, "products", file.name, file.type, await file.arrayBuffer());
  return { path };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bunx vitest run tests/lib/actions/upload-product-image.test.ts`
Expected: PASS.

- [ ] **Step 5: Migrate `image-uploader.tsx` to the server action**

Replace the `generatePresignedUrl` import with `uploadProductImage`, and in `handleFiles` replace the presigned PUT block per file with:

```ts
        const fd = new FormData();
        fd.append("file", file);
        const { path, error } = await uploadProductImage(fd);
        if (error || !path) throw new Error(error ?? `Upload failed`);
        uploaded.push(path);
```

- [ ] **Step 6: Run the related component tests**

Run: `bunx vitest run tests/components/admin/`
Expected: PASS. Update any test that mocked `generatePresignedUrl` to mock `uploadProductImage` instead.

- [ ] **Step 7: Commit**

```bash
git add lib/actions/admin-upload.ts components/admin/image-uploader.tsx tests/lib/actions/upload-product-image.test.ts tests/components/admin/
git commit -m "feat: migrate product image upload to R2 binding"
```

---

## Phase 3 — Cleanup (remove presigned/S3)

### Task 9: Remove presigned code, S3 deps, and dead R2 env vars

**Files:**
- Modify: `lib/r2.ts` (remove `getR2Config`, `createR2Client`, `createPresignedUpload`)
- Modify: `lib/actions/admin-upload.ts` (remove `generatePresignedUrl`, `generateBannerPresignedUrl`)
- Modify: `tests/lib/actions/admin-upload.test.ts` (remove presigned tests)
- Modify: `worker-configuration.d.ts` (remove `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET_NAME`/`R2_PUBLIC_URL` if unused elsewhere)
- Modify: `.env.example` (drop the R2 S3 block)
- Modify: `package.json` (remove `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` if no other importers)

- [ ] **Step 1: Confirm no remaining importers**

Run: `grep -rn "generatePresignedUrl\|generateBannerPresignedUrl\|createPresignedUpload\|@aws-sdk" app/ components/ lib/ tests/`
Expected: only the files listed above. If anything else appears, migrate it first.

- [ ] **Step 2: Delete the presigned functions and their tests**

Remove the named exports above and the corresponding `describe` blocks in `tests/lib/actions/admin-upload.test.ts`. If that file becomes empty, delete it.

- [ ] **Step 3: Remove S3 deps**

Run: `bun remove @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

- [ ] **Step 4: Drop the R2 S3 env block from `.env.example` and unused `R2_*` keys from `worker-configuration.d.ts`**

(Keep nothing referencing `process.env.R2_*` — verify with `grep -rn "R2_" lib/ app/ worker*`.)

- [ ] **Step 5: Full verification**

Run: `bun run test && bunx tsc --noEmit && bun run lint`
Expected: tests PASS; no new TS errors; lint shows only the pre-existing warnings documented in CLAUDE.md.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove presigned S3 upload path and unused R2 credentials"
```

---

## Self-Review notes

- **Spec coverage:** binding write (Task 3/8), binding read (Task 4), local-dev-no-creds (Task 1 + verified Task 7), drop presigned/custom-domain (Task 9), banner form upload-only + live preview already shipped and updated (Task 6). ✓
- **Type consistency:** `putMedia(bucket, prefix, filename, contentType, body) → { key, path }` used identically in Tasks 2/3/8. `image_url` stored as `path` (`/api/media/<key>`) and accepted by `validateSlideData` (Task 5). Route reads `env.MEDIA.get(key)` with the same `banners/`,`products/` prefixes written by `mediaKey`. ✓
- **Deploy caveat surfaced:** `bucket_name` placeholder must be replaced with the real prod bucket (Task 1). ✓
- **Risk:** prod image reads now go through the Worker (`/api/media`) instead of the CDN domain; mitigated by `Cache-Control: immutable`. Pure-CDN optimization is a possible future follow-up, out of scope here.
