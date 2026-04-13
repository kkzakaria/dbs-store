# Phase 8 — Newsletter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow visitors to subscribe to the DBS Store newsletter from the homepage, with anti-spam protection (honeypot + KV rate limit), silent duplicate handling, and a prepared unsubscribe page.

**Architecture:** New D1 table `newsletter_subscribers` with email, token, is_active. Server actions for subscribe/unsubscribe. Client component replaces the static homepage newsletter block. Rate limit helper uses a dedicated KV namespace. Unsubscribe page reads token from query params.

**Tech Stack:** Next.js 16, Drizzle ORM, Cloudflare D1, Cloudflare KV, Vitest, React Testing Library

---

### Task 1: D1 Migration — `newsletter_subscribers` table

**Files:**
- Create: `migrations/0004_newsletter_subscribers.sql`

- [ ] **Step 1: Create the migration file**

```sql
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "is_active" INTEGER NOT NULL DEFAULT 1,
  "created_at" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_newsletter_subscribers_email"
  ON "newsletter_subscribers" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_newsletter_subscribers_token"
  ON "newsletter_subscribers" ("token");
```

- [ ] **Step 2: Add Drizzle schema**

In `lib/db/schema.ts`, add after the `failed_emails` table:

```typescript
// -- Newsletter Subscribers ------------------------------------------------

export const newsletter_subscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  token: text("token").notNull().unique(),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type NewsletterSubscriber = typeof newsletter_subscribers.$inferSelect;
```

- [ ] **Step 3: Apply migration to dev DB**

Run: `bun run db:migrate:dev`
Expected: Migration applied, table created in `./dev.db`

- [ ] **Step 4: Verify table exists**

Run: `sqlite3 ./dev.db ".schema newsletter_subscribers"`
Expected: CREATE TABLE with all columns and indexes

- [ ] **Step 5: Commit**

```bash
git add migrations/0004_newsletter_subscribers.sql lib/db/schema.ts
git commit -m "feat(newsletter): add newsletter_subscribers table and schema"
```

---

### Task 2: KV namespace + rate limit helper

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `worker-configuration.d.ts`
- Create: `lib/kv.ts`
- Create: `lib/rate-limit.ts`
- Create: `tests/lib/rate-limit.test.ts`

- [ ] **Step 1: Write the failing test for `checkRateLimit`**

Create `tests/lib/rate-limit.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

vi.mock("@/lib/kv", () => ({
  getKv: vi.fn().mockResolvedValue(mockKvStore),
}));

const { checkRateLimit } = await import("@/lib/rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkRateLimit", () => {
  it("allows the first request (no existing key)", async () => {
    mockKvStore.get.mockResolvedValue(null);
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(true);
    expect(mockKvStore.put).toHaveBeenCalledWith("test-key", "1", { expirationTtl: 3600 });
  });

  it("allows requests under the limit", async () => {
    mockKvStore.get.mockResolvedValue("2");
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(true);
    expect(mockKvStore.put).toHaveBeenCalledWith("test-key", "3", { expirationTtl: 3600 });
  });

  it("blocks requests at the limit", async () => {
    mockKvStore.get.mockResolvedValue("3");
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(false);
    expect(mockKvStore.put).not.toHaveBeenCalled();
  });

  it("blocks requests over the limit", async () => {
    mockKvStore.get.mockResolvedValue("5");
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- tests/lib/rate-limit.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create `lib/kv.ts`**

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getKv(): Promise<KVNamespace | null> {
  if (process.env.NODE_ENV === "development" && !process.env.USE_D1) {
    return null;
  }
  try {
    const { env } = await getCloudflareContext<CloudflareEnv>();
    return env.KV_RATE_LIMIT ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Create `lib/rate-limit.ts`**

```typescript
import { getKv } from "@/lib/kv";

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const kv = await getKv();
  if (!kv) return true; // No KV available (dev mode) — allow

  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= maxAttempts) return false;

  await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return true;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test -- tests/lib/rate-limit.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 6: Add KV binding to `wrangler.jsonc`**

Add to the `kv_namespaces` array:

```jsonc
{
  "binding": "KV_RATE_LIMIT",
  "id": "<to-be-created-in-prod>"
}
```

- [ ] **Step 7: Add KV type to `worker-configuration.d.ts`**

Add to `CloudflareEnv`:

