# Hide "Offres" Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the "Offres" menu links and disable the `/offres` route until the feature is ready for launch.

**Architecture:** Comment out hardcoded menu links in both desktop and mobile navigation components, replace the Offres page with a 404 handler, and update related tests to reflect the hidden state. All changes include TODO comments explaining they will be re-enabled later.

**Tech Stack:** Next.js, React, TypeScript, Vitest + React Testing Library

---

## Task 1: Comment Out Desktop Navigation Link

**Files:**
- Modify: `components/layout/app-bar/desktop-nav.tsx:128-133`

- [ ] **Step 1: Open the file and locate the hardcoded "Offres" link**

Run: `cat /home/super/Codes/dbs-store/components/layout/app-bar/desktop-nav.tsx | sed -n '125,135p'`

Expected: Shows the Link component with href="/offres" and text "Offres"

- [ ] **Step 2: Comment out the hardcoded Offres link with TODO**

Replace lines 128-133 with:

```tsx
      {/* TODO: Re-enable when "Offres" feature is ready for launch */}
      {/* <Link
        href="/offres"
        className="rounded-full px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-muted"
      >
        Offres
      </Link> */}
```

- [ ] **Step 3: Verify the file syntax is correct**

Run: `bun run lint -- components/layout/app-bar/desktop-nav.tsx`

Expected: No new errors introduced (pre-existing errors are OK per CLAUDE.md)

- [ ] **Step 4: Commit**

```bash
cd /home/super/Codes/dbs-store
git add components/layout/app-bar/desktop-nav.tsx
git commit -m "feat: hide Offres link from desktop navigation"
```

---

## Task 2: Comment Out Mobile Navigation Link

**Files:**
- Modify: `components/layout/app-bar/mobile-menu.tsx:87-93`

- [ ] **Step 1: Open the file and locate the hardcoded "Offres & Promotions" link**

Run: `cat /home/super/Codes/dbs-store/components/layout/app-bar/mobile-menu.tsx | sed -n '84,96p'`

Expected: Shows the Link component with href="/offres" and text "Offres &amp; Promotions"

- [ ] **Step 2: Comment out the hardcoded Offres & Promotions link with TODO**

Replace lines 87-93 with:

```tsx
            {/* TODO: Re-enable when "Offres" feature is ready for launch */}
            {/* <Link
              href="/offres"
              className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-4 text-base font-medium text-red-600 transition-colors hover:bg-red-100"
              onClick={handleClose}
            >
              Offres &amp; Promotions
            </Link> */}
```

- [ ] **Step 3: Verify the file syntax is correct**

Run: `bun run lint -- components/layout/app-bar/mobile-menu.tsx`

Expected: No new errors introduced

- [ ] **Step 4: Commit**

```bash
cd /home/super/Codes/dbs-store
git add components/layout/app-bar/mobile-menu.tsx
git commit -m "feat: hide Offres link from mobile navigation"
```

---

## Task 3: Disable /offres Route with 404

**Files:**
- Modify: `app/(main)/offres/page.tsx`

- [ ] **Step 1: Read the current file to understand its structure**

Run: `head -20 /home/super/Codes/dbs-store/app/\(main\)/offres/page.tsx`

Expected: Shows the current Offres page component

- [ ] **Step 2: Replace entire file with notFound() placeholder**

Replace entire content with:

```tsx
import { notFound } from "next/navigation";

// TODO: Re-enable when "Offres" feature is ready for launch
export default function OffresPage() {
  notFound();
}
```

- [ ] **Step 3: Verify the file is syntactically correct**

Run: `bun run lint -- app/\(main\)/offres/page.tsx`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd /home/super/Codes/dbs-store
git add app/\(main\)/offres/page.tsx
git commit -m "feat: disable /offres route with 404"
```

---

## Task 4: Update Desktop Navigation Tests

**Files:**
- Modify: `tests/components/layout/app-bar/desktop-nav.test.tsx`

- [ ] **Step 1: Find tests that assert the presence of "Offres" link**

Run: `grep -n "Offres" /home/super/Codes/dbs-store/tests/components/layout/app-bar/desktop-nav.test.tsx`

Expected: Shows line numbers where "Offres" text is tested

- [ ] **Step 2: Comment out the "Offres" assertion**

Locate the test that checks for the "Offres" link (likely using `expect(screen.getByText("Offres"))`). Add a comment before it explaining it's disabled:

```tsx
// TODO: Re-enable assertion when "Offres" feature is ready for launch
// expect(screen.getByText("Offres")).toBeInTheDocument();
```

- [ ] **Step 3: Verify tests still pass for other items**

Run: `bun run test -- tests/components/layout/app-bar/desktop-nav.test.tsx`

Expected: Tests pass (the "Offres" test may be skipped/commented out)

- [ ] **Step 4: Commit**

```bash
cd /home/super/Codes/dbs-store
git add tests/components/layout/app-bar/desktop-nav.test.tsx
git commit -m "test: hide Offres assertion from desktop nav tests"
```

---

## Task 5: Update Mobile Menu Tests

**Files:**
- Modify: `tests/components/layout/app-bar/mobile-menu.test.tsx`

- [ ] **Step 1: Find tests that assert the presence of "Offres & Promotions" link**

Run: `grep -n "Offres" /home/super/Codes/dbs-store/tests/components/layout/app-bar/mobile-menu.test.tsx`

Expected: Shows line numbers where "Offres & Promotions" or similar text is tested

- [ ] **Step 2: Comment out the "Offres & Promotions" assertion**

Locate the test that checks for the "Offres & Promotions" link. Add a comment and disable it:

```tsx
// TODO: Re-enable assertion when "Offres" feature is ready for launch
// expect(screen.getByText("Offres & Promotions")).toBeInTheDocument();
```

If there's a comment explaining "offres slug is filtered out (hardcoded entry handles it)", update that comment to:

```tsx
// TODO: Hardcoded "Offres & Promotions" entry is disabled — will be re-enabled when feature is ready
```

- [ ] **Step 3: Verify tests still pass**

Run: `bun run test -- tests/components/layout/app-bar/mobile-menu.test.tsx`

Expected: Tests pass

- [ ] **Step 4: Commit**

```bash
cd /home/super/Codes/dbs-store
git add tests/components/layout/app-bar/mobile-menu.test.tsx
git commit -m "test: hide Offres assertion from mobile menu tests"
```

---

## Task 6: Full Test & Build Verification

**Files:**
- No files modified; verification only

- [ ] **Step 1: Run all tests**

Run: `bun run test`

Expected: All tests pass (or show only pre-existing failures)

- [ ] **Step 2: Run linter**

Run: `bun run lint`

Expected: No new lint errors from your changes (pre-existing errors are OK per CLAUDE.md)

- [ ] **Step 3: Run build**

Run: `bun run build`

Expected: Build succeeds with no new errors

- [ ] **Step 4: Manual verification in dev server**

Run: `bun run dev`

Then open http://localhost:33000 in browser and verify:
- Desktop nav does NOT show "Offres" link (in red)
- Mobile menu (hamburger icon) does NOT show "Offres & Promotions" button
- Navigating directly to http://localhost:33000/offres shows 404 page

Close dev server: `Ctrl+C`

- [ ] **Step 5: Commit verification summary (optional)**

```bash
cd /home/super/Codes/dbs-store
git log --oneline -5
```

Expected: Shows your 5 commits hiding the Offres feature

---

## Summary

All "Offres" references in menus are now hidden with clear TODO comments indicating they'll be re-enabled later. The `/offres` route returns 404, and tests are updated to reflect the hidden state. The app builds successfully and all tests pass.
