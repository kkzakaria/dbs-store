# Migration Cloudflare Workers (D1 + OpenNext) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the DBS Store Next.js app from better-sqlite3 (local file) to Cloudflare Workers with D1 database, using @opennextjs/cloudflare as the Next.js adapter.

**Architecture:** Replace the better-sqlite3 singleton with a request-scoped D1 drizzle instance obtained via `getCloudflareContext()`. Convert the module-level `auth` export to an async `getAuth()` factory. All synchronous better-sqlite3 transactions become async D1 transactions. Local development uses `wrangler dev` with a local D1 database.

**Tech Stack:** @opennextjs/cloudflare, drizzle-orm/d1, Cloudflare D1, wrangler

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `wrangler.jsonc` | Create | Cloudflare Workers + D1 config |
| `worker-configuration.d.ts` | Create | TypeScript types for CF bindings (Env interface) |
| `lib/db/index.ts` | Rewrite | D1 drizzle instance via getCloudflareContext() |
| `lib/auth.ts` | Rewrite | Async getAuth() factory using D1 |
| `lib/session.ts` | Modify | Use getAuth() instead of auth singleton |
| `lib/actions/admin-auth.ts` | Modify | Use getAuth() |
| `lib/actions/orders.ts` | Modify | Async D1 transaction |
| `lib/actions/admin-hero.ts` | Modify | Async D1 transactions |
| `lib/actions/admin-products.ts` | Modify | Use async getDb() |
| `lib/actions/admin-orders.ts` | Modify | Use async getDb() |
| `lib/actions/admin-team.ts` | Modify | Use getAuth() |
| `lib/data/products.ts` | Modify | Use async getDb() in cached fn |
| `app/api/auth/[...all]/route.ts` | Rewrite | Async handler with getAuth() |
| `app/api/auth/check-reset-otp/route.ts` | Rewrite | Use getAuth() API instead of raw DB |
| `app/api/admin/check-access/route.ts` | Modify | Use getAuth() |
| `middleware.ts` | Modify | Use getAuth() |
| `app/(admin)/layout.tsx` | Modify | Use getAuth() |
| `app/(main)/page.tsx` | Modify | await getDb() |
| `app/(main)/[slug]/page.tsx` | Modify | await getDb() |
| `app/(main)/produits/[slug]/page.tsx` | Modify | await getDb() |
| `app/(main)/commande/[id]/page.tsx` | Modify | await getDb() |
| `app/(main)/checkout/page.tsx` | Modify | await getDb() (if uses db) |
| `app/(compte)/compte/commandes/page.tsx` | Modify | await getDb() |
| `app/(compte)/compte/commandes/[id]/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/produits/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/produits/[id]/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/commandes/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/commandes/[id]/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/hero/page.tsx` | Modify | await getDb() |
| `app/(admin)/admin/hero/[id]/page.tsx` | Modify | await getDb() |
| `next.config.ts` | Modify | Add @opennextjs/cloudflare setup |
| `package.json` | Modify | Add deps, update scripts |
| `drizzle.config.ts` | Modify | D1 local for migrations |
| `.env.example` | Modify | Remove DATABASE_URL, add D1 info |
| `open-next.config.ts` | Create | OpenNext config for Cloudflare |

---

### Task 1: Install dependencies and create Cloudflare config files

**Files:**
- Modify: `package.json`
- Create: `wrangler.jsonc`
- Create: `worker-configuration.d.ts`
- Create: `open-next.config.ts`

- [ ] **Step 1: Install Cloudflare + D1 dependencies**

```bash
bun add @opennextjs/cloudflare
bun add -D wrangler @cloudflare/workers-types
```

- [ ] **Step 2: Remove better-sqlite3 dependencies**

```bash
bun remove better-sqlite3 @types/better-sqlite3
```

- [ ] **Step 3: Create `wrangler.jsonc`**

