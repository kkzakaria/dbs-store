# Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Better Auth with Organization plugin to authenticate store customers and admin staff, with custom Shadcn auth pages in French.

**Architecture:** Better Auth server instance with email/password + Google/Facebook/Apple social providers, Organization plugin for staff roles (owner/admin/member). SQLite via better-sqlite3 in dev. Next.js middleware protects `/admin/*` and `/compte/*` routes. Custom auth pages under `(auth)` route group.

**Tech Stack:** Better Auth, better-sqlite3, Next.js 16 App Router, React 19, Shadcn UI, Tailwind CSS v4, Vitest

---

### Task 1: Install dependencies and create env file

**Files:**
- Modify: `package.json`
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Install Better Auth and SQLite**

Run:
```bash
bun add better-auth better-sqlite3
bun add -d @types/better-sqlite3
```

**Step 2: Create `.env.example`**

```env
# Better Auth
BETTER_AUTH_SECRET=          # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:33000

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth — Facebook
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# OAuth — Apple
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Database
DATABASE_URL=./dev.db
```

**Step 3: Create `.env.local` from example**

Copy `.env.example` to `.env.local` and fill in `BETTER_AUTH_SECRET` with a generated value:
```bash
openssl rand -base64 32
```

Set `BETTER_AUTH_URL=http://localhost:33000` and `DATABASE_URL=./dev.db`. Leave OAuth values empty for now (social login won't work until filled in, but email/password will).

**Step 4: Add to `.gitignore`**

Append these lines if not already present:
```
*.db
*.db-journal
```

**Step 5: Commit**

```bash
git add package.json bun.lock .env.example .gitignore
git commit -m "chore: add better-auth and better-sqlite3 dependencies"
```

---

### Task 2: Create permissions module

**Files:**
- Create: `lib/auth/permissions.ts`
- Create: `tests/lib/auth/permissions.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/auth/permissions.test.ts
import { describe, it, expect } from "vitest";
import { ac, owner, admin, member } from "@/lib/auth/permissions";

describe("permissions", () => {
  it("exports an access control instance", () => {
    expect(ac).toBeDefined();
  });

  it("defines owner role with full permissions", () => {
    expect(owner).toBeDefined();
  });

  it("defines admin role", () => {
    expect(admin).toBeDefined();
  });

  it("defines member role", () => {
    expect(member).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/lib/auth/permissions.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// lib/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  product: ["create", "read", "update", "delete"],
  order: ["read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  product: ["create", "read", "update", "delete"],
  order: ["read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
  product: ["create", "read", "update", "delete"],
  order: ["read", "update"],
  member: ["read"],
});

export const member = ac.newRole({
  product: ["read"],
  order: ["read"],
  member: ["read"],
});
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/lib/auth/permissions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth/permissions.ts tests/lib/auth/permissions.test.ts
git commit -m "feat(auth): add RBAC permissions for organization roles"
```

---

### Task 3: Create Better Auth server config

**Files:**
- Create: `lib/auth.ts`

**Step 1: Write the server configuration**

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import { ac, owner, admin, member } from "@/lib/auth/permissions";

export const auth = betterAuth({
  database: new Database(process.env.DATABASE_URL || "./dev.db"),

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
  ],
});

export type Auth = typeof auth;
```

**Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(auth): add Better Auth server configuration"
```

---

### Task 4: Create Better Auth client

**Files:**
- Create: `lib/auth-client.ts`

