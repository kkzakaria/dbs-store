# Email Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Block access to protected routes for unverified users, send OTP automatically after sign-up, and add `/verifier-email` + `/email-non-verifie` pages.

**Architecture:** The middleware gains an `emailVerified` check that redirects unverified users to `/email-non-verifie`. The inscription page sends an OTP then redirects to `/verifier-email` on success. Both new pages use `authClient.emailOtp` from Better Auth's emailOTP plugin (already configured). All patterns follow the existing `/reinitialiser` + `/mot-de-passe-oublie` pages.

**Tech Stack:** Next.js 16 App Router, Better Auth `emailOTP` plugin (`authClient.emailOtp.verifyEmail`, `authClient.emailOtp.sendVerificationOtp`), Vitest + React Testing Library.

---

### Task 1: Update middleware — add emailVerified check

**Files:**
- Modify: `middleware.ts:20-24`
- Modify: `tests/middleware.test.ts`

**Step 1: Write the failing test**

In `tests/middleware.test.ts`, add one new test inside `describe("middleware")` and update two existing tests to include `emailVerified: true`.

Update the two existing "allows" tests — change `{ user: { id: "1", name: "Test" } }` to `{ user: { id: "1", name: "Test", emailVerified: true } }`:

```typescript
it("allows authenticated users through for /compte routes", async () => {
  mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: true } });
  // ...
});

it("allows org members through on /admin routes", async () => {
  mockGetSession.mockResolvedValue({ user: { id: "1", name: "Admin", emailVerified: true } });
  // ...
});
```

Add new test after "redirects to /connexion with callbackUrl when not authenticated":

```typescript
it("redirects to /email-non-verifie when authenticated user has unverified email", async () => {
  mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: false } });

  const response = await middleware(createRequest("/compte/profil"));
  const location = new URL(response.headers.get("location")!);

  expect(response.status).toBe(307);
  expect(location.pathname).toBe("/email-non-verifie");
});
```

**Step 2: Run tests to confirm they fail**

```bash
bun run test tests/middleware.test.ts
```

Expected: 2 failures — "allows authenticated" tests fail because `emailVerified` is now checked but missing.

**Step 3: Update `middleware.ts`**

Add the `emailVerified` check after the `!session?.user` block (lines 20-24):

```typescript
// Not authenticated — redirect to sign-in
if (!session?.user) {
  const signInUrl = new URL("/connexion", request.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

// Authenticated but email not verified — redirect to email-non-verifie
if (!session.user.emailVerified) {
  return NextResponse.redirect(new URL("/email-non-verifie", request.url));
}
```

**Step 4: Run tests to confirm they pass**

```bash
bun run test tests/middleware.test.ts
```

Expected: all 8 tests passing.

**Step 5: Commit**

```bash
git add middleware.ts tests/middleware.test.ts
git commit -m "feat: redirect unverified users to /email-non-verifie in middleware"
```

---

### Task 2: Create `/verifier-email` page — TDD

**Files:**
- Create: `app/(auth)/verifier-email/page.tsx`
- Create: `tests/app/auth/verifier-email.test.tsx`

**Step 1: Write the failing tests**

Create `tests/app/auth/verifier-email.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyEmailPage from "@/app/(auth)/verifier-email/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      verifyEmail: vi.fn(),
      sendVerificationOtp: vi.fn(),
    },
  },
}));

import { authClient } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("otp_email", "test@exemple.com");
  vi.mocked(authClient.emailOtp.verifyEmail).mockResolvedValue({ data: {}, error: null });
  vi.mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({ data: {}, error: null });
});

describe("VerifyEmailPage", () => {
  it("renders heading", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByText("Vérifiez votre email")).toBeInTheDocument();
  });

  it("renders 6 OTP input fields", () => {
    render(<VerifyEmailPage />);
    expect(screen.getAllByRole("textbox", { name: /chiffre/i })).toHaveLength(6);
  });

  it("renders submit button", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByRole("button", { name: /vérifier/i })).toBeInTheDocument();
  });

  it("renders resend button", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByRole("button", { name: /renvoyer/i })).toBeInTheDocument();
  });

  it("redirects to /inscription when email not in sessionStorage", async () => {
    sessionStorage.removeItem("otp_email");
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/inscription");
    });
  });

  it("calls verifyEmail with email and otp on submit", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.verifyEmail).mockImplementation((_data, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({ data: {}, error: null });
    });
    render(<VerifyEmailPage />);
    const inputs = screen.getAllByRole("textbox", { name: /chiffre/i });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }
    await user.click(screen.getByRole("button", { name: /vérifier/i }));
    expect(authClient.emailOtp.verifyEmail).toHaveBeenCalledWith(
      { email: "test@exemple.com", otp: "123456" },
      expect.any(Object)
    );
  });

  it("shows error when OTP is invalid", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.verifyEmail).mockImplementation((_data, callbacks: any) => {
      callbacks?.onError?.({ error: { message: "Code incorrect ou expiré" } });
      return Promise.resolve({ data: null, error: { message: "Code incorrect ou expiré" } });
    });
    render(<VerifyEmailPage />);
    const inputs = screen.getAllByRole("textbox", { name: /chiffre/i });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], "1");
    }
    await user.click(screen.getByRole("button", { name: /vérifier/i }));
    expect(screen.getByText(/incorrect ou expiré/i)).toBeInTheDocument();
  });

  it("redirects to / and clears sessionStorage on success", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.verifyEmail).mockImplementation((_data, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({ data: {}, error: null });
    });
    render(<VerifyEmailPage />);
    const inputs = screen.getAllByRole("textbox", { name: /chiffre/i });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], "1");
    }
    await user.click(screen.getByRole("button", { name: /vérifier/i }));
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(sessionStorage.getItem("otp_email")).toBeNull();
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
bun run test tests/app/auth/verifier-email.test.tsx
```