```jsonc
// wrangler.jsonc
{
  "name": "dbs-store",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": ".open-next/worker.js",
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dbs-store-db",
      "database_id": "TO_FILL_AFTER_CREATION"
    }
  ],
  "vars": {
    "BETTER_AUTH_URL": "https://dbs-store.ci",
    "NEXT_PUBLIC_BETTER_AUTH_URL": "https://dbs-store.ci"
  }
}
```

- [ ] **Step 4: Create `worker-configuration.d.ts`**

```ts
// worker-configuration.d.ts
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NEXT_PUBLIC_BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
}
```

- [ ] **Step 5: Create `open-next.config.ts`**

```ts
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
```

- [ ] **Step 6: Update `package.json` scripts**

Replace the `build` script and add Cloudflare-specific scripts:

```json
{
  "scripts": {
    "dev": "next dev --port 33000",
    "build": "opennextjs-cloudflare build",
    "preview": "wrangler dev",
    "deploy": "wrangler deploy",
    "start": "next start --port 33000",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "seed": "tsx scripts/seed-org.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply dbs-store-db --local",
    "db:migrate:remote": "wrangler d1 migrations apply dbs-store-db --remote",
    "db:seed": "tsx scripts/seed.ts",
    "db:seed-hero": "tsx scripts/seed-hero.ts"
  }
}
```

Remove `better-sqlite3` from `trustedDependencies` array.

- [ ] **Step 7: Update `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
```

(No changes needed - `@opennextjs/cloudflare` handles the build separately.)

- [ ] **Step 8: Commit**

```bash
git add wrangler.jsonc worker-configuration.d.ts open-next.config.ts package.json bun.lockb next.config.ts
git commit -m "feat: add Cloudflare Workers config (wrangler, opennext, D1 bindings)"
```

---

### Task 2: Rewrite database layer for D1

**Files:**
- Rewrite: `lib/db/index.ts`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: Rewrite `lib/db/index.ts`**

```ts
// lib/db/index.ts
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export async function getDb(): Promise<Db> {
  const { env } = await getCloudflareContext<CloudflareEnv>();
  return drizzle(env.DB, { schema });
}
```

- [ ] **Step 2: Update `drizzle.config.ts` for local D1 migrations**

```ts
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
} satisfies Config;
```

(Remove `dbCredentials` — drizzle-kit generates SQL files only; D1 migrations are applied via `wrangler d1 migrations apply`.)

- [ ] **Step 3: Commit**

```bash
git add lib/db/index.ts drizzle.config.ts
git commit -m "feat: rewrite database layer for Cloudflare D1"
```

---

### Task 3: Rewrite auth for D1

**Files:**
- Rewrite: `lib/auth.ts`
- Modify: `lib/session.ts`
- Modify: `lib/actions/admin-auth.ts`
- Modify: `lib/actions/admin-team.ts`
- Modify: `app/api/auth/[...all]/route.ts`
- Modify: `app/api/admin/check-access/route.ts`
- Modify: `app/(admin)/layout.tsx`
- Modify: `middleware.ts`

- [ ] **Step 1: Rewrite `lib/auth.ts` — async factory**

```ts
import { betterAuth } from "better-auth";
import { organization, emailOTP } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ac, owner, admin, member } from "@/lib/auth/permissions";
import { sendOtpEmail } from "@/lib/email";

export async function getAuth() {
  const { env } = await getCloudflareContext<CloudflareEnv>();

  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    socialProviders.facebook = {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    };
  }

  if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
    socialProviders.apple = {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    database: drizzle(env.DB),

    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },

    socialProviders,

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },

    plugins: [
      organization({
        ac,
        roles: { owner, admin, member },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (!env.RESEND_API_KEY) {
            console.log(`[emailOTP DEV] type=${type} email=${email} otp=${otp}`);
            return;
          }
          await sendOtpEmail(email, otp, type);
        },
        otpLength: 6,
        expiresIn: 300,
      }),
    ],
  });
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
```

