# Banner live preview + upload-only — Design

**Date:** 2026-06-01
**Status:** Approved
**Scope:** Admin hero/banner creation & edition form

## Problem

The banner (hero slide) form currently exposes a URL/Upload toggle defaulting to a
raw `https://` URL text input, and shows only a small static preview (background
image + overlay). We want to:

1. Remove the image URL field — images are added by file upload only.
2. Add a faithful live preview that mirrors how the slide actually renders on the
   homepage `HeroCarousel`, updating in real time as the admin edits the form.

Inspired by the `kkzakaria/netereka` project (`banner-form.tsx` + `banner-preview.tsx`):
upload-only with instant `URL.createObjectURL` preview, and a sticky live preview
component fed by controlled form state.

## Approach

DBS hero slides use a **background image + color overlay** (not a gradient like
netereka), so the preview is a **faithful WYSIWYG miniature** of a single
`HeroCarousel` slide rather than netereka's glass-card gradient style.

### 1. New component `components/admin/hero-slide-preview.tsx`

Pure presentational component (controlled props, no internal state). Reuses the
exact class maps from `HeroCarousel` (`ALIGN_CLASSES`, `CTA_JUSTIFY`, badge pill,
white text shades) at reduced scale inside a cinematic-ratio box
(`aspect-[16/7]`, rounded corners, border).

- **Props:** `title, subtitle, badge, imageUrl, textAlign, overlayColor,
  overlayOpacity, ctaPrimaryLabel, ctaSecondaryLabel`.
- **Render:** background image (`object-cover`) + overlay (color/opacity) +
  content (badge pill, title, subtitle, CTA buttons rendered as styled
  non-clickable `<span>`s). Reduced typography (`text-xl`/`text-2xl`).
- **Empty state:** when no image, a `muted` placeholder ("Aucune image") so the
  zone stays visible.

### 2. Refactor `components/admin/hero-slide-form.tsx`

- **Remove:** `imageMode` state, the URL/Upload toggle, the URL `<Input>`, the
  `LinkIcon` import, and the old inline preview block.
- **Polished upload:** hidden file input + `ref`; a styled "Ajouter une image" /
  "Changer l'image" button. On file select:
  1. instant preview via `URL.createObjectURL(file)` (blob) → local `imageUrl`;
  2. presigned upload in the background (current logic preserved); on success,
     replace the blob with the `https` `publicUrl` and `revokeObjectURL` the blob
     (memory cleanup).
- **Sticky preview:** `<HeroSlidePreview>` at the top of the form in a
  `sticky top-0` container, fed by the already-controlled state. Live updates.
- Validation unchanged: submit disabled while uploading; `image_url` (https
  `publicUrl`) required — so submission is impossible until the blob is replaced
  by the real URL.

### 3. No server/DB changes

`admin-hero.ts`, the schema, and validation (`image_url` required + `https://`)
stay identical. The blob is purely client-side; submission always uses the
`publicUrl`. This works for both creation and edition (`hero/[id]`), which share
this form.

### 4. Tests

Unit tests for `HeroSlidePreview`: renders title/badge/CTA, shows placeholder
when no image, applies text alignment and overlay styles.

## Layout decision

Keep the form as a single `max-w-2xl` column with the sticky preview on top
(rather than netereka's 2-column + Cards layout), to stay consistent with the
current DBS form style.

## Out of scope

- Gradient backgrounds, price/badge-color fields (netereka-specific).
- Deferred-upload flow (create-then-attach) — DBS uploads immediately.
- Server-side, schema, or carousel rendering changes.
