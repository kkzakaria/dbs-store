# DBS Store

E-commerce store for electronics in Ivory Coast / UEMOA zone. French locale.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + Shadcn UI (Radix-based)
- Bun as package manager
- Cloudflare Workers + D1 (via @opennextjs/cloudflare)
- Vitest + React Testing Library + jsdom

## Commands

- `bun run dev` — Next.js dev server on port 33000 (local only, no D1)
- `bun run preview` — wrangler dev (local Workers + D1)
- `bun run test` — run all tests (vitest run)
- `bun run test:watch` — watch mode
- `bun run lint` — ESLint
- `bun run build` — production build via opennextjs-cloudflare
- `bun run deploy` — deploy to Cloudflare Workers
- `bun run db:migrate:local` — apply D1 migrations locally
- `bun run db:migrate:remote` — apply D1 migrations to production
- `bun run db:seed` — insert demo products (runs via tsx/Node, not Bun runtime)

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
- Branch protection on main: PR required, CI must pass
- CI on PRs: `ci.yml` runs lint + test (~1 min)
- Deploy on merge to main: `deploy.yml` runs build + D1 migrate + wrangler deploy

## Gotchas

- `margin-top` on sticky elements does NOT create viewport offset — use the `top` CSS property instead
- Dev server runs on port 33000 (not default 3000)
- ESLint has pre-existing errors (unescaped entities, `any` types in auth/app-bar) — `bun run lint` failing does not indicate a regression from new code
- `getDb()` and `getAuth()` are async — always `await` them
- D1 transactions use `db.batch([...])` for atomic multi-statement writes
- Secrets must be set via `wrangler secret put <NAME>` for production
- Local dev with D1 uses `wrangler dev` (port 8788), not `next dev`
