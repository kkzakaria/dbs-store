# DBS Store - Design Document

## Overview

DBS Store is an online electronics store targeting Ivory Coast and the UEMOA region. Inspired by Google Store's UI/UX, built with Next.js 16 on Cloudflare Workers.

**Market**: Ivory Coast / UEMOA (French-speaking)
**Language**: French only (V1)
**Payment**: Deferred to V2 (Mobile Money + local options)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS v4, Shadcn UI (radix-vega), Lucide icons |
| Auth | Better Auth |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (images) |
| Cache | Cloudflare KV (sessions, nav cache) |
| Jobs | Cloudflare Queue (emails, image processing) |
| Deploy | Cloudflare Workers via @opennextjs/cloudflare |
| Font | Nunito Sans (primary) |

## Architecture

```
Cloudflare Workers (OpenNext)
├── Next.js App (SSR/RSC)
│   ├── Storefront (public pages)
│   ├── Admin Dashboard (/admin/*)
│   └── API Routes + Server Actions
├── D1 → Products, Categories, Users, Orders, Cart
├── R2 → Product images, User avatars
├── KV → Sessions, Cart cache, Nav cache
└── Queue → Email notifications, Image resize
```

## AppBar Design (inspired by Google Store)

### Desktop (>= 1024px)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [DBS] Smartphones▾ Tablettes▾ Ordinateurs▾ Montres▾ Audio▾ Acc▾ Offres Support │ 🔍 🛒 👤 │
└────────────────────────────────────────────────────────────────────────┘
```

- **Sticky** (position: sticky, top: 0, z-index: 50)
- Logo DBS left, 8 navigation links center, icons right (Search, Cart w/ badge, Account)
- Category links have chevron dropdown buttons for subcategory trays
- Search: full-width overlay replacing entire navbar + dark backdrop on content + X close
- **Scroll behavior**: always visible, subtle shadow after scrollY > 50px, constant height 60px

### Category Tray (desktop dropdown)

Clicking a category chevron reveals a tray with subcategory cards (image + name) and a "See all" link.

### Mobile (< 600px)

```
┌──────────────────────────┐
│ ☰  [DBS]      🔍  🛒  👤│
└──────────────────────────┘
```

- Hamburger left, logo, search + cart + account icons right
- **Menu**: fullscreen overlay (not side drawer) with category cards (rounded, image right)
- Tap category -> slide to subcategory list with back arrow
- Close via X button or Escape key
- **Scroll behavior**: always visible, shadow after scroll, slight height reduction (56px -> 48px)

### Tablet (600-1023px)

- Hybrid: hamburger menu + selected navigation links visible + icons right
- Menu behavior same as mobile

### Search Overlay (all viewports)

- Full-width search input replaces navbar
- Dark overlay on page content (opacity 50%)
- Logo stays visible on left, X close button on right
- Combobox with search suggestions

## Categories & Subcategories

| Category | Subcategories |
|---|---|
| Smartphones | iPhone, Samsung Galaxy, Google Pixel, Xiaomi, Autres marques |
| Tablettes | iPad, Samsung Tab, Tablettes Android, Accessoires tablettes |
| Ordinateurs | Laptops, Desktops, Tout-en-un, Chromebooks |
| Montres connectees | Apple Watch, Samsung Galaxy Watch, Google Pixel Watch, Fitbit |
| Audio | Ecouteurs sans fil, Casques, Enceintes Bluetooth, Barres de son |
| Accessoires | Coques & protections, Chargeurs & cables, Stockage, Supports & docks |
| Offres | (no subcategories, filter by discount) |
| Support | (no subcategories, help page) |

## Database Schema (D1)

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  image TEXT,
  parent_id TEXT REFERENCES categories(id),
  "order" INTEGER DEFAULT 0
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,        -- price in FCFA (integer, no decimals)
  compare_price INTEGER,         -- original price for discounts
  category_id TEXT NOT NULL REFERENCES categories(id),
  images TEXT NOT NULL,           -- JSON array of R2 image keys
  specs TEXT,                     -- JSON object of specifications
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',   -- draft, published, archived
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,       -- anonymous or user session
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  variant TEXT,                   -- JSON for color/size variants
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, confirmed, shipped, delivered, cancelled
  total INTEGER NOT NULL,
  items TEXT NOT NULL,            -- JSON snapshot of cart items at order time
  shipping_address TEXT,          -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

Users table managed by Better Auth.

## Page Structure (App Router)

```
app/
├── layout.tsx                    # Root: AppBar + Footer
├── page.tsx                      # Homepage
├── (store)/
│   ├── categorie/
│   │   └── [slug]/
│   │       ├── page.tsx          # Category page
│   │       └── [subSlug]/
│   │           └── page.tsx      # Subcategory page
│   ├── produit/
│   │   └── [slug]/
│   │       └── page.tsx          # Product detail
│   ├── panier/
│   │   └── page.tsx              # Cart
│   ├── recherche/
│   │   └── page.tsx              # Search results
│   └── offres/
│       └── page.tsx              # Offers/promotions
├── (auth)/
│   ├── connexion/page.tsx        # Login
│   ├── inscription/page.tsx      # Register
│   └── compte/
│       ├── page.tsx              # Account dashboard
│       └── commandes/page.tsx    # Order history
├── admin/
│   ├── layout.tsx                # Admin sidebar layout
│   ├── page.tsx                  # Admin dashboard
│   ├── produits/
│   │   ├── page.tsx              # Product list + CRUD
│   │   └── [id]/page.tsx         # Edit product
│   ├── categories/page.tsx       # Category management
│   ├── commandes/page.tsx        # Order management
│   └── utilisateurs/page.tsx     # User management
└── api/
    └── auth/[...all]/route.ts    # Better Auth handler
```

## Component Structure

```
components/
├── layout/
│   ├── app-bar/
│   │   ├── app-bar.tsx           # Main shell (sticky, responsive)
│   │   ├── desktop-nav.tsx       # Horizontal nav links + chevrons
│   │   ├── category-tray.tsx     # Dropdown subcategory tray
│   │   ├── mobile-menu-trigger.tsx
│   │   ├── mobile-menu.tsx       # Fullscreen overlay menu
│   │   ├── mobile-subcategory.tsx # Subcategory slide panel
│   │   ├── search-overlay.tsx    # Full-width search
│   │   ├── cart-indicator.tsx    # Cart icon + badge
│   │   └── user-menu.tsx         # Account dropdown
│   └── footer.tsx
├── product/
│   ├── product-card.tsx          # Product card for grids
│   ├── product-gallery.tsx       # Image gallery on detail page
│   └── product-specs.tsx         # Specifications table
├── cart/
│   ├── cart-item.tsx
│   └── cart-summary.tsx
└── ui/                           # Shadcn components (existing)
```

## Hooks

```
hooks/
├── use-scroll-state.ts           # { isScrolled, scrollY } for AppBar
├── use-cart.ts                   # Cart state + server actions
└── use-search.ts                 # Search debounce + suggestions
```

## Key Design Decisions

1. **Price in FCFA (integer)**: No decimals needed for West African CFA franc
2. **Images as JSON array in D1**: Product images stored as R2 keys in a JSON column
3. **Cart by session_id**: Works for anonymous users, linked to user on auth
4. **Admin in same app**: /admin/* routes with middleware auth check
5. **Server Actions for mutations**: Cart add/remove, order creation, admin CRUD
6. **SSR for storefront**: SEO + fast first paint
7. **Client components for interactive parts**: AppBar menus, search, cart preview