```typescript
KV_RATE_LIMIT?: KVNamespace;
```

- [ ] **Step 8: Commit**

```bash
git add lib/kv.ts lib/rate-limit.ts tests/lib/rate-limit.test.ts wrangler.jsonc worker-configuration.d.ts
git commit -m "feat(newsletter): add KV rate limit helper and namespace"
```

---

### Task 3: Server action — `subscribeNewsletter`

**Files:**
- Create: `lib/actions/newsletter.ts`
- Create: `tests/lib/actions/newsletter.test.ts`

- [ ] **Step 1: Write failing tests for `subscribeNewsletter`**

Create `tests/lib/actions/newsletter.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
}));

const mockHeaders = vi.fn().mockResolvedValue(new Headers());
vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

const { subscribeNewsletter } = await import("@/lib/actions/newsletter");
const { checkRateLimit } = await import("@/lib/rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
  (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(true);
});

describe("subscribeNewsletter", () => {
  it("returns error when data is not an object", async () => {
    const result = await subscribeNewsletter("string");
    expect(result.error).toBeDefined();
  });

  it("returns error when email is missing", async () => {
    const result = await subscribeNewsletter({ email: "" });
    expect(result.error).toBeDefined();
  });

  it("returns error when email format is invalid", async () => {
    const result = await subscribeNewsletter({ email: "not-email" });
    expect(result.error).toBeDefined();
  });

  it("returns error when honeypot field is filled", async () => {
    const result = await subscribeNewsletter({ email: "test@example.ci", website: "spam" });
    expect(result.error).toBeDefined();
  });

  it("returns error when rate limited", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const result = await subscribeNewsletter({ email: "test@example.ci" });
    expect(result.error).toBeDefined();
  });

  it("returns success silently when email already exists", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "existing" }]),
      }),
    });
    const result = await subscribeNewsletter({ email: "existing@test.ci" });
    expect(result.success).toBe(true);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("inserts new subscriber on valid input", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    const result = await subscribeNewsletter({ email: "new@test.ci" });
    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("normalizes email to lowercase and trimmed", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });
    await subscribeNewsletter({ email: "  TEST@Example.CI  " });
    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.email).toBe("test@example.ci");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- tests/lib/actions/newsletter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `lib/actions/newsletter.ts`**

```typescript
"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { newsletter_subscribers } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

type NewsletterResult = { success: true } | { success?: never; error: string };