- [ ] **Step 2: Update `lib/session.ts`**

```ts
import { cache } from "react";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export const getCachedSession = cache(async () => {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
});
```

- [ ] **Step 3: Update `lib/actions/admin-auth.ts`**

```ts
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { ORG_SLUG } from "@/lib/constants";

export async function requireOrgMember() {
  const auth = await getAuth();
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const orgs = await auth.api.listOrganizations({ headers: h });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");
  const isMember = orgs.some((org) => org.slug === ORG_SLUG);
  if (!isMember) throw new Error("UNAUTHORIZED");
  return session;
}
```

- [ ] **Step 4: Update `lib/actions/admin-team.ts`**

Replace `import { auth } from "@/lib/auth"` with `import { getAuth } from "@/lib/auth"`.

In `requireOwner()`:
```ts
async function requireOwner() {
  const auth = await getAuth();
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const orgs = await auth.api.listOrganizations({ headers: h });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");

  const fullOrg = await auth.api.getFullOrganization({
    query: { organizationSlug: "dbs-store" },
    headers: h,
  });
  const currentMember = fullOrg?.members?.find(
    (m: { userId: string }) => m.userId === session.user.id
  );
  if (currentMember?.role !== "owner") throw new Error("FORBIDDEN");

  return { session, orgId: orgs[0].id };
}
```

In `inviteMember()`, `updateMemberRole()`, `removeMember()`: add `const auth = await getAuth();` at the start (after requireOwner), and use `auth.api.*` instead of the module-level `auth`.

Since these functions call `requireOwner()` which already gets auth, refactor to pass auth down or get it again (getting it again is simpler and cheap):

```ts
export async function inviteMember(
  email: string,
  role: "admin" | "member"
): Promise<{ error?: string }> {
  try {
    const auth = await getAuth();
    const h = await headers();
    const { orgId } = await requireOwner();
    await auth.api.createInvitation({
      body: { email, role, organizationId: orgId },
      headers: h,
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Accès refusé" };
    return { error: "Erreur lors de l'invitation" };
  }
}
```

Apply the same pattern to `updateMemberRole()` and `removeMember()`.

- [ ] **Step 5: Rewrite `app/api/auth/[...all]/route.ts`**

```ts
import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export async function GET(req: Request) {
  const auth = await getAuth();
  const handler = toNextJsHandler(auth);
  return handler.GET(req);
}

export async function POST(req: Request) {
  const auth = await getAuth();
  const handler = toNextJsHandler(auth);
  return handler.POST(req);
}
```

- [ ] **Step 6: Rewrite `app/api/auth/check-reset-otp/route.ts`**

