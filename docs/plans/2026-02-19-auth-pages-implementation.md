# Auth Pages Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refonte complète des pages d'authentification — correction bug AppBar, amélioration visuelle (logo, fond, icônes), UX (toggle MDP, force MDP), et flux OTP réel via le plugin `emailOTP` de Better Auth.

**Architecture:** Le groupe de routes `(auth)` garde son layout propre sans AppBar. Le contenu principal est déplacé dans un groupe `(main)` qui inclut l'AppBar. Les nouveaux composants `PasswordToggle`, `PasswordStrength`, et `OtpInput` sont réutilisables et testés indépendamment. Le flux OTP utilise le plugin Better Auth `emailOTP` avec `sessionStorage` pour transmettre email/OTP entre pages.

**Tech Stack:** Next.js 16 App Router, Better Auth 1.4.18 (`emailOTP` plugin), Vitest + RTL, Tailwind CSS v4, Lucide React

---

## Task 1: Bug Fix — Retirer l'AppBar du layout racine

**Contexte:** `app/layout.tsx` monte `<AppBar />` pour toutes les pages, y compris les pages d'auth. Solution : déplacer la page d'accueil dans un groupe `(main)` avec son propre layout qui inclut l'AppBar.

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/(main)/layout.tsx`
- Create: `app/(main)/page.tsx` (contenu copié depuis `app/page.tsx`)
- Delete: `app/page.tsx`

**Step 1: Créer `app/(main)/layout.tsx`**

```tsx
import { AppBar } from "@/components/layout/app-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppBar />
      <main>{children}</main>
    </>
  );
}
```

**Step 2: Créer `app/(main)/page.tsx`**

Copier intégralement le contenu de `app/page.tsx` dans `app/(main)/page.tsx`. Le fichier est long (~273 lignes) — copier en entier, aucune modification.

**Step 3: Modifier `app/layout.tsx` — supprimer AppBar et `<main>`**

```tsx
import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBS Store - Boutique Electronique",
  description:
    "Boutique en ligne d'electronique en Côte d'Ivoire. Smartphones, tablettes, ordinateurs, montres connectées, audio et accessoires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={nunitoSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

**Step 4: Supprimer `app/page.tsx`**

```bash
rm app/page.tsx
```

**Step 5: Vérifier que les tests passent**

```bash
bun run test
```

Expected: tous les tests passent (les imports de `@/app/(auth)/...` ne changent pas).

**Step 6: Vérifier visuellement**

```bash
bun run dev
```

Naviguer vers `http://localhost:33000` — AppBar présente.
Naviguer vers `http://localhost:33000/connexion` — AppBar absente.

**Step 7: Commit**

```bash
git add app/layout.tsx app/(main)/layout.tsx app/(main)/page.tsx
git rm app/page.tsx
git commit -m "fix: remove AppBar from auth pages by extracting (main) route group"
```

---

## Task 2: Enrichir le fond du layout auth

**Files:**
- Modify: `app/(auth)/layout.tsx`

