# DBS Store - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the DBS Store e-commerce frontend with a Google Store-inspired AppBar, responsive navigation, and homepage — all in French, targeting Ivory Coast/UEMOA.

**Architecture:** Monolith Next.js 16 app with App Router. Server Components for layout/pages, Client Components for interactive parts (AppBar menus, search, cart). Shadcn UI (radix-vega) + Tailwind v4 for styling. Categories stored as static data initially (DB integration later).

**Tech Stack:** Next.js 16.1.6, React 19, TypeScript, Tailwind CSS v4, Shadcn UI (radix-vega), Lucide icons, Vitest + React Testing Library for tests.

---

## Phase 1: Foundation

### Task 1: Install test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

**Step 1: Install Vitest and React Testing Library**

Run:
```bash
bun add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Step 2: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
```

**Step 3: Create test setup file**

Create `tests/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

**Step 4: Add test script to package.json**

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Verify test setup works**

Create a trivial test file `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `bun run test`
Expected: 1 test passes.

**Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts tests/smoke.test.ts package.json bun.lock
git commit -m "chore: add vitest + react testing library"
```

---

### Task 2: Set up root layout with French locale and metadata

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Write the failing test**

Create `tests/app/layout.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children", () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test enfant</div>
      </RootLayout>
    );
    expect(getByText("Test enfant")).toBeInTheDocument();
  });
});
```

Note: This test may need adjustments since RootLayout renders `<html>` which React Testing Library handles differently. If it fails due to `<html>` rendering, wrap the test to only check children content. The important thing is verifying the layout renders.

**Step 2: Run test to verify it fails or needs adjustments**

Run: `bun run test tests/app/layout.test.tsx`

**Step 3: Update root layout**

Modify `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBS Store - Boutique Electronique",
  description:
    "Boutique en ligne d'electronique en Côte d'Ivoire. Smartphones, tablettes, ordinateurs, montres connectées, audio et accessoires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={nunitoSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

Key changes:
- `lang="en"` → `lang="fr"`
- Removed unused Geist font imports
- `body` className simplified to `font-sans antialiased`
- Updated metadata to French with DBS Store branding

**Step 4: Verify the app still runs**

Run: `bun run dev` (check manually, then stop)
Or: `bun run build` to check for compilation errors.

**Step 5: Commit**

```bash
git add app/layout.tsx tests/app/layout.test.tsx
git commit -m "feat: set up french root layout with DBS Store metadata"
```

---

### Task 3: Create categories data module

This provides the navigation data for the AppBar. Static data for now; will be replaced with DB queries later.

**Files:**
- Create: `lib/data/categories.ts`
- Create: `tests/lib/data/categories.test.ts`

**Step 1: Write the failing test**

Create `tests/lib/data/categories.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { categories, getTopLevelCategories, getSubcategories } from "@/lib/data/categories";

describe("categories", () => {
  it("has 8 top-level categories", () => {
    const topLevel = getTopLevelCategories();
    expect(topLevel).toHaveLength(8);
  });

  it("top-level categories have no parent_id", () => {
    const topLevel = getTopLevelCategories();
    topLevel.forEach((cat) => {
      expect(cat.parent_id).toBeNull();
    });
  });

  it("smartphones has 5 subcategories", () => {
    const subs = getSubcategories("smartphones");
    expect(subs).toHaveLength(5);
  });

  it("offres has no subcategories", () => {
    const subs = getSubcategories("offres");
    expect(subs).toHaveLength(0);
  });

  it("support has no subcategories", () => {
    const subs = getSubcategories("support");
    expect(subs).toHaveLength(0);
  });

  it("categories are ordered", () => {
    const topLevel = getTopLevelCategories();
    const orders = topLevel.map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/lib/data/categories.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement categories data**

Create `lib/data/categories.ts`:
```ts
export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  image: string | null;
  parent_id: string | null;
  order: number;
};

