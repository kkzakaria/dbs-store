# Hide "Offres" Feature – Design Spec

**Date:** 2026-05-28  
**Status:** Pending Implementation  
**Branch:** `feat/add-cursor-pointer-buttons`

## Overview

Temporarily hide the "Offres" (Offers/Promotions) feature from the application. The feature page and menu links will be removed/disabled until it's ready for full implementation.

## Changes Required

### 1. Menu Links – Desktop Navigation
**File:** `components/layout/app-bar/desktop-nav.tsx` (lines 128–133)

Comment out the hardcoded "Offres" link in the desktop navbar:
```tsx
// TODO: Re-enable when "Offres" feature is ready for launch
// <Link
//   href="/offres"
//   className="rounded-full px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-muted"
// >
//   Offres
// </Link>
```

The `offres` slug filtering on line 82 can remain as-is (it already excludes the category from dynamic nav).

### 2. Menu Links – Mobile Navigation
**File:** `components/layout/app-bar/mobile-menu.tsx` (lines 87–93)

Comment out the hardcoded "Offres & Promotions" link in the mobile menu:
```tsx
// TODO: Re-enable when "Offres" feature is ready for launch
// <Link
//   href="/offres"
//   className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-4 text-base font-medium text-red-600 transition-colors hover:bg-red-100"
//   onClick={handleClose}
// >
//   Offres &amp; Promotions
// </Link>
```

The `offres` slug filtering on line 19 can remain as-is.

### 3. Route – Disable /offres Page
**File:** `app/(main)/offres/page.tsx`

Replace the entire file with a 404 redirect or minimal placeholder:
```tsx
import { notFound } from "next/navigation";

// TODO: Re-enable when "Offres" feature is ready for launch
export default function OffresPage() {
  notFound();
}
```

This ensures direct URL access (`/offres`) returns 404 instead of displaying the page.

### 4. Tests – Update Menu Component Tests
**Files:**
- `tests/components/layout/app-bar/desktop-nav.test.tsx`
- `tests/components/layout/app-bar/mobile-menu.test.tsx`

Update tests that verify "Offres" link presence:
- In `desktop-nav.test.tsx`: Remove or comment out the assertion checking for the "Offres" link
- In `mobile-menu.test.tsx`: Remove or comment out the assertion checking for "Offres & Promotions" link
- Add a TODO comment explaining why it's disabled

## Implementation Notes

- All changes use `// TODO: Re-enable when "Offres" feature is ready for launch` comments for consistency
- The database category for "offres" remains intact (no migrations needed)
- The feature can be re-enabled by uncommenting code in a future branch
- No environment variables or feature flags are required

## Validation Checklist

- [ ] Desktop nav link commented out
- [ ] Mobile nav link commented out
- [ ] `/offres` route returns 404
- [ ] Tests updated (no failures related to "Offres")
- [ ] App builds successfully (`bun run build`)
- [ ] Tests pass (`bun run test`)
- [ ] Manual verification: menus no longer show "Offres", direct `/offres` URL returns 404

## Future Re-enablement

To re-enable the feature:
1. Uncomment the hardcoded links in `desktop-nav.tsx` and `mobile-menu.tsx`
2. Restore the original `app/(main)/offres/page.tsx` implementation
3. Restore test assertions
4. Remove TODO comments