Expected: FAIL — `Cannot find module '@/app/(auth)/verifier-email/page'`

**Step 3: Create `app/(auth)/verifier-email/page.tsx`**

```typescript
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { authClient } from "@/lib/auth-client";

function maskEmail(e: string) {
  const [local, domain] = e.split("@");
  if (!local || !domain) return e;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = sessionStorage.getItem("otp_email"); } catch { }
    if (!stored) {
      router.replace("/inscription");
      return;
    }
    setEmail(stored);
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres");
      return;
    }
    setLoading(true);
    try {
      await authClient.emailOtp.verifyEmail(
        { email, otp },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Code incorrect ou expiré. Réessayez.");
          },
          onSuccess: () => {
            try { sessionStorage.removeItem("otp_email"); } catch { }
            router.push("/");
          },
        }
      );
    } catch {
      setError("Impossible de vérifier le code. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !email) return;
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      setResendCooldown(60);
    } catch {
      setError("Impossible d'envoyer le code. Vérifiez votre connexion internet.");
    }
  }

  return (
    <AuthCard
      title="Vérifiez votre email"
      description={email ? `Code envoyé à ${maskEmail(email)}` : "Chargement..."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Entrez le code à 6 chiffres reçu par email
          </p>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? "Vérification..." : "Vérifier mon email"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Vous n'avez pas reçu le code ?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}
        </button>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
```

**Step 4: Run tests to confirm they pass**

```bash
bun run test tests/app/auth/verifier-email.test.tsx
```

Expected: 8 tests passing.

**Step 5: Commit**

```bash
git add app/(auth)/verifier-email/page.tsx tests/app/auth/verifier-email.test.tsx
git commit -m "feat: add /verifier-email page with OTP verification"
```

---

### Task 3: Create `/email-non-verifie` page — TDD

**Files:**
- Create: `app/(auth)/email-non-verifie/page.tsx`
- Create: `tests/app/auth/email-non-verifie.test.tsx`

**Step 1: Write the failing tests**

Create `tests/app/auth/email-non-verifie.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailNotVerifiedPage from "@/app/(auth)/email-non-verifie/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn(),
    },
    useSession: vi.fn(),
  },
  signOut: vi.fn().mockResolvedValue({}),
}));

import { authClient, signOut } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { email: "test@exemple.com" } },
  } as any);
  vi.mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({ data: {}, error: null });
});

describe("EmailNotVerifiedPage", () => {
  it("renders heading", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByText("Vérifiez votre email")).toBeInTheDocument();
  });

  it("renders masked email in description", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByText(/t\*+@exemple\.com/)).toBeInTheDocument();
  });

  it("renders resend button", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByRole("button", { name: /renvoyer le code/i })).toBeInTheDocument();
  });

  it("renders sign out link", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByRole("button", { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it("calls sendVerificationOtp and redirects to /verifier-email on resend", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.sendVerificationOtp).mockImplementation((_data, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({ data: {}, error: null });
    });
    render(<EmailNotVerifiedPage />);
    await user.click(screen.getByRole("button", { name: /renvoyer le code/i }));
    expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith(
      { email: "test@exemple.com", type: "email-verification" },
      expect.any(Object)
    );
    expect(mockPush).toHaveBeenCalledWith("/verifier-email");
  });

  it("calls signOut and redirects to /connexion on sign out", async () => {
    const user = userEvent.setup();
    render(<EmailNotVerifiedPage />);
    await user.click(screen.getByRole("button", { name: /se déconnecter/i }));
    expect(signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/connexion");
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
bun run test tests/app/auth/email-non-verifie.test.tsx
```

Expected: FAIL — `Cannot find module '@/app/(auth)/email-non-verifie/page'`