export async function subscribeNewsletter(data: unknown): Promise<NewsletterResult> {
  if (!data || typeof data !== "object") {
    return { error: "Donnees invalides." };
  }

  const obj = data as Record<string, unknown>;

  // Honeypot check
  if (typeof obj.website === "string" && obj.website.length > 0) {
    return { error: "Donnees invalides." };
  }

  const rawEmail = typeof obj.email === "string" ? obj.email : "";
  const email = rawEmail.trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Veuillez entrer une adresse email valide." };
  }

  if (email.length > 254) {
    return { error: "Veuillez entrer une adresse email valide." };
  }

  // Rate limit by IP
  const hdrs = await headers();
  const ip = hdrs.get("cf-connecting-ip") ?? hdrs.get("x-forwarded-for") ?? "unknown";
  const allowed = await checkRateLimit(`newsletter-rl:${ip}`, 3, 3600);
  if (!allowed) {
    return { error: "Trop de tentatives. Veuillez reessayer plus tard." };
  }

  const db = await getDb();

  // Check for existing subscriber — silent success
  const existing = await db
    .select()
    .from(newsletter_subscribers)
    .where(eq(newsletter_subscribers.email, email));

  if (existing.length > 0) {
    return { success: true };
  }

  await db.insert(newsletter_subscribers).values({
    id: randomUUID(),
    email,
    token: randomUUID(),
    is_active: true,
    created_at: new Date(),
  });

  return { success: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- tests/lib/actions/newsletter.test.ts`
Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add lib/actions/newsletter.ts tests/lib/actions/newsletter.test.ts
git commit -m "feat(newsletter): add subscribeNewsletter server action with tests"
```

---

### Task 4: Server action — `unsubscribeNewsletter`

**Files:**
- Modify: `lib/actions/newsletter.ts`
- Modify: `tests/lib/actions/newsletter.test.ts`

- [ ] **Step 1: Write failing tests for `unsubscribeNewsletter`**

Append to `tests/lib/actions/newsletter.test.ts`:

```typescript
const { unsubscribeNewsletter } = await import("@/lib/actions/newsletter");

describe("unsubscribeNewsletter", () => {
  it("returns error when token is not a string", async () => {
    const result = await unsubscribeNewsletter(123 as unknown as string);
    expect(result.error).toBeDefined();
  });

  it("returns error when token is empty", async () => {
    const result = await unsubscribeNewsletter("");
    expect(result.error).toBeDefined();
  });

  it("returns error when token is not found", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    const result = await unsubscribeNewsletter("non-existent-token");
    expect(result.error).toBeDefined();
  });

  it("sets is_active to false for valid token", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "sub-1", token: "valid-token" }]),
      }),
    });
    const mockSet = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockDb.update = vi.fn().mockReturnValue({ set: mockSet });
    const result = await unsubscribeNewsletter("valid-token");
    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- tests/lib/actions/newsletter.test.ts`
Expected: FAIL — `unsubscribeNewsletter` not exported

- [ ] **Step 3: Implement `unsubscribeNewsletter`**

Add to `lib/actions/newsletter.ts`:

```typescript
export async function unsubscribeNewsletter(token: unknown): Promise<NewsletterResult> {
  if (typeof token !== "string" || token.trim().length === 0) {
    return { error: "Lien de desinscription invalide." };
  }

  const db = await getDb();

  const existing = await db
    .select()
    .from(newsletter_subscribers)
    .where(eq(newsletter_subscribers.token, token.trim()));

  if (existing.length === 0) {
    return { error: "Lien de desinscription invalide." };
  }

  await db
    .update(newsletter_subscribers)
    .set({ is_active: false })
    .where(eq(newsletter_subscribers.token, token.trim()));

  return { success: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- tests/lib/actions/newsletter.test.ts`
Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add lib/actions/newsletter.ts tests/lib/actions/newsletter.test.ts
git commit -m "feat(newsletter): add unsubscribeNewsletter server action with tests"
```

---

### Task 5: Newsletter form component

**Files:**
- Create: `components/newsletter-form.tsx`
- Create: `tests/components/newsletter-form.test.tsx`

- [ ] **Step 1: Write failing tests for `NewsletterForm`**

Create `tests/components/newsletter-form.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterForm } from "@/components/newsletter-form";

describe("NewsletterForm", () => {
  it("renders email input and submit button", () => {
    render(<NewsletterForm />);
    expect(screen.getByPlaceholderText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it("renders hidden honeypot field", () => {
    render(<NewsletterForm />);
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot.getAttribute("aria-hidden")).toBe("true");
    expect(honeypot.tabIndex).toBe(-1);
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ success: true });
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "test@example.ci");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(await screen.findByText(/merci/i)).toBeInTheDocument();
  });

  it("shows error message on failure", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ error: "Email invalide" });
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "bad");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
  });

  it("disables button while submitting", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn(() => new Promise<{ success: true }>(() => {}));
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "test@example.ci");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("passes honeypot value to action", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ success: true });
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "test@example.ci");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(mockAction).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.ci", website: "" })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- tests/components/newsletter-form.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `components/newsletter-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/actions/newsletter";

type NewsletterResult = { success: true } | { success?: never; error: string };

type NewsletterFormProps = {
  action?: (data: { email: string; website: string }) => Promise<NewsletterResult>;
};