Remove direct `better-sqlite3` usage. Query the `verification` table via drizzle/D1:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email || !otp) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const db = await getDb();
  const rows = await db.all<{ value: string; expiresAt: string }>(
    sql`SELECT value, "expiresAt" FROM verification WHERE identifier = ${`forget-password-otp-${email}`} LIMIT 1`
  );
  const row = rows[0];

  if (!row) return NextResponse.json({ valid: false, reason: "not_found" });
  if (new Date(row.expiresAt) < new Date()) return NextResponse.json({ valid: false, reason: "expired" });

  const storedOtp = row.value.split(":")[0];
  if (storedOtp !== otp) return NextResponse.json({ valid: false, reason: "invalid" });

  return NextResponse.json({ valid: true });
}
```

- [ ] **Step 7: Update `app/api/admin/check-access/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ isAdmin: false });
  }
  try {
    const orgs = await auth.api.listOrganizations({ headers: await headers() });
    return NextResponse.json({ isAdmin: Array.isArray(orgs) && orgs.length > 0 });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
```

- [ ] **Step 8: Update `app/(admin)/layout.tsx`**

```ts
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata = { title: "Administration — DBS Store" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin");
  }

  let isOrgMember = false;
  try {
    const orgs = await auth.api.listOrganizations({ headers: await headers() });
    isOrgMember = Array.isArray(orgs) && orgs.length > 0;
  } catch {
    isOrgMember = false;
  }

  if (!isOrgMember) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userEmail={session.user.email} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 9: Update `middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { ORG_SLUG } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  const auth = await getAuth();

  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    console.error(`[proxy] getSession failed (${pathname}):`, err);
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!session?.user) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/email-non-verifie", request.url));
  }

  if (isAdminRoute) {
    let orgs: Awaited<ReturnType<typeof auth.api.listOrganizations>>;
    try {
      orgs = await auth.api.listOrganizations({ headers: request.headers });
    } catch (err) {
      console.error(`[proxy] listOrganizations failed (${pathname}):`, err);
      return NextResponse.redirect(new URL("/", request.url));
    }

    const isMember =
      Array.isArray(orgs) &&
      orgs.some((org: { slug: string }) => org.slug === ORG_SLUG);

    if (!isMember) {
      console.warn(`[proxy] accès admin refusé (${pathname}): non membre de l'organisation`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
```

- [ ] **Step 10: Commit**

```bash
git add lib/auth.ts lib/session.ts lib/actions/admin-auth.ts lib/actions/admin-team.ts \
  app/api/auth/ app/api/admin/check-access/route.ts app/(admin)/layout.tsx middleware.ts
git commit -m "feat: migrate auth to async getAuth() factory for D1"
```

---

### Task 4: Update server actions for async getDb() and D1 transactions

**Files:**
- Modify: `lib/actions/orders.ts`
- Modify: `lib/actions/admin-products.ts`
- Modify: `lib/actions/admin-orders.ts`
- Modify: `lib/actions/admin-hero.ts`

- [ ] **Step 1: Update `lib/actions/orders.ts`**

Key changes:
1. `const db = getDb()` → `const db = await getDb()`
2. Synchronous `db.transaction((tx) => { ... .run() })` → async `await db.transaction(async (tx) => { await ... })`
3. Remove `.run()` calls (drizzle-orm/d1 doesn't use them)

```ts
"use server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, order_items, products } from "@/lib/db/schema";
import type { PaymentMethod } from "@/lib/db/schema";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import type { CartItemInput } from "@/lib/order-utils";

export type CheckoutFormData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  payment_method: Extract<PaymentMethod, "cod">;
  items: CartItemInput[];
};