**Step 3: Create `app/(auth)/email-non-verifie/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient, signOut } from "@/lib/auth-client";

function maskEmail(e: string) {
  const [local, domain] = e.split("@");
  if (!local || !domain) return e;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default function EmailNotVerifiedPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = session?.user?.email ?? "";

  async function handleResend() {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await authClient.emailOtp.sendVerificationOtp(
        { email, type: "email-verification" },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Impossible d'envoyer le code.");
          },
          onSuccess: () => {
            try { sessionStorage.setItem("otp_email", email); } catch { }
            router.push("/verifier-email");
          },
        }
      );
    } catch {
      setError("Impossible d'envoyer le code. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/connexion");
  }

  return (
    <AuthCard
      title="Vérifiez votre email"
      description={email ? `Un code de vérification a été envoyé à ${maskEmail(email)}` : "Votre email n'est pas vérifié"}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Votre adresse email n'a pas encore été vérifiée. Accédez à votre boîte mail et entrez le code reçu, ou demandez-en un nouveau.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button onClick={handleResend} className="w-full" disabled={loading || !email}>
          {loading ? "Envoi..." : "Renvoyer le code"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-primary hover:underline"
          >
            Se déconnecter
          </button>
        </p>
      </div>
    </AuthCard>
  );
}
```

**Step 4: Run tests to confirm they pass**

```bash
bun run test tests/app/auth/email-non-verifie.test.tsx
```

Expected: 6 tests passing.

**Step 5: Commit**

```bash
git add app/(auth)/email-non-verifie/page.tsx tests/app/auth/email-non-verifie.test.tsx
git commit -m "feat: add /email-non-verifie page with resend and sign out"
```

---

### Task 4: Update inscription — send OTP and redirect to /verifier-email

**Files:**
- Modify: `app/(auth)/inscription/page.tsx:14,31-45`
- Modify: `tests/app/auth/inscription.test.tsx`

**Step 1: Write the failing test**

In `tests/app/auth/inscription.test.tsx`, the existing mock needs `authClient` with `emailOtp.sendVerificationOtp`. Update the mock and add a test:

Update the vi.mock to add authClient:

```typescript
vi.mock("@/lib/auth-client", () => ({
  signUp: { email: vi.fn() },
  signIn: { social: vi.fn() },
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));
```

Add a new test:

```typescript
it("sends verification OTP and redirects to /verifier-email after successful sign-up", async () => {
  const user = userEvent.setup();
  vi.mocked(signUp.email).mockImplementation((_data, callbacks: any) => {
    callbacks?.onSuccess?.();
    return Promise.resolve({});
  });

  render(<SignUpPage />);
  await user.type(screen.getByLabelText(/nom/i), "Test User");
  await user.type(screen.getByLabelText(/email/i), "test@exemple.com");
  await user.type(screen.getByLabelText(/^mot de passe$/i), "Password1!");
  await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/verifier-email");
  });
});
```

Also add `waitFor` to the import and `mockPush` setup:

```typescript
import { render, screen, waitFor } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));
```

**Step 2: Run tests to confirm they fail**

```bash
bun run test tests/app/auth/inscription.test.tsx
```

Expected: FAIL — new test fails (currently redirects to `/`, not `/verifier-email`).

**Step 3: Update `app/(auth)/inscription/page.tsx`**

Add `authClient` import (after existing `signUp` import):

```typescript
import { signUp, authClient } from "@/lib/auth-client";
```

Replace the `onSuccess` callback:

```typescript
onSuccess: async () => {
  try {
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
  } catch {
    // Silent — user can resend from /email-non-verifie
  }
  try { sessionStorage.setItem("otp_email", email); } catch { }
  router.push("/verifier-email");
},
```

Remove `router.refresh()` — it's no longer needed (user goes to verification instead of home).

**Step 4: Run tests to confirm they pass**

```bash
bun run test tests/app/auth/inscription.test.tsx
```

Expected: all tests passing.

**Step 5: Run full test suite**

```bash
bun run test
```

Expected: all tests passing.

**Step 6: Commit**

```bash
git add app/(auth)/inscription/page.tsx tests/app/auth/inscription.test.tsx
git commit -m "feat: send email verification OTP after sign-up, redirect to /verifier-email"
```

---

## Notes

- `authClient.emailOtp.verifyEmail({ email, otp })` marks `emailVerified=true` in the DB — Better Auth handles this automatically via the emailOTP plugin.
- Social sign-in users (Google, Facebook) have `emailVerified=true` set by Better Auth automatically — they bypass the verification flow entirely.
- The 60-second resend cooldown on `/verifier-email` is UI-only (no server-side rate limit), sufficient for the current scope.
- OTP expires after 5 minutes (configured in `lib/auth.ts` via `expiresIn: 300`).
