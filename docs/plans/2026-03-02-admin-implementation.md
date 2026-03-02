# Administration DBS Store — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implémenter le back-office admin (dashboard, produits CRUD + upload R2, commandes, équipe) avec sidebar layout, middleware de protection, et Server Actions.

**Architecture:** Route group `app/(admin)/` avec Server Components + Server Actions. Middleware Next.js Edge vérifie la présence du cookie de session. Le layout admin valide la session complète + appartenance org via `auth.api`. Upload images : presigned PUT vers Cloudflare R2.

**Tech Stack:** Next.js 16 App Router, Better Auth + Organization plugin, Drizzle ORM, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, Tailwind CSS v4, Shadcn UI, Vitest.

---

## Prérequis

Avant de commencer, ajouter les variables R2 dans `.env.local` :
```
R2_ACCOUNT_ID=<ton-account-id>
R2_ACCESS_KEY_ID=<ta-cle>
R2_SECRET_ACCESS_KEY=<ton-secret>
R2_BUCKET_NAME=<nom-du-bucket>
R2_PUBLIC_URL=https://cdn.dbs-store.ci
```

Le bucket R2 doit avoir une règle CORS autorisant PUT depuis `http://localhost:33000` en dev.

---

## Task 1 : Installer les dépendances R2

**Files:**
- Modify: `package.json` (via bun)

**Step 1 : Installer les packages AWS SDK**

```bash
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Expected: packages ajoutés dans `node_modules/` et `bun.lock` mis à jour.

**Step 2 : Vérifier l'installation**

```bash
bun run build 2>&1 | grep -E "error|Error" | head -5
```

Expected: aucune erreur d'import.

**Step 3 : Commit**

```bash
git add bun.lock package.json
git commit -m "chore: add @aws-sdk/client-s3 and s3-request-presigner"
```

---

## Task 2 : Middleware de protection des routes

**Files:**
- Create: `middleware.ts` (racine du projet)

**Step 1 : Écrire le test**

Create `tests/middleware.test.ts` :

```typescript
import { describe, it, expect, vi } from "vitest";

// Le middleware utilise l'API Edge (NextRequest/NextResponse) — on mocke next/server
vi.mock("next/server", () => {
  const redirect = vi.fn((url: URL) => ({ type: "redirect", url: url.toString() }));
  const next = vi.fn(() => ({ type: "next" }));
  return {
    NextResponse: { redirect, next },
    NextRequest: class {
      constructor(public url: string) {}
      get nextUrl() { return new URL(this.url); }
      get headers() { return new Headers(); }
      cookies = { get: vi.fn() };
    },
  };
});

import { middleware } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";

function makeRequest(path: string, hasCookie = false) {
  const req = new NextRequest(`http://localhost:33000${path}`);
  (req.cookies.get as ReturnType<typeof vi.fn>).mockReturnValue(
    hasCookie ? { value: "token123" } : undefined
  );
  return req;
}