export function NewsletterForm({ action }: NewsletterFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const website = formData.get("website") as string;

    try {
      const submit = action ?? subscribeNewsletter;
      const result = await submit({ email, website });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="text-sm font-medium text-green-600">
        Merci pour votre inscription !
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm gap-2">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input
        type="email"
        name="email"
        placeholder="Votre adresse email"
        required
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "..." : "S\u2019inscrire"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- tests/components/newsletter-form.test.tsx`
Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add components/newsletter-form.tsx tests/components/newsletter-form.test.tsx
git commit -m "feat(newsletter): add NewsletterForm client component with tests"
```

---

### Task 6: Wire newsletter form into homepage

**Files:**
- Modify: `app/(main)/page.tsx`

- [ ] **Step 1: Replace static newsletter block with component**

In `app/(main)/page.tsx`, replace the static newsletter section (lines 142-159) with:

```tsx
import { NewsletterForm } from "@/components/newsletter-form";
```

Add the import at the top, then replace the section content:

```tsx
      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="rounded-2xl bg-muted p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold">Restez informe</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Inscrivez-vous a notre newsletter pour recevoir nos offres exclusives
            et les dernieres nouveautes.
          </p>
          <div className="mt-6">
            <NewsletterForm />
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Verify the homepage renders**

Run: `bun run dev` and open `http://localhost:33000`
Expected: Newsletter section shows the new form with email input and button

- [ ] **Step 3: Commit**

```bash
git add "app/(main)/page.tsx"
git commit -m "feat(newsletter): wire NewsletterForm into homepage"
```

---

### Task 7: Unsubscribe page

**Files:**
- Create: `app/(main)/newsletter/unsubscribe/page.tsx`
- Create: `tests/app/newsletter-unsubscribe.test.tsx`

- [ ] **Step 1: Write failing tests for unsubscribe page**

Create `tests/app/newsletter-unsubscribe.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUnsubscribe = vi.fn();

vi.mock("@/lib/actions/newsletter", () => ({
  unsubscribeNewsletter: (...args: unknown[]) => mockUnsubscribe(...args),
}));

const { default: UnsubscribePage } = await import(
  "@/app/(main)/newsletter/unsubscribe/page"
);

describe("UnsubscribePage", () => {
  it("shows error when no token is provided", async () => {
    const page = await UnsubscribePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByText(/invalide/i)).toBeInTheDocument();
  });

  it("shows success message for valid token", async () => {
    mockUnsubscribe.mockResolvedValue({ success: true });
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "valid-token" }),
    });
    render(page);
    expect(screen.getByText(/desinscrit/i)).toBeInTheDocument();
  });

  it("shows error message for invalid token", async () => {
    mockUnsubscribe.mockResolvedValue({ error: "Lien invalide" });
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "bad-token" }),
    });
    render(page);
    expect(screen.getByText(/invalide/i)).toBeInTheDocument();
  });

  it("shows a link back to homepage", async () => {
    mockUnsubscribe.mockResolvedValue({ success: true });
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "valid-token" }),
    });
    render(page);
    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- tests/app/newsletter-unsubscribe.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement unsubscribe page**

Create `app/(main)/newsletter/unsubscribe/page.tsx`:

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { unsubscribeNewsletter } from "@/lib/actions/newsletter";

export const metadata: Metadata = {
  title: "Desinscription newsletter — DBS Store",
  description: "Desinscription de la newsletter DBS Store.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  let success = false;
  let errorMessage = "";

  if (!token) {
    errorMessage = "Lien de desinscription invalide.";
  } else {
    const result = await unsubscribeNewsletter(token);
    if ("error" in result && result.error) {
      errorMessage = result.error;
    } else {
      success = true;
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {success ? (
        <>
          <h1 className="text-2xl font-bold">Vous avez ete desinscrit</h1>
          <p className="mt-2 text-muted-foreground">
            Vous ne recevrez plus nos emails. Vous pouvez vous reinscrire a tout moment.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Erreur</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        </>
      )}
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
      >
        Retour a l&apos;accueil
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- tests/app/newsletter-unsubscribe.test.tsx`
Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/newsletter/unsubscribe/page.tsx" tests/app/newsletter-unsubscribe.test.tsx
git commit -m "feat(newsletter): add unsubscribe page with tests"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full test suite**

Run: `bun run test`
Expected: All tests pass, no regressions

- [ ] **Step 2: Run lint**

Run: `bun run lint`
Expected: No new lint errors (pre-existing warnings are OK)

- [ ] **Step 3: Run build**

Run: `bun run build`
Expected: Build succeeds

- [ ] **Step 4: Test manually in dev**

Run: `bun run dev`, open `http://localhost:33000`
- Subscribe with valid email → "Merci pour votre inscription !"
- Subscribe again with same email → same success message
- Check `./dev.db`: `SELECT * FROM newsletter_subscribers;` → row exists
- Visit `/newsletter/unsubscribe?token=<token-from-db>` → "Vous avez ete desinscrit"
- Visit `/newsletter/unsubscribe` (no token) → error message

- [ ] **Step 5: Commit any fixes and final commit**

If fixes were needed, commit them. Otherwise, no action.
