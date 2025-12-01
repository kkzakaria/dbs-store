# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBS Store is a premium e-commerce platform for electronics, built with Next.js 16 and Supabase. The project targets the Côte d'Ivoire market with Mobile Money payments (CinetPay) and phone OTP authentication.

## Commands

```bash
# Development
pnpm dev              # Start dev server (port 3000)
pnpm build            # Production build
pnpm lint             # Run ESLint

# Supabase (local development uses custom ports 44xx)
pnpm supabase start   # Start local Supabase (API: 44321, DB: 44322, Studio: 44323)
pnpm supabase stop    # Stop local Supabase
pnpm supabase db reset # Reset database with migrations and seeds
pnpm supabase gen types typescript --local > types/database.types.ts  # Generate DB types
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS 4 + Shadcn UI (new-york style)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Payments:** CinetPay (Mobile Money: Wave, Orange Money, MTN)
- **Emails:** Resend
- **State:** Zustand (cart), nuqs (URL state for filters)

### Route Groups
- `app/(auth)/` - Authentication pages (login, register, verify-otp)
- `app/(store)/` - Customer-facing storefront
- `app/admin/` - Admin dashboard (requires admin role)
- `app/api/` - API routes (webhooks, auth callbacks)

### Key Directories
- `components/ui/` - Shadcn UI components
- `components/store/` - Storefront components (product cards, cart, checkout)
- `components/admin/` - Admin dashboard components
- `lib/supabase/` - Supabase clients (client.ts, server.ts, admin.ts, storage.ts)
- `actions/` - Server Actions organized by domain
- `stores/` - Zustand stores (cart-store.ts, ui-store.ts)
- `types/database.types.ts` - Auto-generated Supabase types

### Supabase Clients
- `lib/supabase/client.ts` - Browser client (use in Client Components)
- `lib/supabase/server.ts` - Server client with cookies (use in Server Components/Actions)
- `lib/supabase/admin.ts` - Service role client (bypass RLS, use only server-side)

## Theme

Blue & Gold premium theme configured in `app/globals.css`:
- **Primary (Blue):** `#0077B6` (light mode), `#4DC4E8` (dark mode)
- **Accent (Gold):** `#D4A853` (light mode), `#E8C068` (dark mode)

Custom utility classes:
- `bg-gradient-primary`, `bg-gradient-accent`, `bg-gradient-hero`
- `shadow-card`, `shadow-card-hover`, `shadow-button`

## Conventions

- Currency: XOF (CFA Franc)
- Phone format: +225 (Côte d'Ivoire)
- All Server Actions should use `next-safe-action` with Zod validation
- Forms use `react-hook-form` with `@hookform/resolvers/zod`
- Use `cn()` from `lib/utils.ts` for conditional class merging