describe("middleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("laisse passer les routes publiques", async () => {
    await middleware(makeRequest("/"));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("redirige /admin vers /connexion sans cookie", async () => {
    await middleware(makeRequest("/admin", false));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/connexion" })
    );
  });

  it("laisse passer /admin avec cookie", async () => {
    await middleware(makeRequest("/admin", true));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("redirige /compte vers /connexion sans cookie", async () => {
    await middleware(makeRequest("/compte/profil", false));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/connexion" })
    );
  });

  it("laisse passer /compte avec cookie", async () => {
    await middleware(makeRequest("/compte/profil", true));
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
```

**Step 2 : Vérifier que le test échoue**

```bash
bunx vitest run tests/middleware.test.ts
```

Expected: FAIL — `@/middleware` not found.

**Step 3 : Implémenter le middleware**

Create `middleware.ts` à la racine :

```typescript
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/compte");

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
```

Note : Le middleware vérifie uniquement la présence du cookie (Edge-compatible). La validation complète de la session et l'appartenance org se font dans le layout admin (Node.js runtime).

**Step 4 : Vérifier que les tests passent**

```bash
bunx vitest run tests/middleware.test.ts
```

Expected: 5 tests PASS.

**Step 5 : Commit**

```bash
git add middleware.ts tests/middleware.test.ts
git commit -m "feat: middleware protection for /admin and /compte routes"
```

---

## Task 3 : Layout admin avec sidebar

**Files:**
- Create: `app/(admin)/layout.tsx`
- Create: `components/admin/sidebar.tsx`
- Create: `app/api/admin/check-access/route.ts`

**Step 1 : API route check-access**

Create `app/api/admin/check-access/route.ts` :

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
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

**Step 2 : Composant Sidebar (client)**

Create `components/admin/sidebar.tsx` :

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Produits", href: "/admin/produits", icon: Package, exact: false },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart, exact: false },
  { label: "Équipe", href: "/admin/equipe", icon: Users, exact: false },
];

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } finally {
      router.push("/connexion");
    }
  }, [router]);

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-background">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Store className="size-5 text-primary" />
        <span className="font-bold tracking-tight">DBS Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{userEmail}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
```

**Step 3 : Layout admin**

Create `app/(admin)/layout.tsx` :

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata = { title: "Administration — DBS Store" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin");
  }

  // Vérifier l'appartenance à l'organisation
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

**Step 4 : Page de test (placeholder dashboard)**

Create `app/(admin)/admin/page.tsx` :

```typescript
export default function AdminPage() {
  return <div><h1 className="text-2xl font-bold">Dashboard</h1></div>;
}
```

**Step 5 : Vérifier que le dev server compile**

```bash
bun run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:33000/admin
```

Expected: 307 (redirect vers /connexion) car pas de cookie de session.

```bash
kill %1
```

**Step 6 : Commit**

```bash
git add app/"(admin)"/layout.tsx app/"(admin)"/admin/page.tsx components/admin/sidebar.tsx app/api/admin/check-access/route.ts
git commit -m "feat: admin layout with sidebar and session/org protection"
```

---

## Task 4 : Stats dashboard

**Files:**
- Create: `lib/data/admin-stats.ts`
- Create: `tests/lib/data/admin-stats.test.ts`

**Step 1 : Écrire les tests**

Create `tests/lib/data/admin-stats.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: vi.fn(),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));

import { getAdminStats } from "@/lib/data/admin-stats";

describe("getAdminStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne un objet avec les 4 métriques", async () => {
    // Mock retourne des valeurs synthétiques
    mockDb.where.mockResolvedValueOnce([{ count: 3 }])   // ordersToday
      .mockResolvedValueOnce([{ total: 150000 }])          // revenueMonth
      .mockResolvedValueOnce([{ count: 12 }])              // pendingOrders
      .mockResolvedValueOnce([{ count: 2 }]);               // lowStockProducts

    const stats = await getAdminStats(mockDb as never);
    expect(stats).toMatchObject({
      ordersToday: expect.any(Number),
      revenueMonth: expect.any(Number),
      pendingOrders: expect.any(Number),
      lowStockProducts: expect.any(Number),
    });
  });
});
```

**Step 2 : Vérifier que le test échoue**

```bash
bunx vitest run tests/lib/data/admin-stats.test.ts
```

Expected: FAIL — `@/lib/data/admin-stats` not found.

**Step 3 : Implémenter admin-stats**

Create `lib/data/admin-stats.ts` :

```typescript
import { sql, and, gte, eq, lte } from "drizzle-orm";
import { orders, products } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export type AdminStats = {
  ordersToday: number;
  revenueMonth: number;
  pendingOrders: number;
  lowStockProducts: number;
  ordersByDay: { date: string; count: number }[];
};

export async function getAdminStats(db: Db): Promise<AdminStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [ordersToday, revenueMonth, pendingOrders, lowStockProducts, recentOrders] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.created_at, todayStart))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ total: sql<number>`coalesce(sum(total), 0)` })
        .from(orders)
        .where(
          and(
            gte(orders.created_at, monthStart),
            sql`${orders.status} in ('confirmed', 'shipped', 'delivered')`
          )
        )
        .then((r) => r[0]?.total ?? 0),

      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "pending"))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(lte(products.stock, 3), eq(products.is_active, true)))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ created_at: orders.created_at })
        .from(orders)
        .where(gte(orders.created_at, sevenDaysAgo)),
    ]);

  // Grouper les commandes par jour (7 derniers jours)
  const countByDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    countByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of recentOrders) {
    const key = row.created_at.toISOString().slice(0, 10);
    if (countByDay.has(key)) {
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }
  }

  const ordersByDay = Array.from(countByDay.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    ordersToday: Number(ordersToday),
    revenueMonth: Number(revenueMonth),
    pendingOrders: Number(pendingOrders),
    lowStockProducts: Number(lowStockProducts),
    ordersByDay,
  };
}
```

**Step 4 : Vérifier que les tests passent**

```bash
bunx vitest run tests/lib/data/admin-stats.test.ts
```

Expected: PASS.

**Step 5 : Commit**

```bash
git add lib/data/admin-stats.ts tests/lib/data/admin-stats.test.ts
git commit -m "feat: admin stats data functions"
```

---

## Task 5 : Page Dashboard

**Files:**
- Modify: `app/(admin)/admin/page.tsx`
- Create: `components/admin/stats-card.tsx`
- Create: `components/admin/orders-chart.tsx`

**Step 1 : Composant StatsCard**

Create `components/admin/stats-card.tsx` :

```typescript
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatsCard({ title, value, subtitle, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border bg-background p-6", className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
```

**Step 2 : Composant OrdersChart (SVG pur)**

Create `components/admin/orders-chart.tsx` :

```typescript
interface OrdersChartProps {
  data: { date: string; count: number }[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const H = 80;
  const W = 240;
  const barW = Math.floor(W / data.length) - 4;

  return (
    <div className="rounded-lg border bg-background p-6">
      <p className="mb-4 text-sm font-medium text-muted-foreground">Commandes — 7 derniers jours</p>
      <svg width={W} height={H} className="w-full overflow-visible" viewBox={`0 0 ${W} ${H}`}>
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.count / max) * H));
          const x = i * (W / data.length) + 2;
          const y = H - barH;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                className="fill-primary opacity-80"
                rx={2}
              />
              <title>{`${d.date}: ${d.count}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
```

**Step 3 : Page Dashboard complète**

Replace `app/(admin)/admin/page.tsx` :

```typescript
import { getDb } from "@/lib/db";
import { getAdminStats } from "@/lib/data/admin-stats";
import { StatsCard } from "@/components/admin/stats-card";
import { OrdersChart } from "@/components/admin/orders-chart";

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboardPage() {
  const db = getDb();
  const stats = await getAdminStats(db);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Commandes aujourd'hui"
          value={stats.ordersToday}
        />
        <StatsCard
          title="Revenus ce mois"
          value={formatFCFA(stats.revenueMonth)}
          subtitle="commandes confirmées + livrées"
        />
        <StatsCard
          title="En attente"
          value={stats.pendingOrders}
          subtitle="commandes à traiter"
        />
        <StatsCard
          title="Stock faible"
          value={stats.lowStockProducts}
          subtitle="produits ≤ 3 unités"
        />
      </div>
      <div className="mt-6 max-w-sm">
        <OrdersChart data={stats.ordersByDay} />
      </div>
    </div>
  );
}
```

**Step 4 : Vérifier la compilation TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

Expected: aucune erreur dans les nouveaux fichiers.

**Step 5 : Commit**

```bash
git add app/"(admin)"/admin/page.tsx components/admin/stats-card.tsx components/admin/orders-chart.tsx
git commit -m "feat: admin dashboard with stats cards and orders chart"
```

---

## Task 6 : Données admin produits

**Files:**
- Create: `lib/data/admin-products.ts`
- Create: `tests/lib/data/admin-products.test.ts`

**Step 1 : Écrire les tests**

Create `tests/lib/data/admin-products.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { buildProductFiltersForAdmin, PAGE_SIZE } from "@/lib/data/admin-products";

describe("admin products data", () => {
  it("exporte PAGE_SIZE = 25", () => {
    expect(PAGE_SIZE).toBe(25);
  });

  it("buildProductFiltersForAdmin sans filtres retourne undefined", () => {
    const result = buildProductFiltersForAdmin({});
    expect(result).toBeUndefined();
  });

  it("buildProductFiltersForAdmin avec category_id retourne une condition", () => {
    const result = buildProductFiltersForAdmin({ category_id: "smartphones" });
    expect(result).toBeDefined();
  });
});
```

**Step 2 : Vérifier que le test échoue**

```bash
bunx vitest run tests/lib/data/admin-products.test.ts
```

Expected: FAIL.

**Step 3 : Implémenter admin-products**

Create `lib/data/admin-products.ts` :

```typescript
import { eq, like, and, desc, sql } from "drizzle-orm";
import { products } from "@/lib/db/schema";
import type { Product } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export const PAGE_SIZE = 25;

export type AdminProductFilters = {
  search?: string;
  category_id?: string;
};

type ProductRow = typeof products.$inferSelect;

function parseAdminProduct(row: ProductRow): Product {
  return {
    ...row,
    images: (() => {
      try {
        const parsed = JSON.parse(row.images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })(),
    specs: (() => {
      try {
        return JSON.parse(row.specs) as Record<string, string>;
      } catch {
        return {};
      }
    })(),
    badge: row.badge as Product["badge"],
  };
}

export function buildProductFiltersForAdmin(filters: AdminProductFilters) {
  const conditions = [];
  if (filters.search) {
    conditions.push(like(products.name, `%${filters.search}%`));
  }
  if (filters.category_id) {
    conditions.push(eq(products.category_id, filters.category_id));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getAdminProducts(
  db: Db,
  filters: AdminProductFilters = {},
  page = 1
): Promise<{ products: Product[]; total: number }> {
  const where = buildProductFiltersForAdmin(filters);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.created_at))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ]);

  return {
    products: rows.map(parseAdminProduct),
    total: Number(countResult[0]?.count ?? 0),
  };
}

export async function getAdminProductById(db: Db, id: string): Promise<Product | null> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ? parseAdminProduct(rows[0]) : null;
}
```

**Step 4 : Vérifier que les tests passent**

```bash
bunx vitest run tests/lib/data/admin-products.test.ts
```

Expected: 3 tests PASS.

**Step 5 : Commit**

```bash
git add lib/data/admin-products.ts tests/lib/data/admin-products.test.ts
git commit -m "feat: admin products data layer (paginated list, filters, by-id)"
```

---

## Task 7 : Server Action upload R2 (presigned URL)

**Files:**
- Create: `lib/actions/admin-upload.ts`
- Create: `tests/lib/actions/admin-upload.test.ts`

**Step 1 : Écrire les tests**

Create `tests/lib/actions/admin-upload.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), listOrganizations: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({})),
  PutObjectCommand: vi.fn((input) => ({ input })),
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/presigned"),
}));