export const categories: Category[] = [
  // Top-level
  { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0 },
  { id: "tablettes", slug: "tablettes", name: "Tablettes", icon: "tablet", image: null, parent_id: null, order: 1 },
  { id: "ordinateurs", slug: "ordinateurs", name: "Ordinateurs", icon: "laptop", image: null, parent_id: null, order: 2 },
  { id: "montres", slug: "montres-connectees", name: "Montres connectées", icon: "watch", image: null, parent_id: null, order: 3 },
  { id: "audio", slug: "audio", name: "Audio", icon: "headphones", image: null, parent_id: null, order: 4 },
  { id: "accessoires", slug: "accessoires", name: "Accessoires", icon: "cable", image: null, parent_id: null, order: 5 },
  { id: "offres", slug: "offres", name: "Offres", icon: "percent", image: null, parent_id: null, order: 6 },
  { id: "support", slug: "support", name: "Support", icon: "life-buoy", image: null, parent_id: null, order: 7 },

  // Smartphones subcategories
  { id: "iphone", slug: "iphone", name: "iPhone", icon: "smartphone", image: null, parent_id: "smartphones", order: 0 },
  { id: "samsung-galaxy", slug: "samsung-galaxy", name: "Samsung Galaxy", icon: "smartphone", image: null, parent_id: "smartphones", order: 1 },
  { id: "google-pixel", slug: "google-pixel", name: "Google Pixel", icon: "smartphone", image: null, parent_id: "smartphones", order: 2 },
  { id: "xiaomi", slug: "xiaomi", name: "Xiaomi", icon: "smartphone", image: null, parent_id: "smartphones", order: 3 },
  { id: "autres-marques", slug: "autres-marques", name: "Autres marques", icon: "smartphone", image: null, parent_id: "smartphones", order: 4 },

  // Tablettes subcategories
  { id: "ipad", slug: "ipad", name: "iPad", icon: "tablet", image: null, parent_id: "tablettes", order: 0 },
  { id: "samsung-tab", slug: "samsung-tab", name: "Samsung Tab", icon: "tablet", image: null, parent_id: "tablettes", order: 1 },
  { id: "tablettes-android", slug: "tablettes-android", name: "Tablettes Android", icon: "tablet", image: null, parent_id: "tablettes", order: 2 },
  { id: "accessoires-tablettes", slug: "accessoires-tablettes", name: "Accessoires tablettes", icon: "tablet", image: null, parent_id: "tablettes", order: 3 },

  // Ordinateurs subcategories
  { id: "laptops", slug: "laptops", name: "Laptops", icon: "laptop", image: null, parent_id: "ordinateurs", order: 0 },
  { id: "desktops", slug: "desktops", name: "Desktops", icon: "monitor", image: null, parent_id: "ordinateurs", order: 1 },
  { id: "tout-en-un", slug: "tout-en-un", name: "Tout-en-un", icon: "monitor", image: null, parent_id: "ordinateurs", order: 2 },
  { id: "chromebooks", slug: "chromebooks", name: "Chromebooks", icon: "laptop", image: null, parent_id: "ordinateurs", order: 3 },

  // Montres connectées subcategories
  { id: "apple-watch", slug: "apple-watch", name: "Apple Watch", icon: "watch", image: null, parent_id: "montres", order: 0 },
  { id: "samsung-galaxy-watch", slug: "samsung-galaxy-watch", name: "Samsung Galaxy Watch", icon: "watch", image: null, parent_id: "montres", order: 1 },
  { id: "google-pixel-watch", slug: "google-pixel-watch", name: "Google Pixel Watch", icon: "watch", image: null, parent_id: "montres", order: 2 },
  { id: "fitbit", slug: "fitbit", name: "Fitbit", icon: "watch", image: null, parent_id: "montres", order: 3 },

  // Audio subcategories
  { id: "ecouteurs-sans-fil", slug: "ecouteurs-sans-fil", name: "Écouteurs sans fil", icon: "headphones", image: null, parent_id: "audio", order: 0 },
  { id: "casques", slug: "casques", name: "Casques", icon: "headphones", image: null, parent_id: "audio", order: 1 },
  { id: "enceintes-bluetooth", slug: "enceintes-bluetooth", name: "Enceintes Bluetooth", icon: "speaker", image: null, parent_id: "audio", order: 2 },
  { id: "barres-de-son", slug: "barres-de-son", name: "Barres de son", icon: "speaker", image: null, parent_id: "audio", order: 3 },

  // Accessoires subcategories
  { id: "coques-protections", slug: "coques-protections", name: "Coques & protections", icon: "shield", image: null, parent_id: "accessoires", order: 0 },
  { id: "chargeurs-cables", slug: "chargeurs-cables", name: "Chargeurs & câbles", icon: "cable", image: null, parent_id: "accessoires", order: 1 },
  { id: "stockage", slug: "stockage", name: "Stockage", icon: "hard-drive", image: null, parent_id: "accessoires", order: 2 },
  { id: "supports-docks", slug: "supports-docks", name: "Supports & docks", icon: "monitor", image: null, parent_id: "accessoires", order: 3 },
];