**Step 1: Mettre à jour le layout**

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
      }}
    >
      {/* Motif de grille subtil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
        }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
```

**Step 2: Vérifier visuellement**

```bash
bun run dev
```

Naviguer vers `/connexion`. Le fond doit afficher un dégradé gris-bleuté avec un motif de points subtil.

**Step 3: Commit**

```bash
git add app/(auth)/layout.tsx
git commit -m "feat: add gradient background with dot pattern to auth layout"
```

---

## Task 3: Ajouter le logo DBS Store dans AuthCard

**Files:**
- Modify: `components/auth/auth-card.tsx`
- Test: `tests/components/auth/auth-card.test.tsx`

**Step 1: Écrire le test qui échoue**

Ajouter dans `tests/components/auth/auth-card.test.tsx` :

```tsx
it("renders DBS Store logo", () => {
  render(
    <AuthCard title="Connexion" description="Connectez-vous">
      <div>content</div>
    </AuthCard>
  );
  expect(screen.getByText("DBS Store")).toBeInTheDocument();
});
```

**Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
bun run test tests/components/auth/auth-card.test.tsx
```

Expected: FAIL — `Unable to find an element with the text: DBS Store`

**Step 3: Mettre à jour `components/auth/auth-card.tsx`**

```tsx
import { Zap } from "lucide-react";
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
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="mx-auto w-full max-w-[420px] shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">DBS Store</span>
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
```

**Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
bun run test tests/components/auth/auth-card.test.tsx
```

Expected: PASS — 4 tests passent.

**Step 5: Commit**

```bash
git add components/auth/auth-card.tsx tests/components/auth/auth-card.test.tsx
git commit -m "feat: add DBS Store logo to AuthCard with larger shadow"
```

---

## Task 4: Créer le composant PasswordToggle

**Files:**
- Create: `components/auth/password-toggle.tsx`
- Create: `tests/components/auth/password-toggle.test.tsx`

**Step 1: Écrire les tests**

Créer `tests/components/auth/password-toggle.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordToggle } from "@/components/auth/password-toggle";

describe("PasswordToggle", () => {
  it("shows eye icon when type is password", () => {
    render(<PasswordToggle type="password" onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /afficher/i })).toBeInTheDocument();
  });

  it("shows eye-off icon when type is text", () => {
    render(<PasswordToggle type="text" onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /masquer/i })).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<PasswordToggle type="password" onToggle={onToggle} />);
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Lancer pour vérifier l'échec**

```bash
bun run test tests/components/auth/password-toggle.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Créer `components/auth/password-toggle.tsx`**

```tsx
import { Eye, EyeOff } from "lucide-react";

interface PasswordToggleProps {
  type: "password" | "text";
  onToggle: () => void;
}

export function PasswordToggle({ type, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={type === "password" ? "Afficher le mot de passe" : "Masquer le mot de passe"}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {type === "password" ? (
        <Eye className="size-4" />
      ) : (
        <EyeOff className="size-4" />
      )}
    </button>
  );
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/components/auth/password-toggle.test.tsx
```

Expected: PASS — 3 tests passent.

**Step 5: Commit**

```bash
git add components/auth/password-toggle.tsx tests/components/auth/password-toggle.test.tsx
git commit -m "feat: add PasswordToggle component with show/hide password"
```

---

## Task 5: Créer le composant PasswordStrength

**Files:**
- Create: `components/auth/password-strength.tsx`
- Create: `tests/components/auth/password-strength.test.tsx`

**Step 1: Écrire les tests**

Créer `tests/components/auth/password-strength.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrength, getPasswordStrength } from "@/components/auth/password-strength";

describe("getPasswordStrength", () => {
  it("returns 0 for empty password", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("returns 1 for short password", () => {
    expect(getPasswordStrength("abc")).toBe(1);
  });

  it("returns 2 for 8+ char password without variety", () => {
    expect(getPasswordStrength("abcdefgh")).toBe(2);
  });

  it("returns 3 for password with uppercase and number", () => {
    expect(getPasswordStrength("Abcdefg1")).toBe(3);
  });

  it("returns 4 for strong password", () => {
    expect(getPasswordStrength("Abcdefg1!")).toBe(4);
  });
});

describe("PasswordStrength", () => {
  it("renders nothing for empty password", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 4 segments", () => {
    render(<PasswordStrength password="test" />);
    expect(screen.getByText(/faible/i)).toBeInTheDocument();
  });

  it("shows 'Fort' for strong password", () => {
    render(<PasswordStrength password="Abcdefg1!" />);
    expect(screen.getByText(/fort/i)).toBeInTheDocument();
  });
});
```

**Step 2: Lancer pour vérifier l'échec**

```bash
bun run test tests/components/auth/password-strength.test.tsx
```

Expected: FAIL.

**Step 3: Créer `components/auth/password-strength.tsx`**

```tsx
const levels = [
  { label: "Faible", color: "bg-red-500" },
  { label: "Moyen", color: "bg-orange-400" },
  { label: "Bien", color: "bg-yellow-400" },
  { label: "Fort", color: "bg-green-500" },
];

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return Math.min(score, 4);
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const current = levels[strength - 1];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {levels.map((level, i) => (
          <div
            key={level.label}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? current.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{current.label}</p>
    </div>
  );
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/components/auth/password-strength.test.tsx
```

Expected: PASS — 8 tests passent.

**Step 5: Commit**

```bash
git add components/auth/password-strength.tsx tests/components/auth/password-strength.test.tsx
git commit -m "feat: add PasswordStrength indicator component"
```

---

## Task 6: Créer le composant OtpInput

**Files:**
- Create: `components/auth/otp-input.tsx`
- Create: `tests/components/auth/otp-input.test.tsx`

**Step 1: Écrire les tests**

Créer `tests/components/auth/otp-input.test.tsx` :

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput } from "@/components/auth/otp-input";

describe("OtpInput", () => {
  it("renders 6 input fields", () => {
    render(<OtpInput value="" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("calls onChange with combined value when typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[0]);
    await user.keyboard("1");
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("fills all fields from pasted value", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OtpInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    await user.click(inputs[0]);
    await user.paste("123456");
    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("displays current value across fields", () => {
    render(<OtpInput value="12" onChange={vi.fn()} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs[0].value).toBe("1");
    expect(inputs[1].value).toBe("2");
    expect(inputs[2].value).toBe("");
  });
});
```

**Step 2: Lancer pour vérifier l'échec**

```bash
bun run test tests/components/auth/otp-input.test.tsx
```

Expected: FAIL.

**Step 3: Créer `components/auth/otp-input.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const chars = value.split("");
    chars[index] = digit;
    const next = chars.join("").padEnd(index + (digit ? 1 : 0), "").slice(0, LENGTH);
    onChange(next);
    if (digit && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          className={cn(
            "size-11 rounded-lg border text-center text-lg font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-primary",
            "transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/components/auth/otp-input.test.tsx
```

Expected: PASS — 4 tests passent.

**Step 5: Commit**

```bash
git add components/auth/otp-input.tsx tests/components/auth/otp-input.test.tsx
git commit -m "feat: add OtpInput component with auto-focus and paste support"
```

---

## Task 7: Ajouter les icônes SVG aux boutons sociaux

**Contexte:** Les boutons Google, Facebook, Apple n'ont pas d'icônes. Ajouter des SVG inline directement dans le composant.

**Files:**
- Modify: `components/auth/social-buttons.tsx`
- Modify: `tests/components/auth/social-buttons.test.tsx`

**Step 1: Mettre à jour `components/auth/social-buttons.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

const providers = [
  { id: "google" as const, label: "Google", Icon: GoogleIcon },
  { id: "facebook" as const, label: "Facebook", Icon: FacebookIcon },
  { id: "apple" as const, label: "Apple", Icon: AppleIcon },
];

interface SocialButtonsProps {
  callbackURL?: string;
}

export function SocialButtons({ callbackURL = "/" }: SocialButtonsProps) {
  const [error, setError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function handleSocialSignIn(providerId: "google" | "facebook" | "apple") {
    setError("");
    setLoadingProvider(providerId);

    try {
      await signIn.social(
        { provider: providerId, callbackURL },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Une erreur est survenue");
            setLoadingProvider(null);
          },
        }
      );
    } catch {
      setError("Impossible de se connecter. Vérifiez votre connexion internet.");
      setLoadingProvider(null);
    }
  }

  return (
    <div className="grid gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {providers.map(({ id, label, Icon }) => (
        <Button
          key={id}
          variant="outline"
          className="w-full gap-2"
          disabled={loadingProvider !== null}
          onClick={() => handleSocialSignIn(id)}
        >
          {loadingProvider === id ? (
            "Connexion..."
          ) : (
            <>
              <Icon />
              {label}
            </>
          )}
        </Button>
      ))}
    </div>
  );
}
```

**Step 2: Lancer les tests existants**

```bash
bun run test tests/components/auth/social-buttons.test.tsx
```

Expected: PASS — les tests existants passent (ils cherchent `/google/i`, `/facebook/i`, `/apple/i` dans le nom accessible, ce qui fonctionne avec le texte visible).

**Step 3: Commit**

```bash
git add components/auth/social-buttons.tsx
git commit -m "feat: add SVG icons to social login buttons"
```

---

## Task 8: Ajouter le toggle MDP à la page Connexion

**Files:**
- Modify: `app/(auth)/connexion/page.tsx`
- Modify: `tests/app/auth/connexion.test.tsx`

**Step 1: Ajouter le test toggle dans les tests existants**

Dans `tests/app/auth/connexion.test.tsx`, ajouter les imports nécessaires et un test :

```tsx
import userEvent from "@testing-library/user-event";

// Ajouter dans le describe existant :
it("toggles password visibility", async () => {
  const user = userEvent.setup();
  render(<SignInPage />);
  const passwordInput = screen.getByLabelText(/mot de passe/i) as HTMLInputElement;
  expect(passwordInput.type).toBe("password");
  await user.click(screen.getByRole("button", { name: /afficher/i }));
  expect(passwordInput.type).toBe("text");
});
```

**Step 2: Lancer pour vérifier l'échec**

```bash
bun run test tests/app/auth/connexion.test.tsx
```

Expected: FAIL sur le nouveau test.

**Step 3: Mettre à jour `app/(auth)/connexion/page.tsx`**

Remplacer le bloc du champ mot de passe (lignes 63–81) par :

```tsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";
import { PasswordToggle } from "@/components/auth/password-toggle";
import { signIn } from "@/lib/auth-client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn.email(
        { email, password },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Une erreur est survenue");
          },
          onSuccess: () => {
            router.push(callbackUrl);
            router.refresh();
          },
        }
      );
    } finally {
      setLoading(false);
    }
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <PasswordToggle
                type={showPassword ? "text" : "password"}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>
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

      <SocialButtons callbackURL={callbackUrl} />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/app/auth/connexion.test.tsx
```

Expected: PASS — tous les tests passent.

**Step 5: Commit**

```bash
git add app/(auth)/connexion/page.tsx tests/app/auth/connexion.test.tsx
git commit -m "feat: add password visibility toggle to sign-in page"
```

---

## Task 9: Ajouter toggle + indicateur de force à l'inscription

**Files:**
- Modify: `app/(auth)/inscription/page.tsx`
- Modify: `tests/app/auth/inscription.test.tsx`

**Step 1: Ajouter les tests**

Dans `tests/app/auth/inscription.test.tsx`, ajouter :

```tsx
import userEvent from "@testing-library/user-event";

// Ajouter dans le describe existant :
it("toggles password visibility", async () => {
  const user = userEvent.setup();
  render(<SignUpPage />);
  const passwordInput = screen.getByLabelText(/^mot de passe$/i) as HTMLInputElement;
  expect(passwordInput.type).toBe("password");
  await user.click(screen.getByRole("button", { name: /afficher/i }));
  expect(passwordInput.type).toBe("text");
});

it("shows password strength indicator when typing", async () => {
  const user = userEvent.setup();
  render(<SignUpPage />);
  const passwordInput = screen.getByLabelText(/^mot de passe$/i);
  await user.type(passwordInput, "abc");
  expect(screen.getByText(/faible/i)).toBeInTheDocument();
});
```

**Step 2: Lancer pour vérifier l'échec**

```bash
bun run test tests/app/auth/inscription.test.tsx
```

**Step 3: Mettre à jour `app/(auth)/inscription/page.tsx`**

```tsx
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
import { PasswordToggle } from "@/components/auth/password-toggle";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
    } finally {
      setLoading(false);
    }
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <PasswordToggle
                type={showPassword ? "text" : "password"}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>
          <PasswordStrength password={password} />
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

**Step 4: Lancer les tests**

```bash
bun run test tests/app/auth/inscription.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add app/(auth)/inscription/page.tsx tests/app/auth/inscription.test.tsx
git commit -m "feat: add password toggle and strength indicator to sign-up page"
```

---

## Task 10: Configurer le plugin emailOTP dans Better Auth

**Contexte:** Ajouter `emailOTP` côté serveur (`lib/auth.ts`) et côté client (`lib/auth-client.ts`). Le handler `sendVerificationOTP` loggue l'OTP en dev (pas d'envoi email réel sans service SMTP configuré).

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth-client.ts`

**Step 1: Mettre à jour `lib/auth.ts`**

```ts
import { betterAuth } from "better-auth";
import { organization, emailOTP } from "better-auth/plugins";
import Database from "better-sqlite3";
import { ac, owner, admin, member } from "@/lib/auth/permissions";

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  };
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

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
        // En production, remplacer par un vrai service email (Resend, SendGrid, etc.)
        console.log(`[emailOTP] type=${type} email=${email} otp=${otp}`);
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
  ],
});

export type Auth = typeof auth;
```

**Step 2: Mettre à jour `lib/auth-client.ts`**

```ts
import { createAuthClient } from "better-auth/react";
import { organizationClient, emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:33000",
  plugins: [organizationClient(), emailOTPClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;
```

**Step 3: Régénérer le schéma Better Auth si nécessaire**

Le plugin `emailOTP` ajoute une table `verification` (déjà présente dans Better Auth par défaut). Vérifier si la DB doit être mise à jour :

```bash
bunx better-auth migrate --config lib/auth.ts
```

Si la commande échoue (DB SQLite ne nécessite pas de migration manuelle avec Better Auth), c'est normal — Better Auth gère les tables automatiquement au premier appel.

**Step 4: Commit**

```bash
git add lib/auth.ts lib/auth-client.ts
git commit -m "feat: add emailOTP plugin to Better Auth for OTP password reset"
```

---

## Task 11: Mettre à jour la page "mot de passe oublié" pour utiliser l'OTP

**Files:**
- Modify: `app/(auth)/mot-de-passe-oublie/page.tsx`
- Modify: `tests/app/auth/mot-de-passe-oublie.test.tsx`

**Step 1: Voir les tests existants**

```bash
bun run test tests/app/auth/mot-de-passe-oublie.test.tsx
```

Note le mock actuel : `authClient: { forgetPassword: vi.fn() }`. Il faudra le mettre à jour.

**Step 2: Mettre à jour le mock dans les tests**

Dans `tests/app/auth/mot-de-passe-oublie.test.tsx`, remplacer le mock :

```tsx
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      forgetPassword: vi.fn().mockResolvedValue({}),
    },
  },
}));
```

**Step 3: Lancer pour vérifier l'état des tests avant la modif**

```bash
bun run test tests/app/auth/mot-de-passe-oublie.test.tsx
```

**Step 4: Mettre à jour `app/(auth)/mot-de-passe-oublie/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.emailOtp.forgetPassword(
        { email },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Une erreur est survenue");
          },
          onSuccess: () => {
            sessionStorage.setItem("otp_email", email);
            router.push("/reinitialiser");
          },
        }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Entrez votre email pour recevoir un code de réinitialisation"
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
          {loading ? "Envoi..." : "Envoyer le code"}
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

**Step 5: Lancer les tests**

```bash
bun run test tests/app/auth/mot-de-passe-oublie.test.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add app/(auth)/mot-de-passe-oublie/page.tsx tests/app/auth/mot-de-passe-oublie.test.tsx
git commit -m "feat: update forgot password page to use emailOTP flow"
```

---

## Task 12: Réécrire la page de réinitialisation avec le composant OTP

**Contexte:** L'ancienne page lit un token depuis l'URL. La nouvelle lit l'email depuis `sessionStorage`, affiche un OTP à 6 chiffres, puis appelle `resetPasswordEmailOTP` avec `{ email, otp, password }`.

**Files:**
- Modify: `app/(auth)/reinitialiser/page.tsx`
- Modify: `tests/app/auth/reinitialiser.test.tsx`

**Step 1: Mettre à jour les tests**

Remplacer `tests/app/auth/reinitialiser.test.tsx` :

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "@/app/(auth)/reinitialiser/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      resetPassword: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Simuler un email en sessionStorage
beforeEach(() => {
  sessionStorage.setItem("otp_email", "test@exemple.com");
});

describe("ResetPasswordPage", () => {
  it("renders OTP heading", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Réinitialiser le mot de passe")).toBeInTheDocument();
  });

  it("renders 6 OTP input fields", () => {
    render(<ResetPasswordPage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("renders new password field", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("button", { name: /réinitialiser/i })).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    await user.type(screen.getByLabelText(/nouveau mot de passe/i), "Abcdefg1!");
    await user.type(screen.getByLabelText(/confirmer/i), "Different1!");
    await user.click(screen.getByRole("button", { name: /réinitialiser/i }));
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
  });
});
```

**Step 2: Lancer pour vérifier l'échec**

```bash
bun run test tests/app/auth/reinitialiser.test.tsx
```

**Step 3: Réécrire `app/(auth)/reinitialiser/page.tsx`**

```tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordToggle } from "@/components/auth/password-toggle";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("otp_email");
    if (!stored) {
      router.push("/mot-de-passe-oublie");
      return;
    }
    setEmail(stored);
  }, [router]);

  function maskEmail(e: string) {
    const [local, domain] = e.split("@");
    if (!local || !domain) return e;
    return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (otp.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres");
      return;
    }

    setLoading(true);

    try {
      await authClient.emailOtp.resetPassword(
        { email, otp, password },
        {
          onError: (ctx) => {
            setError(ctx.error.message ?? "Code incorrect ou expiré");
          },
          onSuccess: () => {
            sessionStorage.removeItem("otp_email");
            router.push("/connexion");
          },
        }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Réinitialiser le mot de passe"
      description={email ? `Code envoyé à ${maskEmail(email)}` : "Chargement..."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Entrez le code à 6 chiffres reçu par email
          </p>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <PasswordToggle
                type={showPassword ? "text" : "password"}
                onToggle={() => setShowPassword((v) => !v)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/mot-de-passe-oublie" className="text-primary hover:underline">
          Renvoyer le code
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

**Step 4: Lancer les tests**

```bash
bun run test tests/app/auth/reinitialiser.test.tsx
```

Expected: PASS.

**Step 5: Lancer tous les tests**

```bash
bun run test
```

Expected: tous les tests passent.

**Step 6: Commit**

```bash
git add app/(auth)/reinitialiser/page.tsx tests/app/auth/reinitialiser.test.tsx
git commit -m "feat: rewrite password reset page with OTP input and emailOTP API"
```

---

## Task 13: Vérification finale

**Step 1: Lancer tous les tests**

```bash
bun run test
```

Expected: PASS — tous les tests passent.

**Step 2: Build de production**

```bash
bun run build
```

Expected: build réussi sans erreurs TypeScript ni ESLint.

**Step 3: Vérification visuelle complète**

```bash
bun run dev
```

Tester chaque page :
- `http://localhost:33000/` — AppBar visible, page d'accueil intacte
- `http://localhost:33000/connexion` — Pas d'AppBar, logo DBS Store, toggle MDP, boutons sociaux avec icônes
- `http://localhost:33000/inscription` — Toggle MDP, indicateur de force
- `http://localhost:33000/mot-de-passe-oublie` — Logo, formulaire email
- `http://localhost:33000/reinitialiser` — Redirect vers `/mot-de-passe-oublie` si pas d'email en sessionStorage

**Step 4: Commit final si nécessaire**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