import { auth } from "@/lib/auth";
import { generatePresignedUrl } from "@/lib/actions/admin-upload";

describe("generatePresignedUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lève UNAUTHORIZED si pas de session", async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(generatePresignedUrl("test.jpg", "image/jpeg")).rejects.toThrow("UNAUTHORIZED");
  });

  it("lève UNAUTHORIZED si pas membre org", async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1", email: "admin@dbs.ci" },
    });
    (auth.api.listOrganizations as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await expect(generatePresignedUrl("test.jpg", "image/jpeg")).rejects.toThrow("UNAUTHORIZED");
  });

  it("retourne uploadUrl et publicUrl si autorisé", async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1", email: "admin@dbs.ci" },
    });
    (auth.api.listOrganizations as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "org1" }]);

    const result = await generatePresignedUrl("photo.jpg", "image/jpeg");
    expect(result).toMatchObject({
      uploadUrl: "https://r2.example.com/presigned",
      publicUrl: expect.stringContaining("photo.jpg"),
    });
  });
});
```

**Step 2 : Vérifier que le test échoue**

```bash
bunx vitest run tests/lib/actions/admin-upload.test.ts
```

Expected: FAIL.

**Step 3 : Implémenter la Server Action**

Create `lib/actions/admin-upload.ts` :

```typescript
"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function requireOrgMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");
  return session;
}

export async function generatePresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  const ext = filename.split(".").pop() ?? "jpg";
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
```

**Step 4 : Vérifier que les tests passent**

```bash
bunx vitest run tests/lib/actions/admin-upload.test.ts
```

Expected: 3 tests PASS.

**Step 5 : Commit**

```bash
git add lib/actions/admin-upload.ts tests/lib/actions/admin-upload.test.ts
git commit -m "feat: R2 presigned URL Server Action for product image upload"
```

---

## Task 8 : Server Actions produits (CRUD)

**Files:**
- Create: `lib/actions/admin-products.ts`
- Create: `tests/lib/actions/admin-products.test.ts`
- Modify: `lib/utils.ts` (ajouter slugify)

**Step 1 : Ajouter slugify dans lib/utils.ts**

Read `lib/utils.ts` puis ajouter à la fin :

```typescript
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
```

**Step 2 : Écrire les tests**

Create `tests/lib/actions/admin-products.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
  run: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), listOrganizations: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { validateProductData } from "@/lib/actions/admin-products";

function mockAuth() {
  (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: "u1", email: "admin@dbs.ci" },
  });
  (auth.api.listOrganizations as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "org1" }]);
}

