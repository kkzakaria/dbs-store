# Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the blocking TypeScript error in the OTP email flow, add the 10 missing production DB indexes, and allow R2-hosted images in `next/image`.

**Architecture:** Originally three changes; **Task 1 (OtpType) was VOIDED** — it was a phantom bug from a stray `pnpm install` drifting `better-auth` to 1.6.11 locally (CI/`bun.lock` use 1.4.18). Resolved by restoring the Bun env (see GOTCHAS §16); no code change. Remaining work = Task 2 (DB indexes) + Task 3 (R2 images), shipped in one PR on branch `fix/quick-wins-indexes-otptype-images`. The pre-commit hook now passes cleanly under the Bun install.

**Tech Stack:** Next.js 16, TypeScript (strict), better-auth (emailOTP plugin), Drizzle ORM + Cloudflare D1 (SQLite), raw SQL migrations in `migrations/`, Vitest + better-sqlite3 for tests.

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `lib/auth.ts` | better-auth config; OTP callback guard | 1 |
| `migrations/0004_add_production_indexes.sql` | new migration adding 10 indexes | 2 |
| `tests/migrations/production-indexes.test.ts` | applies all migrations to in-memory SQLite, asserts indexes exist | 2 |
| `next.config.ts` | add R2 host to `images.remotePatterns` | 3 |
| `tests/next-config.test.ts` | asserts the R2 host is whitelisted | 3 |

---

## Task 1: Fix `OtpType` TypeScript error (unblocks pre-commit) — ❌ VOIDED