export function getTopLevelCategories(): Category[] {
  return categories
    .filter((c) => c.parent_id === null)
    .sort((a, b) => a.order - b.order);
}

export function getSubcategories(parentSlugOrId: string): Category[] {
  const parent = categories.find(
    (c) => c.slug === parentSlugOrId || c.id === parentSlugOrId
  );
  if (!parent) return [];
  return categories
    .filter((c) => c.parent_id === parent.id)
    .sort((a, b) => a.order - b.order);
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/lib/data/categories.test.ts`
Expected: All 6 tests PASS.

**Step 5: Commit**

```bash
git add lib/data/categories.ts tests/lib/data/categories.test.ts
git commit -m "feat: add categories static data with subcategories"
```

---

## Phase 2: AppBar Shell

### Task 4: Create useScrollState hook

**Files:**
- Create: `hooks/use-scroll-state.ts`
- Create: `tests/hooks/use-scroll-state.test.ts`

**Step 1: Write the failing test**

Create `tests/hooks/use-scroll-state.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollState } from "@/hooks/use-scroll-state";

describe("useScrollState", () => {
  it("returns isScrolled false initially", () => {
    const { result } = renderHook(() => useScrollState());
    expect(result.current.isScrolled).toBe(false);
  });

  it("returns isScrolled true after scrolling past threshold", () => {
    const { result } = renderHook(() => useScrollState(50));

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.isScrolled).toBe(true);
  });

  it("returns scrollY value", () => {
    const { result } = renderHook(() => useScrollState());

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 200, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.scrollY).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/hooks/use-scroll-state.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement the hook**

Create `hooks/use-scroll-state.ts`:
```ts
"use client";

import { useState, useEffect } from "react";

export function useScrollState(threshold = 50) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      setScrollY(y);
      setIsScrolled(y > threshold);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { scrollY, isScrolled };
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/hooks/use-scroll-state.test.ts`
Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
git add hooks/use-scroll-state.ts tests/hooks/use-scroll-state.test.ts
git commit -m "feat: add useScrollState hook"
```

---

### Task 5: Install Shadcn Sheet component (for mobile menu)

The mobile fullscreen menu overlay needs a Sheet or Dialog-like component. Shadcn's Sheet works well for this, or we use Dialog. Let's install Sheet.

**Files:**
- Creates: `components/ui/sheet.tsx` (via shadcn CLI)

**Step 1: Install Sheet via shadcn**

Run:
```bash
bunx shadcn@latest add sheet
```

**Step 2: Verify the component was created**

Run: `ls components/ui/sheet.tsx`
Expected: File exists.

**Step 3: Install VisuallyHidden for accessibility**

Run:
```bash
bunx shadcn@latest add visually-hidden
```

**Step 4: Commit**

```bash
git add components/ui/sheet.tsx components/ui/visually-hidden.tsx
git commit -m "chore: add shadcn sheet and visually-hidden components"
```

---

### Task 6: Build the AppBar shell component

The main AppBar container: sticky, responsive, handles scroll state, renders desktop/mobile variants.

**Files:**
- Create: `components/layout/app-bar/app-bar.tsx`
- Create: `tests/components/layout/app-bar/app-bar.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/app-bar.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppBar } from "@/components/layout/app-bar/app-bar";

describe("AppBar", () => {
  it("renders the DBS logo link", () => {
    render(<AppBar />);
    expect(screen.getByRole("link", { name: /dbs/i })).toBeInTheDocument();
  });

  it("has sticky positioning", () => {
    render(<AppBar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky");
  });

  it("renders search button", () => {
    render(<AppBar />);
    expect(screen.getByRole("button", { name: /rechercher/i })).toBeInTheDocument();
  });

  it("renders cart link", () => {
    render(<AppBar />);
    expect(screen.getByRole("link", { name: /panier/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/app-bar.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement AppBar shell**

Create `components/layout/app-bar/app-bar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollState } from "@/hooks/use-scroll-state";
import { DesktopNav } from "./desktop-nav";
import { MobileMenuTrigger } from "./mobile-menu-trigger";
import { cn } from "@/lib/utils";

export function AppBar() {
  const { isScrolled } = useScrollState(50);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm transition-shadow",
        isScrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-15 max-w-7xl items-center px-4 lg:px-6">
        {/* Mobile: hamburger menu */}
        <div className="lg:hidden">
          <MobileMenuTrigger />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="mr-6 flex items-center text-xl font-bold tracking-tight"
        >
          DBS
        </Link>

        {/* Desktop navigation */}
        <div className="hidden flex-1 lg:flex">
          <DesktopNav />
        </div>

        {/* Right side icons */}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Rechercher">
            <Search className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/panier" aria-label="Panier">
              <ShoppingCart className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/compte" aria-label="Compte">
              <User className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

Note: This references `DesktopNav` and `MobileMenuTrigger` which don't exist yet. Create stub files first:

Create `components/layout/app-bar/desktop-nav.tsx`:
```tsx
export function DesktopNav() {
  return <nav aria-label="Navigation principale" />;
}
```

Create `components/layout/app-bar/mobile-menu-trigger.tsx`:
```tsx
"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileMenuTrigger() {
  return (
    <Button variant="ghost" size="icon" aria-label="Menu">
      <Menu className="size-5" />
    </Button>
  );
}
```

Create `components/layout/app-bar/index.ts`:
```ts
export { AppBar } from "./app-bar";
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/app-bar.test.tsx`
Expected: All 4 tests PASS.

**Step 5: Wire AppBar into root layout**

Modify `app/layout.tsx` to include the AppBar:
```tsx
import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { AppBar } from "@/components/layout/app-bar";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBS Store - Boutique Electronique",
  description:
    "Boutique en ligne d'electronique en Côte d'Ivoire. Smartphones, tablettes, ordinateurs, montres connectées, audio et accessoires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={nunitoSans.variable}>
      <body className="font-sans antialiased">
        <AppBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

**Step 6: Verify in browser**

Run: `bun run dev`
Check: AppBar visible at top with "DBS" logo, search/cart icons. Sticky on scroll.

**Step 7: Commit**

```bash
git add components/layout/app-bar/ tests/components/layout/app-bar/ app/layout.tsx
git commit -m "feat: add AppBar shell with sticky behavior and responsive layout"
```

---

## Phase 3: Desktop Navigation

### Task 7: Build desktop navigation with category links

**Files:**
- Modify: `components/layout/app-bar/desktop-nav.tsx`
- Create: `tests/components/layout/app-bar/desktop-nav.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/desktop-nav.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DesktopNav } from "@/components/layout/app-bar/desktop-nav";

describe("DesktopNav", () => {
  it("renders all 8 category links", () => {
    render(<DesktopNav />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Montres connectées")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Accessoires")).toBeInTheDocument();
    expect(screen.getByText("Offres")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("categories with subcategories have chevron buttons", () => {
    render(<DesktopNav />);
    // Smartphones has subcategories, should have a chevron trigger
    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toBeInTheDocument();
  });

  it("offres links directly (no chevron)", () => {
    render(<DesktopNav />);
    const offresLink = screen.getByRole("link", { name: /offres/i });
    expect(offresLink).toBeInTheDocument();
    expect(offresLink).toHaveAttribute("href", "/offres");
  });

  it("support links directly (no chevron)", () => {
    render(<DesktopNav />);
    const supportLink = screen.getByRole("link", { name: /support/i });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute("href", "/support");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/desktop-nav.test.tsx`
Expected: FAIL — DesktopNav renders empty nav.

**Step 3: Implement DesktopNav**

Modify `components/layout/app-bar/desktop-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelCategories,
  getSubcategories,
} from "@/lib/data/categories";
import { CategoryTray } from "./category-tray";
import { useState } from "react";

export function DesktopNav() {
  const topLevel = getTopLevelCategories();
  const [openTray, setOpenTray] = useState<string | null>(null);

  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-1">
      {topLevel.map((category) => {
        const subcategories = getSubcategories(category.id);
        const hasSubcategories = subcategories.length > 0;

        if (!hasSubcategories) {
          return (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {category.name}
            </Link>
          );
        }

        return (
          <div key={category.id} className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-sm font-medium text-foreground/80"
              aria-label={category.name}
              aria-expanded={openTray === category.id}
              onClick={() =>
                setOpenTray(openTray === category.id ? null : category.id)
              }
            >
              {category.name}
              <ChevronDown className="size-3.5" />
            </Button>

            {openTray === category.id && (
              <CategoryTray
                categoryId={category.id}
                categorySlug={category.slug}
                subcategories={subcategories}
                onClose={() => setOpenTray(null)}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
```

Create stub `components/layout/app-bar/category-tray.tsx`:
```tsx
import type { Category } from "@/lib/data/categories";

type CategoryTrayProps = {
  categoryId: string;
  categorySlug: string;
  subcategories: Category[];
  onClose: () => void;
};

export function CategoryTray({ subcategories, onClose }: CategoryTrayProps) {
  return (
    <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border bg-background p-4 shadow-lg">
      {subcategories.map((sub) => (
        <div key={sub.id}>{sub.name}</div>
      ))}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/desktop-nav.test.tsx`
Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add components/layout/app-bar/desktop-nav.tsx components/layout/app-bar/category-tray.tsx tests/components/layout/app-bar/desktop-nav.test.tsx
git commit -m "feat: add desktop navigation with category links and chevrons"
```

---

### Task 8: Build the category tray dropdown

**Files:**
- Modify: `components/layout/app-bar/category-tray.tsx`
- Create: `tests/components/layout/app-bar/category-tray.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/category-tray.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryTray } from "@/components/layout/app-bar/category-tray";
import { getSubcategories } from "@/lib/data/categories";

describe("CategoryTray", () => {
  const subcategories = getSubcategories("smartphones");
  const onClose = vi.fn();

  it("renders all subcategories", () => {
    render(
      <CategoryTray
        categoryId="smartphones"
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy")).toBeInTheDocument();
    expect(screen.getByText("Google Pixel")).toBeInTheDocument();
    expect(screen.getByText("Xiaomi")).toBeInTheDocument();
    expect(screen.getByText("Autres marques")).toBeInTheDocument();
  });

  it("renders a 'Tout voir' link to parent category", () => {
    render(
      <CategoryTray
        categoryId="smartphones"
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    const seeAllLink = screen.getByRole("link", { name: /tout voir/i });
    expect(seeAllLink).toHaveAttribute("href", "/categorie/smartphones");
  });

  it("subcategory links point to correct paths", () => {
    render(
      <CategoryTray
        categoryId="smartphones"
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    const iphoneLink = screen.getByRole("link", { name: /iphone/i });
    expect(iphoneLink).toHaveAttribute(
      "href",
      "/categorie/smartphones/iphone"
    );
  });
});
```

Note: Install `@testing-library/user-event` first:

Run: `bun add -D @testing-library/user-event`

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/category-tray.test.tsx`
Expected: FAIL — current stub doesn't have links.

**Step 3: Implement CategoryTray**

Modify `components/layout/app-bar/category-tray.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Category } from "@/lib/data/categories";

type CategoryTrayProps = {
  categoryId: string;
  categorySlug: string;
  subcategories: Category[];
  onClose: () => void;
};

export function CategoryTray({
  categorySlug,
  subcategories,
  onClose,
}: CategoryTrayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-50 mt-2 min-w-72 rounded-xl border bg-background p-4 shadow-lg"
      role="menu"
    >
      <div className="grid gap-1">
        {subcategories.map((sub) => (
          <Link
            key={sub.id}
            href={`/categorie/${categorySlug}/${sub.slug}`}
            className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            role="menuitem"
            onClick={onClose}
          >
            {sub.name}
          </Link>
        ))}
      </div>
      <div className="mt-3 border-t pt-3">
        <Link
          href={`/categorie/${categorySlug}`}
          className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          onClick={onClose}
        >
          Tout voir
        </Link>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/category-tray.test.tsx`
Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
git add components/layout/app-bar/category-tray.tsx tests/components/layout/app-bar/category-tray.test.tsx package.json bun.lock
git commit -m "feat: add category tray dropdown with subcategory links"
```

---

## Phase 4: Mobile Menu

### Task 9: Build the mobile fullscreen menu

Google Store uses a fullscreen overlay (not side drawer). Categories shown as cards, tapping one slides to subcategory list.

**Files:**
- Create: `components/layout/app-bar/mobile-menu.tsx`
- Modify: `components/layout/app-bar/mobile-menu-trigger.tsx`
- Create: `tests/components/layout/app-bar/mobile-menu.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/mobile-menu.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu } from "@/components/layout/app-bar/mobile-menu";

describe("MobileMenu", () => {
  const onClose = vi.fn();

  it("renders all top-level categories", () => {
    render(<MobileMenu open onClose={onClose} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Accessoires")).toBeInTheDocument();
    expect(screen.getByText("Offres")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<MobileMenu open={false} onClose={onClose} />);
    expect(screen.queryByText("Smartphones")).not.toBeInTheDocument();
  });

  it("shows subcategories when category is tapped", async () => {
    const user = userEvent.setup();
    render(<MobileMenu open onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));

    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy")).toBeInTheDocument();
  });

  it("shows back button in subcategory view", async () => {
    const user = userEvent.setup();
    render(<MobileMenu open onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));

    expect(screen.getByRole("button", { name: /retour/i })).toBeInTheDocument();
  });

  it("goes back to categories from subcategories", async () => {
    const user = userEvent.setup();
    render(<MobileMenu open onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));
    await user.click(screen.getByRole("button", { name: /retour/i }));

    // Should show top-level categories again
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/mobile-menu.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement MobileMenu**

Create `components/layout/app-bar/mobile-menu.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelCategories,
  getSubcategories,
  type Category,
} from "@/lib/data/categories";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const topLevel = getTopLevelCategories();

  if (!open) return null;

  function handleCategoryClick(category: Category) {
    const subs = getSubcategories(category.id);
    if (subs.length > 0) {
      setActiveCategory(category);
    }
  }

  function handleBack() {
    setActiveCategory(null);
  }

  function handleClose() {
    setActiveCategory(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex h-15 items-center justify-between px-4">
        {activeCategory ? (
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Retour">
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <span className="text-xl font-bold">DBS</span>
        )}

        {activeCategory && (
          <span className="text-lg font-semibold">{activeCategory.name}</span>
        )}

        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Fermer le menu">
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-4 pb-8">
        {!activeCategory ? (
          // Top-level categories
          <div className="grid gap-2 pt-2">
            {topLevel.map((category) => {
              const subs = getSubcategories(category.id);
              const hasSubcategories = subs.length > 0;

              if (!hasSubcategories) {
                return (
                  <Link
                    key={category.id}
                    href={`/${category.slug}`}
                    className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-4 text-base font-medium transition-colors hover:bg-muted"
                    onClick={handleClose}
                  >
                    {category.name}
                  </Link>
                );
              }

              return (
                <button
                  key={category.id}
                  className="flex w-full items-center justify-between rounded-xl bg-muted/50 px-4 py-4 text-left text-base font-medium transition-colors hover:bg-muted"
                  onClick={() => handleCategoryClick(category)}
                >
                  {category.name}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        ) : (
          // Subcategories
          <div className="grid gap-1 pt-2">
            <Link
              href={`/categorie/${activeCategory.slug}`}
              className="rounded-lg px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              onClick={handleClose}
            >
              Tout voir {activeCategory.name}
            </Link>
            {getSubcategories(activeCategory.id).map((sub) => (
              <Link
                key={sub.id}
                href={`/categorie/${activeCategory.slug}/${sub.slug}`}
                className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                onClick={handleClose}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Update MobileMenuTrigger to control MobileMenu**

Modify `components/layout/app-bar/mobile-menu-trigger.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";

export function MobileMenuTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

**Step 5: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/mobile-menu.test.tsx`
Expected: All 5 tests PASS.

**Step 6: Verify in browser**

Run: `bun run dev`
Resize to mobile width. Click hamburger icon. Verify:
- Fullscreen overlay appears
- Categories listed as cards
- Tapping a category slides to subcategory list
- Back arrow returns to main list
- X closes the menu

**Step 7: Commit**

```bash
git add components/layout/app-bar/mobile-menu.tsx components/layout/app-bar/mobile-menu-trigger.tsx tests/components/layout/app-bar/mobile-menu.test.tsx
git commit -m "feat: add fullscreen mobile menu with category navigation"
```

---

## Phase 5: Search Overlay

### Task 10: Build the search overlay

Full-width search replaces the navbar. Dark backdrop on content. Logo stays visible. X to close.

**Files:**
- Create: `components/layout/app-bar/search-overlay.tsx`
- Create: `tests/components/layout/app-bar/search-overlay.test.tsx`
- Modify: `components/layout/app-bar/app-bar.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/search-overlay.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchOverlay } from "@/components/layout/app-bar/search-overlay";

describe("SearchOverlay", () => {
  const onClose = vi.fn();

  it("renders search input when open", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<SearchOverlay open={false} onClose={onClose} />);
    expect(screen.queryByPlaceholderText(/rechercher/i)).not.toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByRole("button", { name: /fermer/i })).toBeInTheDocument();
  });

  it("renders DBS logo", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByText("DBS")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    render(<SearchOverlay open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /fermer/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("auto-focuses the search input", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByPlaceholderText(/rechercher/i)).toHaveFocus();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/search-overlay.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement SearchOverlay**

Create `components/layout/app-bar/search-overlay.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Small delay to let the DOM render before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search bar replacing AppBar */}
      <div className="fixed inset-x-0 top-0 z-50 bg-background shadow-sm">
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-4 px-4 lg:px-6">
          <span className="text-xl font-bold">DBS</span>

          <div className="flex-1">
            <input
              ref={inputRef}
              type="search"
              placeholder="Rechercher des produits..."
              className="w-full rounded-full bg-muted px-5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer la recherche">
            <X className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
```

**Step 4: Wire SearchOverlay into AppBar**

Modify `components/layout/app-bar/app-bar.tsx` — add search state:

Add at the top of the component:
```tsx
import { SearchOverlay } from "./search-overlay";
import { useState } from "react";
```

Add state:
```tsx
const [searchOpen, setSearchOpen] = useState(false);
```

Replace the search button with:
```tsx
<Button variant="ghost" size="icon" aria-label="Rechercher" onClick={() => setSearchOpen(true)}>
  <Search className="size-5" />
</Button>
```

Add `<SearchOverlay>` after closing `</header>`:
```tsx
<SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
```

Wrap the whole thing in a fragment `<>...</>` since we now have two root elements.

**Step 5: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/search-overlay.test.tsx`
Expected: All 6 tests PASS.

**Step 6: Verify in browser**

Run: `bun run dev`
Click search icon. Verify:
- Full-width search bar appears
- Dark backdrop behind
- DBS logo visible
- Input auto-focused
- X closes overlay
- Escape key closes overlay

**Step 7: Commit**

```bash
git add components/layout/app-bar/search-overlay.tsx components/layout/app-bar/app-bar.tsx tests/components/layout/app-bar/search-overlay.test.tsx
git commit -m "feat: add full-width search overlay with backdrop"
```

---

## Phase 6: Cart Indicator & User Menu

### Task 11: Build cart indicator with badge

**Files:**
- Create: `components/layout/app-bar/cart-indicator.tsx`
- Create: `tests/components/layout/app-bar/cart-indicator.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/cart-indicator.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartIndicator } from "@/components/layout/app-bar/cart-indicator";

describe("CartIndicator", () => {
  it("renders cart link", () => {
    render(<CartIndicator count={0} />);
    expect(screen.getByRole("link", { name: /panier/i })).toBeInTheDocument();
  });

  it("links to /panier", () => {
    render(<CartIndicator count={0} />);
    expect(screen.getByRole("link", { name: /panier/i })).toHaveAttribute(
      "href",
      "/panier"
    );
  });

  it("shows badge when count > 0", () => {
    render(<CartIndicator count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides badge when count is 0", () => {
    render(<CartIndicator count={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/cart-indicator.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement CartIndicator**

Create `components/layout/app-bar/cart-indicator.tsx`:
```tsx
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

type CartIndicatorProps = {
  count: number;
};

export function CartIndicator({ count }: CartIndicatorProps) {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/panier" aria-label="Panier" className="relative">
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/cart-indicator.test.tsx`
Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add components/layout/app-bar/cart-indicator.tsx tests/components/layout/app-bar/cart-indicator.test.tsx
git commit -m "feat: add cart indicator with badge count"
```

---

### Task 12: Build user menu button

**Files:**
- Create: `components/layout/app-bar/user-menu.tsx`
- Create: `tests/components/layout/app-bar/user-menu.test.tsx`

**Step 1: Write the failing test**

Create `tests/components/layout/app-bar/user-menu.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/layout/app-bar/user-menu";

describe("UserMenu", () => {
  it("renders account link when not authenticated", () => {
    render(<UserMenu />);
    expect(screen.getByRole("link", { name: /compte/i })).toBeInTheDocument();
  });

  it("links to /connexion when not authenticated", () => {
    render(<UserMenu />);
    expect(screen.getByRole("link", { name: /compte/i })).toHaveAttribute(
      "href",
      "/connexion"
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/layout/app-bar/user-menu.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement UserMenu**

Create `components/layout/app-bar/user-menu.tsx`:
```tsx
import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  // TODO: integrate with Better Auth session
  return (
    <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
      <Link href="/connexion" aria-label="Compte">
        <User className="size-5" />
      </Link>
    </Button>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test tests/components/layout/app-bar/user-menu.test.tsx`
Expected: All 2 tests PASS.

**Step 5: Commit**

```bash
git add components/layout/app-bar/user-menu.tsx tests/components/layout/app-bar/user-menu.test.tsx
git commit -m "feat: add user menu button"
```

---

### Task 13: Integrate CartIndicator and UserMenu into AppBar

**Files:**
- Modify: `components/layout/app-bar/app-bar.tsx`

**Step 1: Update AppBar to use CartIndicator and UserMenu**

Modify `components/layout/app-bar/app-bar.tsx` to import and use `CartIndicator` and `UserMenu` instead of inline icons:

Replace the cart link with:
```tsx
<CartIndicator count={0} />
```

Replace the account link with:
```tsx
<UserMenu />
```

Remove the now-unused `ShoppingCart` and `User` imports from lucide-react.

**Step 2: Run all AppBar tests**

Run: `bun run test tests/components/layout/app-bar/`
Expected: All tests PASS.

**Step 3: Verify in browser**

Run: `bun run dev`
Check: AppBar shows search, cart, and account icons. Cart badge hidden (count=0).

**Step 4: Commit**

```bash
git add components/layout/app-bar/app-bar.tsx
git commit -m "refactor: integrate cart indicator and user menu into appbar"
```

---

## Phase 7: Clean Up & Homepage Placeholder

### Task 14: Create a clean homepage placeholder

**Files:**
- Modify: `app/page.tsx`
- Remove: `components/component-example.tsx` (if it exists and is only used by page.tsx)

**Step 1: Update homepage**

Modify `app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
      <section className="py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Bienvenue sur DBS Store
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Votre boutique d'électronique en Côte d'Ivoire
        </p>
      </section>
    </div>
  );
}
```

**Step 2: Remove ComponentExample if it's the only consumer**

Check if `component-example.tsx` is used elsewhere. If not, delete it:
```bash
rm components/component-example.tsx
```

**Step 3: Verify in browser**

Run: `bun run dev`
Check: Homepage shows "Bienvenue sur DBS Store" with AppBar above.

**Step 4: Commit**

```bash
git add app/page.tsx
git rm components/component-example.tsx 2>/dev/null; true
git commit -m "feat: add homepage placeholder with welcome message"
```

---

### Task 15: Run all tests and verify build

**Step 1: Run all tests**

Run: `bun run test`
Expected: All tests pass.

**Step 2: Run build**

Run: `bun run build`
Expected: Build succeeds with no errors.

**Step 3: Fix any issues**

If tests or build fail, fix the issues. Common issues:
- Missing `"use client"` directives
- Import path mismatches
- TypeScript type errors

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and test issues"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1: Foundation | 1-3 | Test infra, root layout (French), categories data |
| 2: AppBar Shell | 4-6 | useScrollState hook, Sheet component, AppBar shell |
| 3: Desktop Nav | 7-8 | Category links with chevrons, category tray dropdown |
| 4: Mobile Menu | 9 | Fullscreen overlay with category/subcategory navigation |
| 5: Search | 10 | Full-width search overlay with backdrop |
| 6: Cart & User | 11-13 | Cart badge, user menu, AppBar integration |
| 7: Cleanup | 14-15 | Homepage placeholder, full test & build verification |

**Total: 15 tasks, ~45 steps**

After completing this plan, the next phase would cover:
- Footer component
- Category/subcategory pages (App Router routes)
- Product card components
- Database setup (D1 schema)
- Admin dashboard foundation