describe("validateProductData", () => {
  it("accepte des données valides", () => {
    const result = validateProductData({
      name: "iPhone 15",
      slug: "iphone-15",
      category_id: "smartphones",
      price: 850000,
      brand: "Apple",
      stock: 10,
      description: "Super téléphone",
      images: ["https://cdn.dbs-store.ci/img.jpg"],
      specs: { Stockage: "256 Go" },
    });
    expect(result.success).toBe(true);
  });

  it("rejette un prix négatif", () => {
    const result = validateProductData({
      name: "Test",
      slug: "test",
      category_id: "smartphones",
      price: -1,
      brand: "X",
      stock: 0,
      description: "D",
      images: [],
      specs: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/prix/i);
  });

  it("rejette un nom vide", () => {
    const result = validateProductData({
      name: "",
      slug: "test",
      category_id: "smartphones",
      price: 10000,
      brand: "X",
      stock: 0,
      description: "D",
      images: [],
      specs: {},
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 3 : Vérifier que le test échoue**

```bash
bunx vitest run tests/lib/actions/admin-products.test.ts
```

Expected: FAIL.

**Step 4 : Implémenter les Server Actions produits**

Create `lib/actions/admin-products.ts` :

```typescript
"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import type { ProductBadge } from "@/lib/db/schema";

export type ProductFormData = {
  name: string;
  slug: string;
  category_id: string;
  subcategory_id?: string;
  price: number;
  old_price?: number;
  brand: string;
  stock: number;
  badge?: ProductBadge | null;
  is_active?: boolean;
  description: string;
  images: string[];
  specs: Record<string, string>;
};

export type ValidationResult =
  | { success: true }
  | { success: false; error: string };

export function validateProductData(data: ProductFormData): ValidationResult {
  if (!data.name?.trim()) return { success: false, error: "Le nom est requis" };
  if (!data.slug?.trim()) return { success: false, error: "Le slug est requis" };
  if (!data.category_id) return { success: false, error: "La catégorie est requise" };
  if (!data.brand?.trim()) return { success: false, error: "La marque est requise" };
  if (!data.description?.trim()) return { success: false, error: "La description est requise" };
  if (data.price < 0) return { success: false, error: "Le prix ne peut pas être négatif" };
  if (data.stock < 0) return { success: false, error: "Le stock ne peut pas être négatif" };
  return { success: true };
}

async function requireOrgMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");
  return session;
}

export async function createProduct(data: ProductFormData): Promise<{ error?: string }> {
  await requireOrgMember();

  const validation = validateProductData(data);
  if (!validation.success) return { error: validation.error };

  const db = getDb();
  const id = randomUUID();
  const now = new Date();

  try {
    await db.insert(products).values({
      id,
      name: data.name.trim(),
      slug: data.slug.trim(),
      category_id: data.category_id,
      subcategory_id: data.subcategory_id ?? null,
      price: data.price,
      old_price: data.old_price ?? null,
      brand: data.brand.trim(),
      stock: data.stock,
      badge: data.badge ?? null,
      is_active: data.is_active ?? true,
      description: data.description.trim(),
      images: JSON.stringify(data.images),
      specs: JSON.stringify(data.specs),
      created_at: now,
    });
  } catch (err) {
    console.error("[createProduct]", err);
    return { error: "Erreur lors de la création du produit" };
  }

  revalidatePath("/admin/produits");
  revalidatePath("/");
  redirect("/admin/produits");
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<{ error?: string }> {
  await requireOrgMember();

  const validation = validateProductData(data);
  if (!validation.success) return { error: validation.error };

  const db = getDb();

  try {
    await db
      .update(products)
      .set({
        name: data.name.trim(),
        slug: data.slug.trim(),
        category_id: data.category_id,
        subcategory_id: data.subcategory_id ?? null,
        price: data.price,
        old_price: data.old_price ?? null,
        brand: data.brand.trim(),
        stock: data.stock,
        badge: data.badge ?? null,
        is_active: data.is_active ?? true,
        description: data.description.trim(),
        images: JSON.stringify(data.images),
        specs: JSON.stringify(data.specs),
      })
      .where(eq(products.id, id));
  } catch (err) {
    console.error("[updateProduct]", err);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/admin/produits");
  revalidatePath(`/produits/${data.slug}`);
  revalidatePath("/");
  redirect("/admin/produits");
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  await requireOrgMember();
  const db = getDb();
  await db.update(products).set({ is_active: isActive }).where(eq(products.id, id));
  revalidatePath("/admin/produits");
}

export async function deleteProduct(id: string): Promise<void> {
  await requireOrgMember();
  const db = getDb();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/produits");
  revalidatePath("/");
}
```

**Step 5 : Vérifier que les tests passent**

```bash
bunx vitest run tests/lib/actions/admin-products.test.ts
```

Expected: 3 tests PASS.

**Step 6 : Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

Expected: pas d'erreurs dans les nouveaux fichiers.

**Step 7 : Commit**

```bash
git add lib/actions/admin-products.ts lib/utils.ts tests/lib/actions/admin-products.test.ts
git commit -m "feat: admin product CRUD Server Actions with validation"
```

---

## Task 9 : Composants formulaire produit

**Files:**
- Create: `components/admin/spec-editor.tsx`
- Create: `components/admin/image-uploader.tsx`
- Create: `components/admin/product-form.tsx`

**Step 1 : SpecEditor**

Create `components/admin/spec-editor.tsx` :

```typescript
"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SpecEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

export function SpecEditor({ specs, onChange }: SpecEditorProps) {
  const entries = Object.entries(specs);

  function updateKey(oldKey: string, newKey: string) {
    const next: Record<string, string> = {};
    for (const [k, v] of entries) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  }

  function updateValue(key: string, value: string) {
    onChange({ ...specs, [key]: value });
  }

  function removeEntry(key: string) {
    const next = { ...specs };
    delete next[key];
    onChange(next);
  }

  function addEntry() {
    const key = `Spec ${entries.length + 1}`;
    onChange({ ...specs, [key]: "" });
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <Input
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
            placeholder="Clé"
            className="w-40"
          />
          <Input
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder="Valeur"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEntry(key)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="mr-2 size-4" />
        Ajouter une spec
      </Button>
    </div>
  );
}
```

**Step 2 : ImageUploader**

Create `components/admin/image-uploader.tsx` :

```typescript
"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePresignedUrl } from "@/lib/actions/admin-upload";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const { uploadUrl, publicUrl } = await generatePresignedUrl(
          file.name,
          file.type
        );
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        uploaded.push(publicUrl);
      } catch (err) {
        setError(`Échec de l'upload de ${file.name}`);
        console.error(err);
      }
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
  }

  function removeImage(url: string) {
    onChange(images.filter((img) => img !== url));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative h-24 w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-full w-full rounded-md border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-1 -top-1 size-5"
              onClick={() => removeImage(url)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-muted/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Glisser des images ou <span className="text-primary underline">parcourir</span>
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
```

**Step 3 : ProductForm**

Create `components/admin/product-form.tsx` :

```typescript
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpecEditor } from "./spec-editor";
import { ImageUploader } from "./image-uploader";
import { slugify } from "@/lib/utils";
import { categories } from "@/lib/data/categories";
import type { ProductFormData, ValidationResult } from "@/lib/actions/admin-products";
import type { Product, ProductBadge } from "@/lib/db/schema";

const BADGE_OPTIONS: (ProductBadge | "")[] = ["", "Nouveau", "Populaire", "Promo"];

const topCategories = categories.filter((c) => c.parent_id === null);
const subCategories = categories.filter((c) => c.parent_id !== null);

interface ProductFormProps {
  initial?: Product;
  action: (data: ProductFormData) => Promise<{ error?: string }>;
  submitLabel: string;
}

export function ProductForm({ initial, action, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initial?.subcategory_id ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(String(initial?.old_price ?? ""));
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [stock, setStock] = useState(String(initial?.stock ?? "0"));
  const [badge, setBadge] = useState<ProductBadge | "">(initial?.badge ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [specs, setSpecs] = useState<Record<string, string>>(initial?.specs ?? {});
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!initial) setSlug(slugify(e.target.value));
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);

    const data: ProductFormData = {
      name,
      slug,
      category_id: categoryId,
      subcategory_id: subcategoryId || undefined,
      price: Number(price),
      old_price: oldPrice ? Number(oldPrice) : undefined,
      brand,
      stock: Number(stock),
      badge: badge || null,
      is_active: isActive,
      description,
      specs,
      images,
    };

    const result = await action(data);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
    // Si pas d'erreur, `action` a redirigé via `redirect()`
  }

  const filteredSubs = subCategories.filter((s) => s.parent_id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {serverError ? (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" value={name} onChange={handleNameChange} required />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9-]+"
          />
        </div>

        <div>
          <Label htmlFor="brand">Marque</Label>
          <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select value={categoryId} onValueChange={setCategoryId} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              {topCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredSubs.length > 0 ? (
          <div>
            <Label htmlFor="subcategory">Sous-catégorie</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="Optionnel" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="price">Prix (FCFA)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="old-price">Ancien prix (FCFA)</Label>
          <Input
            id="old-price"
            type="number"
            min={0}
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="Optionnel"
          />
        </div>

        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="badge">Badge</Label>
          <Select value={badge} onValueChange={(v) => setBadge(v as ProductBadge | "")}>
            <SelectTrigger id="badge">
              <SelectValue placeholder="Aucun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              <SelectItem value="Nouveau">Nouveau</SelectItem>
              <SelectItem value="Populaire">Populaire</SelectItem>
              <SelectItem value="Promo">Promo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <input
            id="is-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4"
          />
          <Label htmlFor="is-active" className="cursor-pointer">Produit actif (visible en boutique)</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div>
        <Label className="mb-3 block">Spécifications techniques</Label>
        <SpecEditor specs={specs} onChange={setSpecs} />
      </div>

      <div>
        <Label className="mb-3 block">Images</Label>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
```

**Step 4 : Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

Expected: pas d'erreur dans les composants créés.

**Step 5 : Commit**

```bash
git add components/admin/spec-editor.tsx components/admin/image-uploader.tsx components/admin/product-form.tsx
git commit -m "feat: admin product form components (spec editor, image uploader)"
```

---

## Task 10 : Pages produits (liste + création + édition)

**Files:**
- Create: `app/(admin)/admin/produits/page.tsx`
- Create: `app/(admin)/admin/produits/nouveau/page.tsx`
- Create: `app/(admin)/admin/produits/[id]/page.tsx`

**Step 1 : Page liste produits**

Create `app/(admin)/admin/produits/page.tsx` :

```typescript
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { getAdminProducts, PAGE_SIZE } from "@/lib/data/admin-products";
import { categories } from "@/lib/data/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleProductActive, deleteProduct } from "@/lib/actions/admin-products";

type Props = { searchParams: Promise<{ search?: string; cat?: string; page?: string }> };

const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

export default async function AdminProduitsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const db = getDb();
  const { products, total } = await getAdminProducts(
    db,
    { search: sp.search, category_id: sp.cat },
    page
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produits ({total})</h1>
        <Button asChild>
          <Link href="/admin/produits/nouveau">
            <Plus className="mr-2 size-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Produit</th>
              <th className="px-4 py-3 text-left font-medium">Catégorie</th>
              <th className="px-4 py-3 text-right font-medium">Prix</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Statut</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-md bg-muted" />
                    )}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {categoryMap[p.category_id] ?? p.category_id}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {new Intl.NumberFormat("fr-FR").format(p.price)} F
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={p.stock <= 3 ? "font-medium text-destructive" : ""}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={p.is_active ? "default" : "outline"}>
                    {p.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/produits/${p.id}`}>Éditer</Link>
                    </Button>
                    <form
                      action={async () => {
                        "use server";
                        await toggleProductActive(p.id, !p.is_active);
                      }}
                    >
                      <Button variant="ghost" size="sm" type="submit">
                        {p.is_active ? "Désactiver" : "Activer"}
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucun produit trouvé.
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`rounded px-3 py-1 text-sm ${
                p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

**Step 2 : Page création produit**

Create `app/(admin)/admin/produits/nouveau/page.tsx` :

```typescript
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/actions/admin-products";

export default function NouveauProduitPage() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Nouveau produit</h1>
      <ProductForm action={createProduct} submitLabel="Créer le produit" />
    </div>
  );
}
```

**Step 3 : Page édition produit**

Create `app/(admin)/admin/produits/[id]/page.tsx` :

```typescript
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getAdminProductById } from "@/lib/data/admin-products";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/lib/actions/admin-products";

type Props = { params: Promise<{ id: string }> };

export default async function EditProduitPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();
  const product = await getAdminProductById(db, id);
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Éditer : {product.name}</h1>
      <ProductForm initial={product} action={action} submitLabel="Enregistrer" />
    </div>
  );
}
```

**Step 4 : Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

**Step 5 : Commit**

```bash
git add app/"(admin)"/admin/produits/
git commit -m "feat: admin product pages (list, create, edit)"
```

---

## Task 11 : Données + Server Action commandes admin

**Files:**
- Create: `lib/data/admin-orders.ts`
- Create: `lib/actions/admin-orders.ts`
- Create: `tests/lib/data/admin-orders.test.ts`
- Create: `tests/lib/actions/admin-orders.test.ts`

**Step 1 : Tests données commandes**

Create `tests/lib/data/admin-orders.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/db/schema";

describe("ORDER_STATUS_TRANSITIONS", () => {
  it("pending peut aller vers confirmed et cancelled", () => {
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("confirmed");
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("cancelled");
  });

  it("delivered est un état final (pas de transitions)", () => {
    expect(ORDER_STATUS_TRANSITIONS.delivered).toHaveLength(0);
  });

  it("cancelled est un état final", () => {
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("confirmed → shipped ou cancelled", () => {
    expect(ORDER_STATUS_TRANSITIONS.confirmed).toContain("shipped");
    expect(ORDER_STATUS_TRANSITIONS.confirmed).toContain("cancelled");
  });

  it("shipped → delivered uniquement", () => {
    expect(ORDER_STATUS_TRANSITIONS.shipped).toEqual(["delivered"]);
  });
});
```

**Step 2 : Tests Server Action commandes**

Create `tests/lib/actions/admin-orders.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), listOrganizations: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/actions/admin-orders";

function mockAuth() {
  (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: "u1" },
  });
  (auth.api.listOrganizations as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "org1" }]);
}

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth();
  });

  it("lève INVALID_TRANSITION si transition non autorisée", async () => {
    mockDb.limit.mockResolvedValueOnce([
      { id: "o1", status: "delivered", payment_method: "cod" },
    ]);
    await expect(updateOrderStatus("o1", "pending")).rejects.toThrow("INVALID_TRANSITION");
  });

  it("lève ORDER_NOT_FOUND si commande introuvable", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await expect(updateOrderStatus("unknown", "confirmed")).rejects.toThrow("ORDER_NOT_FOUND");
  });
});
```

**Step 3 : Vérifier que les tests échouent**

```bash
bunx vitest run tests/lib/data/admin-orders.test.ts tests/lib/actions/admin-orders.test.ts
```

Expected: FAIL.

**Step 4 : Implémenter lib/data/admin-orders.ts**

Create `lib/data/admin-orders.ts` :

```typescript
import { desc, eq } from "drizzle-orm";
import { orders, order_items } from "@/lib/db/schema";
import type { Order, OrderItem, OrderStatus } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ORDERS_PAGE_SIZE = 30;

export async function getAdminOrders(
  db: Db,
  filters: { status?: OrderStatus } = {},
  page = 1
): Promise<Order[]> {
  const offset = (page - 1) * ORDERS_PAGE_SIZE;
  let query = db
    .select()
    .from(orders)
    .orderBy(desc(orders.created_at))
    .limit(ORDERS_PAGE_SIZE)
    .offset(offset);

  if (filters.status) {
    query = query.where(eq(orders.status, filters.status)) as typeof query;
  }

  return query;
}

export async function getAdminOrderById(
  db: Db,
  id: string
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(order_items).where(eq(order_items.order_id, id));
  return { order, items };
}
```

**Step 5 : Implémenter lib/actions/admin-orders.ts**

Create `lib/actions/admin-orders.ts` :

```typescript
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import type { OrderStatus } from "@/lib/db/schema";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/data/admin-orders";

async function requireOrgMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");
  return session;
}

export async function updateOrderStatus(id: string, newStatus: OrderStatus): Promise<void> {
  await requireOrgMember();
  const db = getDb();

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const allowed = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) throw new Error("INVALID_TRANSITION");

  const updateData: Partial<typeof orders.$inferInsert> = {
    status: newStatus,
    updated_at: new Date(),
  };

  // Paiement automatique à la livraison pour COD
  if (newStatus === "delivered" && order.payment_method === "cod") {
    updateData.payment_status = "paid";
  }

  await db.update(orders).set(updateData).where(eq(orders.id, id));

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${id}`);
}
```

**Step 6 : Vérifier que les tests passent**

```bash
bunx vitest run tests/lib/data/admin-orders.test.ts tests/lib/actions/admin-orders.test.ts
```

Expected: tous les tests PASS.

**Step 7 : Commit**

```bash
git add lib/data/admin-orders.ts lib/actions/admin-orders.ts tests/lib/data/admin-orders.test.ts tests/lib/actions/admin-orders.test.ts
git commit -m "feat: admin orders data layer and updateOrderStatus Server Action"
```

---

## Task 12 : Pages commandes admin

**Files:**
- Create: `app/(admin)/admin/commandes/page.tsx`
- Create: `app/(admin)/admin/commandes/[id]/page.tsx`
- Create: `components/admin/order-status-widget.tsx`

**Step 1 : Widget mise à jour statut (client)**

Create `components/admin/order-status-widget.tsx` :

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/lib/actions/admin-orders";
import type { OrderStatus } from "@/lib/db/schema";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/data/admin-orders";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Confirmer",
  confirmed: "Marquer expédiée",
  shipped: "Marquer livrée",
};

interface OrderStatusWidgetProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusWidget({ orderId, currentStatus }: OrderStatusWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);

  const transitions = ORDER_STATUS_TRANSITIONS[status];

  async function handleTransition(next: OrderStatus) {
    setLoading(true);
    setError(null);
    try {
      await updateOrderStatus(orderId, next);
      setStatus(next);
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Statut :</span>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {STATUS_LABELS[status]}
        </span>
      </div>

      {transitions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {transitions.map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === "cancelled" ? "destructive" : "default"}
              onClick={() => handleTransition(next)}
              disabled={loading}
            >
              {next === "cancelled" ? "Annuler" : NEXT_LABEL[status] ?? STATUS_LABELS[next]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">État final — aucune transition possible.</p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
```

**Step 2 : Page liste commandes**

Create `app/(admin)/admin/commandes/page.tsx` :

```typescript
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getAdminOrders } from "@/lib/data/admin-orders";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/db/schema";

type Props = { searchParams: Promise<{ status?: OrderStatus; page?: string }> };

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export default async function AdminCommandesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const db = getDb();
  const ordersList = await getAdminOrders(db, { status: sp.status }, page);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Commandes</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/commandes"
          className={`rounded-full px-3 py-1 text-sm ${
            !sp.status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Toutes
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/commandes?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm ${
              sp.status === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-center font-medium">Paiement</th>
              <th className="px-4 py-3 text-center font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {ordersList.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {order.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.shipping_name}</p>
                  <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {new Intl.NumberFormat("fr-FR").format(order.total)} F
                </td>
                <td className="px-4 py-3 text-center uppercase text-xs text-muted-foreground">
                  {order.payment_method}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={STATUS_VARIANT[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {order.created_at.toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="text-xs text-primary underline"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ordersList.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucune commande trouvée.
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

**Step 3 : Page détail commande**

Create `app/(admin)/admin/commandes/[id]/page.tsx` :

```typescript
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/lib/db";
import { getAdminOrderById } from "@/lib/data/admin-orders";
import { Badge } from "@/components/ui/badge";
import { OrderStatusWidget } from "@/components/admin/order-status-widget";
import type { OrderStatus } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default async function AdminCommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();
  const result = await getAdminOrderById(db, id);
  if (!result) notFound();

  const { order, items } = result;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/commandes" className="text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="inline size-4" /> Commandes
        </Link>
        <h1 className="text-xl font-bold">
          Commande <span className="font-mono">{order.id.slice(0, 8)}…</span>
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Livraison */}
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-semibold">Livraison</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nom</dt>
              <dd>{order.shipping_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd>{order.shipping_phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ville</dt>
              <dd>{order.shipping_city}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Adresse</dt>
              <dd className="text-right">{order.shipping_address}</dd>
            </div>
            {order.shipping_notes ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="text-right">{order.shipping_notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Statut */}
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-semibold">Statut</h2>
          <OrderStatusWidget orderId={order.id} currentStatus={order.status} />
          <div className="mt-3 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paiement</span>
              <span className="uppercase">{order.payment_method} — {order.payment_status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="mt-6 rounded-lg border bg-background">
        <h2 className="border-b px-4 py-3 font-semibold">Articles</h2>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Image
                src={item.product_image}
                alt={item.product_name}
                width={48}
                height={48}
                className="rounded-md object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × {new Intl.NumberFormat("fr-FR").format(item.unit_price)} F
                </p>
              </div>
              <p className="font-medium tabular-nums">
                {new Intl.NumberFormat("fr-FR").format(item.line_total)} F
              </p>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="border-t px-4 py-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Sous-total</span>
            <span>{new Intl.NumberFormat("fr-FR").format(order.subtotal)} F</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Livraison</span>
            <span>{order.shipping_fee === 0 ? "Gratuite" : `${order.shipping_fee} F`}</span>
          </div>
          <div className="mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{new Intl.NumberFormat("fr-FR").format(order.total)} F</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4 : Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

**Step 5 : Commit**

```bash
git add app/"(admin)"/admin/commandes/ components/admin/order-status-widget.tsx
git commit -m "feat: admin order pages (list with status filter, detail with status widget)"
```

---

## Task 13 : Gestion de l'équipe

**Files:**
- Create: `lib/actions/admin-team.ts`
- Create: `app/(admin)/admin/equipe/page.tsx`

**Step 1 : Server Actions équipe**

Create `lib/actions/admin-team.ts` :

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireOwner() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");

  // Vérifier le rôle owner via Better Auth
  const h = await headers();
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

export async function inviteMember(
  email: string,
  role: "admin" | "member"
): Promise<{ error?: string }> {
  try {
    const { orgId } = await requireOwner();
    await auth.api.inviteMember({
      body: { email, role, organizationId: orgId },
      headers: await headers(),
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Accès refusé" };
    return { error: "Erreur lors de l'invitation" };
  }
}

export async function updateMemberRole(
  memberId: string,
  role: "admin" | "member"
): Promise<{ error?: string }> {
  try {
    await requireOwner();
    await auth.api.updateMemberRole({
      body: { memberId, role },
      headers: await headers(),
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Accès refusé" };
    return { error: "Erreur lors de la mise à jour du rôle" };
  }
}

export async function removeMember(memberId: string): Promise<{ error?: string }> {
  try {
    await requireOwner();
    await auth.api.removeMember({
      body: { memberId },
      headers: await headers(),
    });
    revalidatePath("/admin/equipe");
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") return { error: "Accès refusé" };
    return { error: "Erreur lors de la suppression" };
  }
}
```

**Step 2 : Page équipe (composant client pour les actions)**

Create `app/(admin)/admin/equipe/page.tsx` :

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TeamManagement } from "@/components/admin/team-management";

export default async function AdminEquipePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const h = await headers();

  let members: Array<{ id: string; userId: string; role: string; user: { email: string; name: string } }> = [];
  let isOwner = false;

  try {
    const fullOrg = await auth.api.getFullOrganization({
      query: { organizationSlug: "dbs-store" },
      headers: h,
    });
    members = fullOrg?.members ?? [];
    const me = members.find((m) => m.userId === session?.user.id);
    isOwner = me?.role === "owner";
  } catch {
    members = [];
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Équipe</h1>
      <TeamManagement members={members} isOwner={isOwner} />
    </div>
  );
}
```

**Step 3 : Composant TeamManagement (client)**

Create `components/admin/team-management.tsx` :

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { inviteMember, updateMemberRole, removeMember } from "@/lib/actions/admin-team";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { email: string; name: string };
};

interface TeamManagementProps {
  members: Member[];
  isOwner: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

export function TeamManagement({ members: initial, isOwner }: TeamManagementProps) {
  const [members, setMembers] = useState(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setSuccess(null);
    const result = await inviteMember(email, role);
    if (result.error) {
      setInviteError(result.error);
    } else {
      setSuccess(`Invitation envoyée à ${email}`);
      setEmail("");
    }
    setInviting(false);
  }

  async function handleRoleChange(memberId: string, newRole: "admin" | "member") {
    const result = await updateMemberRole(memberId, newRole);
    if (!result.error) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    const result = await removeMember(memberId);
    if (!result.error) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Liste des membres */}
      <div className="rounded-lg border bg-background">
        <div className="border-b px-4 py-3 font-semibold">Membres ({members.length})</div>
        <div className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{m.user.name}</p>
                <p className="text-sm text-muted-foreground">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && m.role !== "owner" ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.id, v as "admin" | "member")}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="member">Membre</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                )}
                {isOwner && m.role !== "owner" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(m.id)}
                  >
                    Retirer
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire d'invitation (owner seulement) */}
      {isOwner ? (
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-4 font-semibold">Inviter un membre</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="member">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}
            {success ? (
              <p className="text-sm text-green-600">{success}</p>
            ) : null}
            <Button type="submit" disabled={inviting}>
              {inviting ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
```

**Step 4 : Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

**Step 5 : Commit**

```bash
git add app/"(admin)"/admin/equipe/ components/admin/team-management.tsx lib/actions/admin-team.ts
git commit -m "feat: admin team management page (list, invite, role change, remove)"
```

---

## Task 14 : Lien Administration dans AppBar + hook check-access

**Files:**
- Create: `hooks/use-is-admin.ts`
- Modify: `components/layout/app-bar/user-menu.tsx`
- Modify: `tests/components/layout/app-bar/user-menu.test.tsx`

**Step 1 : Hook useIsAdmin**

Create `hooks/use-is-admin.ts` :

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/check-access")
      .then((r) => r.json())
      .then((data: { isAdmin: boolean }) => {
        if (!cancelled) setIsAdmin(data.isAdmin);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => { cancelled = true; };
  }, [session?.user]);

  return isAdmin;
}
```

**Step 2 : Modifier UserMenu pour afficher le lien Admin**

Read `components/layout/app-bar/user-menu.tsx` puis modifier — ajouter l'import du hook et le lien Administration dans la section connectée.

Ajouter en haut, après les imports existants :
```typescript
import { useIsAdmin } from "@/hooks/use-is-admin";
import { LayoutDashboard } from "lucide-react";
```

Ajouter dans la fonction `UserMenu`, après `const router = useRouter();` :
```typescript
const isAdmin = useIsAdmin();
```

Ajouter dans le `DropdownMenuGroup` (après le lien "Mes commandes"), **avant** le `DropdownMenuSeparator` final :
```typescript
{isAdmin ? (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/admin">
        <LayoutDashboard className="mr-2 size-4" />
        Administration
      </Link>
    </DropdownMenuItem>
  </>
) : null}
```

**Step 3 : Mettre à jour le test UserMenu**

Ajouter dans `tests/components/layout/app-bar/user-menu.test.tsx` :

```typescript
// Ajouter dans les mocks en haut du fichier
vi.mock("@/hooks/use-is-admin", () => ({
  useIsAdmin: vi.fn(() => false),
}));
```

Et ajouter un test :
```typescript
it("affiche le lien Administration pour les membres org", () => {
  const { useIsAdmin } = require("@/hooks/use-is-admin");
  useIsAdmin.mockReturnValue(true);
  mockUseSession.mockReturnValue({
    data: { user: { name: "Admin", email: "admin@dbs.ci" } },
    isPending: false,
  });
  render(<UserMenu />);
  // Ouvrir le menu
  fireEvent.click(screen.getByRole("button", { name: /compte/i }));
  expect(screen.getByRole("menuitem", { name: /administration/i })).toBeInTheDocument();
});
```

**Step 4 : Vérifier que tous les tests passent**

```bash
bun run test
```

Expected: tous les tests PASS (ou même nombre de failures qu'avant = 0 régressions).

**Step 5 : Vérifier TypeScript**

```bash
bunx tsc --noEmit 2>&1 | head -20
```

**Step 6 : Commit**

```bash
git add hooks/use-is-admin.ts components/layout/app-bar/user-menu.tsx tests/components/layout/app-bar/user-menu.test.tsx
git commit -m "feat: show Administration link in AppBar for org members"
```

---

## Task 15 : Mettre à jour .env.example et vérification finale

**Files:**
- Modify: `.env.example`

**Step 1 : Ajouter les variables R2 dans .env.example**

Append dans `.env.example` :
```
# Cloudflare R2 — upload images produits
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://cdn.dbs-store.ci
```

**Step 2 : Lancer la suite de tests complète**

```bash
bun run test
```

Expected: tous les tests passent. Le nombre total de tests augmente.

**Step 3 : Vérifier ESLint (pas de nouvelles erreurs)**

```bash
bun run lint 2>&1 | grep -v "node_modules" | tail -20
```

Expected: les mêmes ~16 erreurs pré-existantes, aucune nouvelle erreur dans `app/(admin)/` ou `components/admin/`.

**Step 4 : Commit final**

```bash
git add .env.example
git commit -m "docs: add R2 env vars to .env.example"
```

---

## Récapitulatif des routes créées

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard stats |
| `/admin/produits` | Liste produits (paginée) |
| `/admin/produits/nouveau` | Créer un produit |
| `/admin/produits/[id]` | Éditer un produit |
| `/admin/commandes` | Liste commandes (filtres statut) |
| `/admin/commandes/[id]` | Détail + mise à jour statut |
| `/admin/equipe` | Membres + invitations |
| `/api/admin/check-access` | Check appartenance org (pour AppBar) |

## Note sur auth.api

Les méthodes `auth.api.listOrganizations`, `auth.api.getFullOrganization`, `auth.api.inviteMember`, `auth.api.updateMemberRole`, `auth.api.removeMember` sont fournies par le plugin `organization` de Better Auth. Si une méthode n'est pas disponible, consulter la [documentation Better Auth Organization](https://www.better-auth.com/docs/plugins/organization) pour l'alternative.