**Step 1: Write the client**

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:33000",
  plugins: [organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;
```

**Step 2: Add `NEXT_PUBLIC_BETTER_AUTH_URL` to `.env.example` and `.env.local`**

Add to both files:
```env
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:33000
```

**Step 3: Commit**

```bash
git add lib/auth-client.ts .env.example
git commit -m "feat(auth): add Better Auth client with organization plugin"
```

---

### Task 5: Create API route handler

**Files:**
- Create: `app/api/auth/[...all]/route.ts`

**Step 1: Write the route handler**

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

**Step 2: Verify the dev server starts without errors**

Run: `bun run dev`
Check: No startup errors. Visit `http://localhost:33000/api/auth/ok` — should return a JSON response indicating Better Auth is running.

**Step 3: Commit**

```bash
git add app/api/auth/
git commit -m "feat(auth): add Better Auth API route handler"
```

---

### Task 6: Generate Better Auth database tables

**Files:**
- Database: `dev.db` (auto-generated, gitignored)

**Step 1: Run Better Auth CLI to generate/migrate tables**

Run:
```bash
bunx @better-auth/cli generate
```

This creates the migration SQL. Then push to the local SQLite database:

```bash
bunx @better-auth/cli migrate
```

**Step 2: Verify tables exist**

Run: `bunx @better-auth/cli` and check the output lists the expected tables (user, session, account, verification, organization, member, invitation).

No commit needed — `dev.db` is gitignored.

---

### Task 7: Create auth shared components

**Files:**
- Create: `components/auth/auth-card.tsx`
- Create: `components/auth/social-buttons.tsx`
- Create: `tests/components/auth/auth-card.test.tsx`
- Create: `tests/components/auth/social-buttons.test.tsx`

**Step 1: Write the AuthCard test**

```typescript
// tests/components/auth/auth-card.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthCard } from "@/components/auth/auth-card";

describe("AuthCard", () => {
  it("renders title", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>content</div>
      </AuthCard>
    );
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>content</div>
      </AuthCard>
    );
    expect(screen.getByText("Connectez-vous")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <AuthCard title="Connexion" description="Connectez-vous">
        <div>test content</div>
      </AuthCard>
    );
    expect(screen.getByText("test content")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/auth/auth-card.test.tsx`
Expected: FAIL — module not found

**Step 3: Write AuthCard**

```tsx
// components/auth/auth-card.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
      {footer}
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/components/auth/auth-card.test.tsx`
Expected: PASS

**Step 5: Write SocialButtons test**

```typescript
// tests/components/auth/social-buttons.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialButtons } from "@/components/auth/social-buttons";

describe("SocialButtons", () => {
  it("renders Google button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders Facebook button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /facebook/i })).toBeInTheDocument();
  });

  it("renders Apple button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
  });
});
```

**Step 6: Run test to verify it fails**

Run: `bun run test tests/components/auth/social-buttons.test.tsx`
Expected: FAIL — module not found

**Step 7: Write SocialButtons**

This is a client component that calls `signIn.social()` from the auth client.

```tsx
// components/auth/social-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

const providers = [
  { id: "google" as const, label: "Google" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "apple" as const, label: "Apple" },
];

export function SocialButtons() {
  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className="w-full"
          onClick={() =>
            signIn.social({ provider: provider.id, callbackURL: "/" })
          }
        >
          {provider.label}
        </Button>
      ))}
    </div>
  );
}
```

**Step 8: Run test to verify it passes**

Run: `bun run test tests/components/auth/social-buttons.test.tsx`
Expected: PASS

Note: The `signIn` import from auth-client uses `better-auth/react` which may need a mock in tests. If the import fails in vitest, add a mock in the test file:
```typescript
vi.mock("@/lib/auth-client", () => ({
  signIn: { social: vi.fn() },
}));
```

**Step 9: Commit**

```bash
git add components/auth/ tests/components/auth/
git commit -m "feat(auth): add AuthCard and SocialButtons shared components"
```

---

### Task 8: Create sign-in page (`/connexion`)

**Files:**
- Create: `app/(auth)/connexion/page.tsx`
- Create: `app/(auth)/layout.tsx`
- Create: `tests/app/auth/connexion.test.tsx`

**Step 1: Write the test**

```typescript
// tests/app/auth/connexion.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignInPage from "@/app/(auth)/connexion/page";

vi.mock("@/lib/auth-client", () => ({
  signIn: { email: vi.fn(), social: vi.fn() },
}));

describe("SignInPage", () => {
  it("renders sign-in heading", () => {
    render(<SignInPage />);
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("renders link to inscription", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /créer un compte/i })).toHaveAttribute("href", "/inscription");
  });

  it("renders link to forgot password", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /mot de passe oublié/i })).toHaveAttribute("href", "/mot-de-passe-oublie");
  });

  it("renders social login buttons", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/app/auth/connexion.test.tsx`
Expected: FAIL

**Step 3: Write the auth layout**

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center p-4">
      {children}
    </div>
  );
}
```

**Step 4: Write the sign-in page**

```tsx
// app/(auth)/connexion/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn.email(
      { email, password },
      {
        onError: (ctx) => {
          setError(ctx.error.message ?? "Une erreur est survenue");
        },
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      }
    );

    setLoading(false);
  }

  return (
    <AuthCard
      title="Connexion"
      description="Connectez-vous à votre compte"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          ou
        </span>
      </div>

      <SocialButtons />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthCard>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `bun run test tests/app/auth/connexion.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add app/\(auth\)/ tests/app/auth/
git commit -m "feat(auth): add sign-in page with email/password and social login"
```

---

### Task 9: Create sign-up page (`/inscription`)

**Files:**
- Create: `app/(auth)/inscription/page.tsx`
- Create: `tests/app/auth/inscription.test.tsx`

**Step 1: Write the test**

```typescript
// tests/app/auth/inscription.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignUpPage from "@/app/(auth)/inscription/page";

vi.mock("@/lib/auth-client", () => ({
  signUp: { email: vi.fn() },
  signIn: { social: vi.fn() },
}));

describe("SignUpPage", () => {
  it("renders sign-up heading", () => {
    render(<SignUpPage />);
    expect(screen.getByText("Créer un compte")).toBeInTheDocument();
  });

  it("renders name input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it("renders link to connexion", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("link", { name: /se connecter/i })).toHaveAttribute("href", "/connexion");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/app/auth/inscription.test.tsx`
Expected: FAIL

**Step 3: Write the sign-up page**

```tsx
// app/(auth)/inscription/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await signUp.email(
      { name, email, password },
      {
        onError: (ctx) => {
          setError(ctx.error.message ?? "Une erreur est survenue");
        },
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      }
    );

    setLoading(false);
  }

  return (
    <AuthCard
      title="Créer un compte"
      description="Inscrivez-vous pour commencer vos achats"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            type="text"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Inscription..." : "S'inscrire"}
        </Button>
      </form>

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
          ou
        </span>
      </div>

      <SocialButtons />

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/app/auth/inscription.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/\(auth\)/inscription/ tests/app/auth/inscription.test.tsx
git commit -m "feat(auth): add sign-up page"
```

---

### Task 10: Create forgot password page (`/mot-de-passe-oublie`)

**Files:**
- Create: `app/(auth)/mot-de-passe-oublie/page.tsx`
- Create: `tests/app/auth/mot-de-passe-oublie.test.tsx`

**Step 1: Write the test**

```typescript
// tests/app/auth/mot-de-passe-oublie.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ForgotPasswordPage from "@/app/(auth)/mot-de-passe-oublie/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: { forgetPassword: vi.fn() },
}));

describe("ForgotPasswordPage", () => {
  it("renders heading", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Mot de passe oublié")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();
  });

  it("renders link back to connexion", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("link", { name: /retour/i })).toHaveAttribute("href", "/connexion");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/app/auth/mot-de-passe-oublie.test.tsx`
Expected: FAIL

**Step 3: Write the page**

```tsx
// app/(auth)/mot-de-passe-oublie/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await authClient.forgetPassword(
      { email, redirectTo: "/reinitialiser" },
      {
        onError: (ctx) => {
          setError(ctx.error.message ?? "Une erreur est survenue");
        },
        onSuccess: () => {
          setSent(true);
        },
      }
    );

    setLoading(false);
  }

  if (sent) {
    return (
      <AuthCard
        title="Email envoyé"
        description="Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation."
      >
        <Link
          href="/connexion"
          className="text-sm text-primary hover:underline"
        >
          Retour à la connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Entrez votre email pour recevoir un lien de réinitialisation"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/connexion" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </AuthCard>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/app/auth/mot-de-passe-oublie.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/\(auth\)/mot-de-passe-oublie/ tests/app/auth/mot-de-passe-oublie.test.tsx
git commit -m "feat(auth): add forgot password page"
```

---

### Task 11: Create reset password page (`/reinitialiser`)

**Files:**
- Create: `app/(auth)/reinitialiser/page.tsx`
- Create: `tests/app/auth/reinitialiser.test.tsx`

**Step 1: Write the test**

```typescript
// tests/app/auth/reinitialiser.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ResetPasswordPage from "@/app/(auth)/reinitialiser/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: { resetPassword: vi.fn() },
}));

// Mock useSearchParams
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("token=test-token"),
}));

describe("ResetPasswordPage", () => {
  it("renders heading", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Nouveau mot de passe")).toBeInTheDocument();
  });

  it("renders new password input", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
  });

  it("renders confirm password input", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("button", { name: /réinitialiser/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/app/auth/reinitialiser.test.tsx`
Expected: FAIL

**Step 3: Write the page**

```tsx
// app/(auth)/reinitialiser/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onError: (ctx) => {
          setError(ctx.error.message ?? "Une erreur est survenue");
        },
        onSuccess: () => {
          router.push("/connexion");
        },
      }
    );

    setLoading(false);
  }

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisissez un nouveau mot de passe"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </Button>
      </form>
    </AuthCard>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/app/auth/reinitialiser.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/\(auth\)/reinitialiser/ tests/app/auth/reinitialiser.test.tsx
git commit -m "feat(auth): add reset password page"
```

---

### Task 12: Create Next.js middleware for route protection

**Files:**
- Create: `middleware.ts` (project root)
- Create: `tests/middleware.test.ts`

**Step 1: Write the test**

Testing Next.js middleware requires mocking `next/server`. Write focused unit tests:

```typescript
// tests/middleware.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Better Auth — must be before middleware import
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// We test the route matching logic, not the full middleware execution.
// The middleware config export defines which routes are protected.

describe("middleware config", () => {
  it("exports matcher for admin and compte routes", async () => {
    const { config } = await import("@/middleware");
    expect(config.matcher).toContain("/admin/:path*");
    expect(config.matcher).toContain("/compte/:path*");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/middleware.test.ts`
Expected: FAIL — module not found

**Step 3: Write the middleware**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = request.nextUrl;

  // Not authenticated — redirect to sign-in
  if (!session?.user) {
    const signInUrl = new URL("/connexion", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes — check org membership
  if (pathname.startsWith("/admin")) {
    const members = await auth.api.listOrganizationMembers({
      headers: request.headers,
      query: { organizationSlug: "dbs-store" },
    }).catch(() => null);

    const isMember = members?.data?.some(
      (m: { userId: string }) => m.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
```

**Important note:** The org membership check may need adjustment based on the exact Better Auth API. The `listOrganizationMembers` endpoint might work differently — check the Better Auth docs for the correct API. An alternative approach is to use `auth.api.getFullOrganization()` or check session metadata. Adapt accordingly during implementation.

**Step 4: Run test to verify it passes**

Run: `bun run test tests/middleware.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add middleware.ts tests/middleware.test.ts
git commit -m "feat(auth): add middleware to protect admin and account routes"
```

---

### Task 13: Update UserMenu with session awareness

**Files:**
- Modify: `components/layout/app-bar/user-menu.tsx`
- Modify: `tests/components/layout/app-bar/user-menu.test.tsx`

**Step 1: Update the test**

```typescript
// tests/components/layout/app-bar/user-menu.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/layout/app-bar/user-menu";

// Mock auth client
const mockUseSession = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
  signOut: mockSignOut,
}));

describe("UserMenu", () => {
  it("renders login link when not authenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    render(<UserMenu />);
    expect(screen.getByRole("link", { name: /compte/i })).toHaveAttribute("href", "/connexion");
  });

  it("renders user button when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Test User", email: "test@example.com" } },
      isPending: false,
    });
    render(<UserMenu />);
    expect(screen.getByRole("button", { name: /compte/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify current tests fail (due to mock change)**

Run: `bun run test tests/components/layout/app-bar/user-menu.test.tsx`
Expected: May fail due to missing mock

**Step 3: Rewrite UserMenu**

```tsx
// components/layout/app-bar/user-menu.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingBag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Compte">
        <User className="size-5" />
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/connexion" aria-label="Compte">
          <User className="size-5" />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Compte">
          <User className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium">{session.user.name}</span>
          <span className="block text-xs text-muted-foreground">{session.user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/compte">
              <Settings className="mr-2 size-4" />
              Mon compte
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/compte/commandes">
              <ShoppingBag className="mr-2 size-4" />
              Mes commandes
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="mr-2 size-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Note:** The admin link ("Administration") will be added later when we have a way to check org membership on the client. For now, staff can navigate to `/admin` directly. The middleware protects the route.

**Step 4: Run test to verify it passes**

Run: `bun run test tests/components/layout/app-bar/user-menu.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/layout/app-bar/user-menu.tsx tests/components/layout/app-bar/user-menu.test.tsx
git commit -m "feat(auth): update UserMenu with session-aware dropdown"
```

---

### Task 14: Create seed script for initial organization

**Files:**
- Create: `scripts/seed-org.ts`

**Step 1: Write the seed script**

```typescript
// scripts/seed-org.ts
import { auth } from "../lib/auth";

const OWNER_EMAIL = "admin@dbs-store.ci";
const OWNER_PASSWORD = "changeme123!";
const OWNER_NAME = "Admin DBS";
const ORG_NAME = "DBS Store";
const ORG_SLUG = "dbs-store";

async function seed() {
  console.log("Creating owner account...");

  // Create the owner user
  const signUpResult = await auth.api.signUpEmail({
    body: {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
    },
  });

  if (!signUpResult?.user) {
    console.error("Failed to create owner account");
    process.exit(1);
  }

  console.log(`Owner created: ${signUpResult.user.email}`);

  // Create the organization
  console.log("Creating organization...");
  const org = await auth.api.createOrganization({
    body: {
      name: ORG_NAME,
      slug: ORG_SLUG,
    },
    headers: {
      // Use the session from signup
      Authorization: `Bearer ${signUpResult.token}`,
    },
  });

  console.log(`Organization created: ${ORG_NAME} (${ORG_SLUG})`);
  console.log("\nSeed complete!");
  console.log(`\nLogin with:\n  Email: ${OWNER_EMAIL}\n  Password: ${OWNER_PASSWORD}`);
  console.log("\n⚠️  Change the password after first login!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
```

**Step 2: Add a seed script to package.json**

Add to `scripts` in `package.json`:
```json
"seed": "bun run scripts/seed-org.ts"
```

**Step 3: Run the seed**

Run: `bun run seed`
Expected: Output showing owner account and organization creation.

**Note:** The exact API for creating organizations and setting roles may differ. Check Better Auth docs during implementation. The creator of an organization is automatically assigned the `owner` role.

**Step 4: Commit**

```bash
git add scripts/seed-org.ts package.json
git commit -m "feat(auth): add seed script for initial organization"
```

---

### Task 15: Run all tests and verify build

**Step 1: Run all tests**

Run: `bun run test`
Expected: All tests pass.

**Step 2: Run lint**

Run: `bun run lint`
Expected: No errors.

**Step 3: Verify dev server**

Run: `bun run dev`
Check manually:
- Visit `/connexion` — sign-in form renders
- Visit `/inscription` — sign-up form renders
- Visit `/mot-de-passe-oublie` — forgot password form renders
- Sign up with test credentials → redirects to home, UserMenu shows dropdown
- Sign out → UserMenu shows login link again
- Visit `/compte` while signed out → redirects to `/connexion`
- Visit `/admin` while signed out → redirects to `/connexion`

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(auth): address test and lint issues"
```

---

## Summary of files created/modified

### New files
| File | Purpose |
|------|---------|
| `lib/auth.ts` | Better Auth server config |
| `lib/auth-client.ts` | Better Auth client |
| `lib/auth/permissions.ts` | RBAC permissions |
| `app/api/auth/[...all]/route.ts` | API route handler |
| `app/(auth)/layout.tsx` | Auth pages layout |
| `app/(auth)/connexion/page.tsx` | Sign-in page |
| `app/(auth)/inscription/page.tsx` | Sign-up page |
| `app/(auth)/mot-de-passe-oublie/page.tsx` | Forgot password |
| `app/(auth)/reinitialiser/page.tsx` | Reset password |
| `components/auth/auth-card.tsx` | Shared auth card wrapper |
| `components/auth/social-buttons.tsx` | Social login buttons |
| `middleware.ts` | Route protection |
| `scripts/seed-org.ts` | Seed initial org + owner |
| `.env.example` | Environment template |
| `tests/lib/auth/permissions.test.ts` | Permissions tests |
| `tests/components/auth/auth-card.test.tsx` | AuthCard tests |
| `tests/components/auth/social-buttons.test.tsx` | SocialButtons tests |
| `tests/app/auth/connexion.test.tsx` | Sign-in tests |
| `tests/app/auth/inscription.test.tsx` | Sign-up tests |
| `tests/app/auth/mot-de-passe-oublie.test.tsx` | Forgot password tests |
| `tests/app/auth/reinitialiser.test.tsx` | Reset password tests |
| `tests/middleware.test.ts` | Middleware tests |

### Modified files
| File | Change |
|------|--------|
| `package.json` | New deps + seed script |
| `.gitignore` | Add `*.db` patterns |
| `components/layout/app-bar/user-menu.tsx` | Session-aware dropdown |
| `tests/components/layout/app-bar/user-menu.test.tsx` | Updated for new UserMenu |