export async function createOrder(data: CheckoutFormData): Promise<{ orderId: string }> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion");
  if (!session.user.emailVerified) redirect("/email-non-verifie");

  if (!data.items || data.items.length === 0) {
    throw new Error("EMPTY_CART");
  }
  if (data.items.some((i) => i.quantity <= 0)) {
    throw new Error("INVALID_QUANTITY");
  }

  const db = await getDb();
  const productIds = data.items.map((i) => i.productId);
  const dbProducts = await db
    .select({ id: products.id, price: products.price, is_active: products.is_active })
    .from(products)
    .where(inArray(products.id, productIds));

  const priceMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = priceMap.get(item.productId);
    if (!product || !product.is_active) {
      throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
    }
  }

  const itemsWithDbPrices = data.items.map((item) => ({
    ...item,
    price: priceMap.get(item.productId)!.price,
  }));

  const subtotal = itemsWithDbPrices.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0;
  const total = subtotal + shipping_fee;

  const orderId = randomUUID();
  const now = new Date();

  try {
    await db.batch([
      db.insert(orders).values({
        id: orderId,
        user_id: session.user.id,
        status: "pending",
        payment_method: data.payment_method,
        payment_status: "pending",
        shipping_name: data.name,
        shipping_phone: data.phone,
        shipping_city: data.city,
        shipping_address: data.address,
        shipping_notes: data.notes ?? null,
        subtotal,
        shipping_fee,
        total,
        created_at: now,
        updated_at: now,
      }),
      db.insert(order_items).values(
        itemsWithDbPrices.map((item) => ({
          id: randomUUID(),
          order_id: orderId,
          product_id: item.productId,
          product_name: item.name,
          product_slug: item.slug,
          product_image: item.image,
          unit_price: item.price,
          quantity: item.quantity,
          line_total: item.price * item.quantity,
        }))
      ),
    ]);
  } catch (err) {
    console.error("[createOrder] DB write failed", {
      userId: session.user.id,
      orderId,
      itemCount: data.items.length,
      error: err,
    });
    throw err;
  }

  return { orderId };
}
```

- [ ] **Step 2: Update `lib/actions/admin-products.ts`**

Only change: `const db = getDb()` → `const db = await getDb()` in all 4 functions (`createProduct`, `updateProduct`, `toggleProductActive`, `deleteProduct`). No transaction changes needed — these are single-statement operations.

- [ ] **Step 3: Update `lib/actions/admin-orders.ts`**

Only change: `const db = getDb()` → `const db = await getDb()`.

- [ ] **Step 4: Update `lib/actions/admin-hero.ts`**

Key changes:
1. `const db = getDb()` → `const db = await getDb()` in all functions
2. Convert synchronous transactions to async. For functions that need read-then-write (active slide count check), restructure to read first, then batch:

For `createHeroSlide()`:
```ts
export async function createHeroSlide(data: HeroSlideFormData): Promise<{ error?: string }> {
  await requireOrgMember();

  const validationError = validateSlideData(data);
  if (validationError) return validationError;

  const db = await getDb();
  const now = new Date();
  const id = randomUUID();

  try {
    if (data.is_active) {
      const activeSlides = await db
        .select({ count: count() })
        .from(hero_slides)
        .where(eq(hero_slides.is_active, true));
      if (activeSlides[0].count >= MAX_ACTIVE_SLIDES) {
        return { error: "Maximum 5 bannières actives autorisées" };
      }
    }

    const existing = await db
      .select({ sort_order: hero_slides.sort_order })
      .from(hero_slides);
    const maxOrder =
      existing.length > 0 ? Math.max(...existing.map((s) => s.sort_order)) : -1;

    await db.insert(hero_slides).values({
      id,
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || null,
      badge: data.badge?.trim() || null,
      image_url: data.image_url.trim(),
      text_align: data.text_align,
      overlay_color: data.overlay_color,
      overlay_opacity: data.overlay_opacity,
      cta_primary_label: data.cta_primary_label?.trim() || null,
      cta_primary_href: data.cta_primary_href?.trim() || null,
      cta_secondary_label: data.cta_secondary_label?.trim() || null,
      cta_secondary_href: data.cta_secondary_href?.trim() || null,
      is_active: data.is_active,
      sort_order: maxOrder + 1,
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    console.error("[createHeroSlide]", err);
    return { error: "Erreur lors de la création" };
  }

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect("/admin/hero");
}
```

Apply the same pattern to `updateHeroSlide()`, `toggleHeroSlideActive()` — read the count first, then write.

For `reorderHeroSlides()`:
```ts
export async function reorderHeroSlides(ids: string[]): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = await getDb();
  try {
    const now = new Date();
    await db.batch(
      ids.map((id, i) =>
        db.update(hero_slides)
          .set({ sort_order: i, updated_at: now })
          .where(eq(hero_slides.id, id))
      )
    );
    revalidatePath("/admin/hero");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[reorderHeroSlides]", err);
    return { error: "Erreur lors du réordonnement" };
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/actions/orders.ts lib/actions/admin-products.ts lib/actions/admin-orders.ts lib/actions/admin-hero.ts
git commit -m "feat: migrate server actions to async D1 (getDb + batch transactions)"
```

---

### Task 5: Update all page components and data fetchers for async getDb()

**Files:**
- Modify: `lib/data/products.ts` (line 119: `getProductCached`)
- Modify: `app/(main)/page.tsx`
- Modify: `app/(main)/[slug]/page.tsx`
- Modify: `app/(main)/produits/[slug]/page.tsx`
- Modify: `app/(main)/commande/[id]/page.tsx`
- Modify: `app/(compte)/compte/commandes/page.tsx`
- Modify: `app/(compte)/compte/commandes/[id]/page.tsx`
- Modify: `app/(admin)/admin/page.tsx`
- Modify: `app/(admin)/admin/produits/page.tsx`
- Modify: `app/(admin)/admin/produits/[id]/page.tsx`
- Modify: `app/(admin)/admin/commandes/page.tsx`
- Modify: `app/(admin)/admin/commandes/[id]/page.tsx`
- Modify: `app/(admin)/admin/hero/page.tsx`
- Modify: `app/(admin)/admin/hero/[id]/page.tsx`

- [ ] **Step 1: Update `lib/data/products.ts`**

Change the cached function:

```ts
export const getProductCached = cache(async (slug: string): Promise<Product | null> => {
  return getProduct(await getDb(), slug);
});
```

- [ ] **Step 2: Update all page components**

In every page file listed above, change:
```ts
const db = getDb();
```
to:
```ts
const db = await getDb();
```

This is a mechanical change. The `getDb()` call is always at the top of an `async` function body, so adding `await` is safe.

For `app/(compte)/compte/commandes/[id]/page.tsx` which calls `getDb()` inline:
```ts
// Before:
getDb().select().from(orders)...
// After:
(await getDb()).select().from(orders)...
```

Also check `app/(main)/commande/[id]/page.tsx` and `app/(main)/checkout/page.tsx` for any `auth` → `getAuth()` changes needed (if they import `auth` directly).

- [ ] **Step 3: Commit**

```bash
git add lib/data/products.ts app/
git commit -m "feat: update all pages and data fetchers for async getDb()"
```

---

### Task 6: Prepare D1 migrations and update .env.example

**Files:**
- Create: `migrations/0001_init.sql`
- Modify: `.env.example`

- [ ] **Step 1: Create consolidated D1 migration**

Create `migrations/` directory (wrangler convention) and a single init migration combining all Drizzle migrations + better-auth schema:

```bash
mkdir -p migrations
```

Create `migrations/0001_init.sql`:

```sql
-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL,
  "image" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "activeOrganizationId" TEXT
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TEXT,
  "refreshTokenExpiresAt" TEXT,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logo" TEXT,
  "createdAt" TEXT NOT NULL,
  "metadata" TEXT
);

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "inviterId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

-- Better Auth indexes
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member" ("organizationId");
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member" ("userId");
CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation" ("organizationId");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" ("email");

-- App tables (from drizzle migrations)
CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "subcategory_id" TEXT,
  "price" INTEGER NOT NULL,
  "old_price" INTEGER,
  "brand" TEXT NOT NULL,
  "images" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "specs" TEXT NOT NULL,
  "stock" INTEGER DEFAULT 0 NOT NULL,
  "badge" TEXT,
  "is_active" INTEGER DEFAULT 1 NOT NULL,
  "created_at" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");

CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "payment_method" TEXT NOT NULL,
  "payment_status" TEXT DEFAULT 'pending' NOT NULL,
  "shipping_name" TEXT NOT NULL,
  "shipping_phone" TEXT NOT NULL,
  "shipping_city" TEXT NOT NULL,
  "shipping_address" TEXT NOT NULL,
  "shipping_notes" TEXT,
  "subtotal" INTEGER NOT NULL,
  "shipping_fee" INTEGER DEFAULT 0 NOT NULL,
  "total" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "order_id" TEXT NOT NULL REFERENCES "orders"("id"),
  "product_id" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "product_slug" TEXT NOT NULL,
  "product_image" TEXT NOT NULL,
  "unit_price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "line_total" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "hero_slides" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "badge" TEXT,
  "image_url" TEXT NOT NULL,
  "text_align" TEXT DEFAULT 'center' NOT NULL,
  "overlay_color" TEXT DEFAULT '#000000' NOT NULL,
  "overlay_opacity" INTEGER DEFAULT 40 NOT NULL,
  "cta_primary_label" TEXT,
  "cta_primary_href" TEXT,
  "cta_secondary_label" TEXT,
  "cta_secondary_href" TEXT,
  "is_active" INTEGER DEFAULT 1 NOT NULL,
  "sort_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);
```

- [ ] **Step 2: Update `.env.example`**

```
# Better Auth
BETTER_AUTH_SECRET=          # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:8788
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:8788

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth — Facebook
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# OAuth — Apple
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Email — Resend
RESEND_API_KEY=            # Clé API depuis resend.com/api-keys
RESEND_FROM_EMAIL=DBS Store <noreply@dbs-store.ci>

# Cloudflare R2 — upload images produits
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://cdn.dbs-store.ci

# Note: DATABASE_URL n'est plus utilisé.
# La base D1 est configurée dans wrangler.jsonc.
# Pour le dev local: wrangler dev (port 8788 par défaut)
# Pour les secrets en prod: wrangler secret put BETTER_AUTH_SECRET
```

- [ ] **Step 3: Update `wrangler.jsonc` migrations directory**

Add to `wrangler.jsonc` under the d1_databases entry:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "dbs-store-db",
    "database_id": "TO_FILL_AFTER_CREATION",
    "migrations_dir": "migrations"
  }
]
```

- [ ] **Step 4: Commit**

```bash
git add migrations/ .env.example wrangler.jsonc
git commit -m "feat: add D1 migration SQL and update env config"
```

---

### Task 7: Update CLAUDE.md and cleanup

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md**

Update the relevant sections:

**Stack section** — replace `better-sqlite3` mention:
```
- Cloudflare Workers + D1 (via @opennextjs/cloudflare)
```

**Commands section** — update:
```
- `bun run dev` — Next.js dev server on port 33000 (local only, no D1)
- `bun run preview` — wrangler dev (local Workers + D1)
- `bun run build` — production build via opennextjs-cloudflare
- `bun run deploy` — deploy to Cloudflare Workers
- `bun run db:migrate:local` — apply D1 migrations locally
- `bun run db:migrate:remote` — apply D1 migrations to production
```

**Gotchas section** — remove better-sqlite3 gotchas, add:
```
- `getDb()` and `getAuth()` are async — always `await` them
- D1 transactions use `db.batch([...])` for atomic multi-statement writes
- Secrets must be set via `wrangler secret put <NAME>` for production
- Local dev with D1 uses `wrangler dev` (port 8788), not `next dev`
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Cloudflare Workers deployment"
```

---

### Task 8: Build verification and deploy

- [ ] **Step 1: Create D1 database on Cloudflare**

```bash
npx wrangler d1 create dbs-store-db
```

Copy the returned `database_id` into `wrangler.jsonc`.

- [ ] **Step 2: Apply migrations locally**

```bash
bun run db:migrate:local
```

- [ ] **Step 3: Run build**

```bash
bun run build
```

Fix any TypeScript/build errors.

- [ ] **Step 4: Test locally with wrangler**

```bash
bun run preview
```

Verify:
- Homepage loads and shows products (after seeding)
- Auth pages work (sign up, sign in)
- Admin panel accessible

- [ ] **Step 5: Set production secrets**

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_BUCKET_NAME
wrangler secret put R2_PUBLIC_URL
```

- [ ] **Step 6: Apply remote migrations and deploy**

```bash
bun run db:migrate:remote
bun run deploy
```

- [ ] **Step 7: Final commit**

```bash
git add wrangler.jsonc
git commit -m "chore: set D1 database_id for production"
```
