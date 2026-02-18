# DBS Store

E-commerce store for electronics in Ivory Coast / UEMOA zone. French locale.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + Shadcn UI (Radix-based)
- Bun as package manager
- Vitest + React Testing Library + jsdom

## Commands

- `bun run dev` — dev server on port 33000
- `bun run test` — run all tests (vitest run)
- `bun run test:watch` — watch mode
- `bun run lint` — ESLint
- `bun run build` — production build

## Project Structure

- `app/` — Next.js App Router pages and layouts
- `components/ui/` — Shadcn UI primitives
- `components/layout/` — Layout components (app-bar, etc.)
- `hooks/` — Custom React hooks
- `lib/data/` — Static data (categories, etc.)
- `lib/utils.ts` — cn() utility (clsx + tailwind-merge)
- `tests/` — Mirrors source structure

## Conventions

- Use `cn()` from `@/lib/utils` for conditional class merging
- Barrel imports from lucide-react are OK — `optimizePackageImports` is configured
- Use ternary (`condition ? <X /> : null`) over `&&` for nullable non-boolean values
- Lazy-load heavy components with `next/dynamic`
- Use `{ passive: true }` on scroll/touch event listeners
- Static data arrays should be hoisted outside components

## Git Workflow

- Feature branches with squash merge PRs
- Branch naming: `feat/<feature-name>`

## Gotchas

- `margin-top` on sticky elements does NOT create viewport offset — use the `top` CSS property instead
- Dev server runs on port 33000 (not default 3000)
