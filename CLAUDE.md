# DBS Store

E-commerce store for electronics in Ivory Coast / UEMOA zone. French locale.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + Shadcn UI (Radix-based)
- Bun as package manager
- Cloudflare Workers + D1 (via @opennextjs/cloudflare)
- Vitest + React Testing Library + jsdom

## Commands

- `bun run dev` — Next.js dev server on port 33000 (uses `./dev.db` SQLite)
- `bun run preview` — wrangler dev (local Workers + D1, port 8788)
- `bun run test` — run all tests (vitest run)
- `bun run test:watch` — watch mode
- `bun run lint` — ESLint
- `bun run build` — Next.js production build
- `bun run build:worker` — full Cloudflare Workers build (next build + opennextjs adapter)
- `bun run deploy` — deploy to Cloudflare Workers
- `bun run db:migrate:dev` — apply migrations to `./dev.db` (for `bun run dev`)
- `bun run db:migrate:local` — apply D1 migrations locally (for `bun run preview`)
- `bun run db:migrate:remote` — apply D1 migrations to production
- `bun run db:seed` — insert demo products into `./dev.db` (runs via tsx/Node, not Bun runtime)
- `bun run db:seed:categories` — insert categories into `./dev.db`

## Project Structure

- `app/` — Next.js App Router pages and layouts
- `components/ui/` — Shadcn UI primitives
- `components/layout/` — Layout components (app-bar, etc.)
- `hooks/` — Custom React hooks
- `lib/data/` — Data access functions (products, categories, etc.)
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

- `build` script MUST be `next build` (not `opennextjs-cloudflare build`) — opennextjs internally runs `bun run build`, causing infinite loop if it points to itself. Use `build:worker` for the full Workers build.
- Any page/layout calling `getDb()`, `getAuth()`, or `getCachedSession()` MUST have `export const dynamic = "force-dynamic"` — Cloudflare bindings are unavailable at build-time prerender
- Deploy CI requires both Node.js AND Bun — opennextjs-cloudflare build needs Node.js for native module compilation
- `@opennextjs/cloudflare` only works with Cloudflare Workers, NOT Cloudflare Pages
- `wrangler deploy` does NOT build — `.open-next/` must be pre-built via `bun run build:worker`
- Bash: quote paths with parentheses — `"app/(admin)/..."` not `app/(admin)/...`
- `margin-top` on sticky elements does NOT create viewport offset — use the `top` CSS property instead
- Dev server runs on port 33000 (not default 3000)
- ESLint has pre-existing errors (unescaped entities, `any` types in auth/app-bar) — `bun run lint` failing does not indicate a regression from new code
- `getDb()` and `getAuth()` are async — always `await` them
- D1 transactions use `db.batch([...])` for atomic multi-statement writes
- Secrets must be set via `wrangler secret put <NAME>` for production
- `bun run dev` uses `./dev.db` (better-sqlite3) — run `bun run db:migrate:dev && bun run db:seed:categories && bun run db:seed` to set up
- `bun run preview` uses D1 via wrangler (port 8788) — run `bun run db:migrate:local` to set up
- Set `USE_D1=1` env var to force D1 usage in dev mode (e.g., for testing Cloudflare-specific behavior)
- `.open-next/` and `.wrangler/` are excluded from ESLint — do NOT remove these ignores from `eslint.config.mjs` or lint will OOM
- D1 migrations are immutable once applied — never modify existing files in `migrations/`, always create a new numbered file
- Server actions (`"use server"`) are public HTTP endpoints — always validate inputs at runtime, TypeScript types provide no protection
- SQLite LIKE requires explicit `ESCAPE '\\'` clause — Drizzle's `like()` does NOT add it, use `sql` template literals with ESCAPE instead
- `db.batch()` in dev mode uses a SQLite transaction polyfill — test atomic scenarios against D1 via `bun run preview`