> **VOIDED 2026-05-23:** Phantom bug from a stray local `pnpm install` (resolved `better-auth@1.6.11` vs `bun.lock`'s `1.4.18`; 1.6.x adds `change-email` to the emailOTP union). CI was always green. Fixed by `rm -f pnpm-lock.yaml pnpm-workspace.yaml && rm -rf node_modules && bun install --frozen-lockfile && npm rebuild better-sqlite3`. No code change — the guard below would actually BREAK CI under 1.4.18 (TS2367 no-overlap). See GOTCHAS §16. The steps below are kept for historical record only; **do not implement**.

**Files:**
- Modify: `lib/auth.ts` (the `emailOTP({ sendVerificationOTP })` callback, around line 64-72)

**Context:** better-auth types the callback's `type` as `"sign-in" | "email-verification" | "forget-password" | "change-email"`. `sendOtpEmail()` (`lib/email/index.ts` -> `lib/email/types.ts`) accepts only `OtpType` = the first three. The app does not implement a change-email flow, so we narrow with an explicit guard rather than extending `OtpType` (no dead email template). A runtime unit test of `getAuth()` is impractical because it depends on `getCloudflareContext()`; here the TypeScript compiler is the test (red = TS2345, green = clean compile).

- [ ] **Step 1: Reproduce the failing typecheck (RED)**

Run: `bunx tsc --noEmit`
Expected: FAIL with
```
lib/auth.ts(69,42): error TS2345: Argument of type '"sign-in" | "email-verification" | "forget-password" | "change-email"' is not assignable to parameter of type 'OtpType'.
  Type '"change-email"' is not assignable to type 'OtpType'.
```

- [ ] **Step 2: Add the guard in the OTP callback**

In `lib/auth.ts`, replace the `sendVerificationOTP` callback body so it returns early on the unsupported `change-email` type before calling `sendOtpEmail`:

```ts
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          // L'app ne supporte pas le flux change-email — garde explicite pour la sûreté de type.
          if (type === "change-email") return;
          if (!env.RESEND_API_KEY) {
            console.log(`[emailOTP DEV] type=${type} email=${email} otp=${otp}`);
            return;
          }
          await sendOtpEmail(email, otp, type);
        },
        otpLength: 6,
        expiresIn: 300,
      }),
```

- [ ] **Step 3: Verify the typecheck passes (GREEN)**

Run: `bunx tsc --noEmit`
Expected: PASS (no output, exit 0)

- [ ] **Step 4: Run the full test suite (no regression)**

Run: `bun run test`
Expected: PASS — same number of passing tests as before (no test touches this callback).

- [ ] **Step 5: Commit (hook now passes without `--no-verify`)**

```bash
git add lib/auth.ts
git commit -m "$(cat <<'EOF'
fix: guard unsupported change-email OTP type in auth callback

better-auth types the emailOTP callback with "change-email", which the app
does not support. Narrow with an explicit early-return so the type matches
sendOtpEmail's OtpType. Unblocks the pre-commit typecheck (tsc --noEmit).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add production DB indexes

**Files:**
- Create: `migrations/0004_add_production_indexes.sql`
- Create test: `tests/migrations/production-indexes.test.ts`

**Context:** Migrations are hand-written raw SQL applied in numeric order (`scripts/migrate-dev.ts` reads `migrations/*.sql`, sorts, and runs each via better-sqlite3's multi-statement `.exec`). D1 migrations are immutable — never edit existing files, always add a new numbered one. The data-layer tests build their schema with inline `CREATE TABLE`, so they do NOT exercise migrations; therefore the test below independently applies ALL migration files to an in-memory SQLite and asserts the indexes exist. Column names were verified against `lib/db/schema.ts`.

- [ ] **Step 1: Write the failing migration test (RED)**

Create `tests/migrations/production-indexes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const migrationsDir = fileURLToPath(new URL("../../migrations", import.meta.url));

function applyAllMigrations(): Database.Database {
  const db = new Database(":memory:");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    db.exec(readFileSync(`${migrationsDir}/${file}`, "utf-8"));
  }
  return db;
}

const EXPECTED_INDEXES = [
  "idx_products_category_is_active",
  "idx_products_subcategory_is_active",
  "idx_products_created_at",
  "idx_products_brand",
  "idx_products_old_price",
  "idx_orders_user_id",
  "idx_orders_status",
  "idx_order_items_order_id",
  "idx_hero_slides_active_sort",
  "idx_categories_parent_id",
];

describe("production indexes migration", () => {
  it("creates all expected indexes after applying migrations", () => {
    const db = applyAllMigrations();
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as { name: string }[];
    const names = new Set(rows.map((r) => r.name));
    for (const idx of EXPECTED_INDEXES) {
      expect(names.has(idx), `missing index: ${idx}`).toBe(true);
    }
    db.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (RED)**

Run: `bunx vitest run tests/migrations/production-indexes.test.ts`
Expected: FAIL — first assertion error `missing index: idx_products_category_is_active`.

- [ ] **Step 3: Create the migration**

Create `migrations/0004_add_production_indexes.sql`:

```sql
-- 0004_add_production_indexes.sql
-- Production query-performance indexes. Column names match lib/db/schema.ts.

CREATE INDEX IF NOT EXISTS idx_products_category_is_active    ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_is_active ON products(subcategory_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at            ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_brand                 ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_old_price             ON products(old_price) WHERE old_price > 0;
CREATE INDEX IF NOT EXISTS idx_orders_user_id                 ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id           ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort        ON hero_slides(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id           ON categories(parent_id);
```

- [ ] **Step 4: Run the test to verify it passes (GREEN)**

Run: `bunx vitest run tests/migrations/production-indexes.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Apply the migration to the local dev DB**

Run: `bun run db:migrate:dev`
Expected: `Applying 0004_add_production_indexes.sql...` then `✓ 1 migration(s) applied to dev.db`.

- [ ] **Step 6: Run the full test suite (no regression)**

Run: `bun run test`
Expected: PASS — all prior tests plus the new migration test.

- [ ] **Step 7: Commit**

```bash
git add migrations/0004_add_production_indexes.sql tests/migrations/production-indexes.test.ts
git commit -m "$(cat <<'EOF'
perf: add 10 production DB indexes

Adds composite/single/partial indexes for product filtering & sorting,
order lookups by user/status, order_items by order, hero slide ordering,
and category parent lookups. Migration applied to D1 in prod via deploy.yml.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Allow R2 images in `next/image`

**Files:**
- Modify: `next.config.ts` (the `images.remotePatterns` array)
- Create test: `tests/next-config.test.ts`

**Context:** R2-hosted uploads are served from `R2_PUBLIC_URL = https://cdn.dbs-store.ci` (`.env.example`, `lib/actions/admin-upload.ts`). `next/image` rejects any host not in `remotePatterns`. We add only the host (no `formats` change — image optimization on Workers is a separate concern). Importing `next.config.ts` in vitest is safe (`initOpenNextCloudflareForDev()` is a no-op outside `next dev`, verified).

- [ ] **Step 1: Write the failing config test (RED)**

Create `tests/next-config.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import nextConfig from "@/next.config";

describe("next.config images", () => {
  it("whitelists the R2 public host for next/image", () => {
    const hosts = (nextConfig.images?.remotePatterns ?? []).map((p) => p.hostname);
    expect(hosts).toContain("cdn.dbs-store.ci");
  });

  it("still allows unsplash", () => {
    const hosts = (nextConfig.images?.remotePatterns ?? []).map((p) => p.hostname);
    expect(hosts).toContain("images.unsplash.com");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (RED)**

Run: `bunx vitest run tests/next-config.test.ts`
Expected: FAIL — `expected [ 'images.unsplash.com' ] to contain 'cdn.dbs-store.ci'`.

- [ ] **Step 3: Add the R2 host to remotePatterns**

In `next.config.ts`, replace the `images` block:

```ts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.dbs-store.ci" },
    ],
  },
```

- [ ] **Step 4: Run the test to verify it passes (GREEN)**

Run: `bunx vitest run tests/next-config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full test suite (no regression)**

Run: `bun run test`
Expected: PASS — all tests.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts tests/next-config.test.ts
git commit -m "$(cat <<'EOF'
feat: allow R2 public host (cdn.dbs-store.ci) in next/image

R2-hosted product/hero uploads were rejected by next/image because the host
was not in remotePatterns. Add it alongside unsplash.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Open the pull request

**Files:** none (git/gh only)

- [ ] **Step 1: Push the branch**

Run: `git push -u origin fix/quick-wins-indexes-otptype-images`
Expected: branch pushed, PR creation URL printed.

- [ ] **Step 2: Create the PR**

```bash
gh pr create --base main --head fix/quick-wins-indexes-otptype-images \
  --title "fix: quick wins — OtpType, DB indexes, R2 images" \
  --body "$(cat <<'EOF'
## Résumé

Trois correctifs indépendants issus de docs/TECHNICAL_ANALYSIS.md (+ bug TS découvert pendant l'analyse). Spec : docs/superpowers/specs/2026-05-23-quick-wins-design.md.

1. **fix OtpType** — garde explicite sur change-email dans le callback emailOTP ; débloque le typecheck pre-commit.
2. **10 index DB** — migrations/0004_add_production_indexes.sql (produits, commandes, order_items, hero, catégories).
3. **images R2** — cdn.dbs-store.ci ajouté aux remotePatterns de next/image.

## Vérification

- bunx tsc --noEmit passe
- bun run test vert (dont nouveaux tests migration + next.config)
- Au merge, deploy.yml applique db:migrate:remote (index en prod)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
Expected: PR URL printed.

- [ ] **Step 3: Confirm CI is green, then merge (squash)**

Run: `gh pr checks <PR#>` until `Lint + Test` shows `pass`, then:
`gh pr merge <PR#> --squash --delete-branch`
Expected: merged into main; `deploy.yml` runs build + `db:migrate:remote` + deploy.

---

## Notes for the implementer

- After Task 1, do NOT use `--no-verify` for Tasks 2-3 commits — the hook (`tsc --noEmit`, `typecheck:scripts`, `lint`) should pass. ESLint may report pre-existing errors in `lib/auth/**` and `app-bar.tsx`; those are documented and unrelated — confirm you added no NEW lint errors.
- D1 migrations are immutable: if `0004` needs a change after it's applied anywhere, create `0005` instead.
- Do not add `formats: [...]` to `next.config.ts` — out of scope (Workers image optimization is a separate chantier).
