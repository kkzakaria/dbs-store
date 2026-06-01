# Refonte page profil + édition identité — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la page profil minimaliste en une page structurée (en-tête avatar + cartes) permettant à l'utilisateur de modifier son nom, son email, son mot de passe et son avatar.

**Architecture:** Page server component (`force-dynamic`) qui rend un en-tête et des cartes ; chaque action d'édition ouvre un `Dialog` shadcn avec un petit formulaire client dédié appelant les méthodes better-auth (`updateUser`, `changeEmail`, `changePassword`). L'upload d'avatar réutilise l'infra R2 (URL présignée) via un module partagé `lib/r2.ts` et une action gardée par session utilisateur.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, better-auth, Shadcn UI (Dialog/Input/Button/Label), Tailwind v4, R2 via `@aws-sdk/client-s3`, Vitest + React Testing Library.

**Spec de référence :** `docs/superpowers/specs/2026-06-01-profil-page-redesign-design.md`

---

## File Structure

**Nouveaux fichiers :**
- `lib/r2.ts` — logique R2 partagée (config, client S3, génération d'URL présignée paramétrée).
- `lib/actions/avatar-upload.ts` — server action `generateAvatarUploadUrl`, gardée par session utilisateur.
- `components/compte/profil-avatar.tsx` — avatar/initiales server-safe + helper `getInitials`.
- `components/compte/avatar-upload.tsx` — bouton client d'upload superposé à l'avatar.
- `components/compte/edit-name-dialog.tsx` — dialogue d'édition du nom.
- `components/compte/edit-email-dialog.tsx` — dialogue de changement d'email.
- `components/compte/change-password-dialog.tsx` — dialogue de changement de mot de passe.
- Tests miroirs sous `tests/`.

**Fichiers modifiés :**
- `lib/actions/admin-upload.ts` — consomme `lib/r2.ts` (comportement inchangé).
- `lib/auth-utils.ts` — ajoute `hasCredentialAccount`.
- `lib/email/templates.ts` — ajoute `buildChangeEmailVerificationEmail`.
- `lib/auth.ts` — ajoute le bloc `user.changeEmail`.
- `lib/auth-client.ts` — exporte `updateUser`, `changeEmail`, `changePassword`.
- `app/(compte)/compte/profil/page.tsx` — réécriture (en-tête + cartes).

> **Note environnement :** `bun run dev` utilise `./dev.db` ; les variables R2 ne sont
> pas configurées en dev. L'upload d'avatar échouera proprement en dev sans config R2
> (erreur explicite) — c'est attendu. Les tests mockent l'action, donc n'en dépendent pas.

---

## Task 1 : Module R2 partagé (`lib/r2.ts`) + refactor `admin-upload.ts`

**Files:**
- Create: `lib/r2.ts`
- Modify: `lib/actions/admin-upload.ts`

- [ ] **Step 1 : Créer `lib/r2.ts`**

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Configuration R2 manquante (variables d'environnement)");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function createR2Client(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string
) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Génère une URL d'upload présignée pour une clé préfixée.
 * Le caller DOIT avoir vérifié l'autorisation et le contentType avant d'appeler.
 */
export async function createPresignedUpload(
  keyPrefix: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl: baseUrl } =
    getR2Config();
  const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(
    createR2Client(accountId, accessKeyId, secretAccessKey),
    command,
    { expiresIn: 300 }
  );

  return { uploadUrl, publicUrl: `${baseUrl}/${key}` };
}
```

- [ ] **Step 2 : Réécrire `lib/actions/admin-upload.ts` pour consommer `lib/r2.ts`**

```ts
"use server";

import { requireOrgMember } from "@/lib/actions/admin-auth";
import { ALLOWED_CONTENT_TYPES, createPresignedUpload } from "@/lib/r2";

export async function generatePresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  return createPresignedUpload("products", filename, contentType);
}

export async function generateBannerPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  return createPresignedUpload("banners", filename, contentType);
}
```

- [ ] **Step 3 : Vérifier que rien n'est cassé (lint + build TS)**

Run: `bun run lint 2>&1 | grep -iE "admin-upload|r2\.ts" || echo "no new errors in touched files"`
Expected: `no new errors in touched files`

- [ ] **Step 4 : Lancer la suite de tests existante (non-régression)**

Run: `bun run test 2>&1 | tail -5`
Expected: même nombre de tests passants qu'avant (aucune régression). Les imports de `generatePresignedUrl`/`generateBannerPresignedUrl` restent identiques pour les conscommateurs.

- [ ] **Step 5 : Commit**

```bash
git add lib/r2.ts lib/actions/admin-upload.ts
git commit -m "refactor: extract shared R2 presign logic into lib/r2.ts"
```

---

## Task 2 : Action d'upload avatar (`lib/actions/avatar-upload.ts`)

**Files:**
- Create: `lib/actions/avatar-upload.ts`
- Test: `tests/lib/actions/avatar-upload.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// tests/lib/actions/avatar-upload.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCachedSession = vi.fn();
const createPresignedUpload = vi.fn();

vi.mock("@/lib/session", () => ({ getCachedSession: () => getCachedSession() }));
vi.mock("@/lib/r2", () => ({
  ALLOWED_CONTENT_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  createPresignedUpload: (...args: unknown[]) => createPresignedUpload(...args),
}));

import { generateAvatarUploadUrl } from "@/lib/actions/avatar-upload";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateAvatarUploadUrl", () => {
  it("rejette si aucun utilisateur connecté", async () => {
    getCachedSession.mockResolvedValue(null);
    await expect(
      generateAvatarUploadUrl("a.png", "image/png")
    ).rejects.toThrow(/connecté|connexion|non autorisé/i);
    expect(createPresignedUpload).not.toHaveBeenCalled();
  });

  it("rejette un type de fichier non autorisé", async () => {
    getCachedSession.mockResolvedValue({ user: { id: "u1" } });
    await expect(
      generateAvatarUploadUrl("a.svg", "image/svg+xml")
    ).rejects.toThrow(/non autorisé/i);
    expect(createPresignedUpload).not.toHaveBeenCalled();
  });

  it("génère une URL préfixée par l'id utilisateur", async () => {
    getCachedSession.mockResolvedValue({ user: { id: "u1" } });
    createPresignedUpload.mockResolvedValue({
      uploadUrl: "https://up",
      publicUrl: "https://pub",
    });
    const res = await generateAvatarUploadUrl("a.png", "image/png");
    expect(createPresignedUpload).toHaveBeenCalledWith("avatars/u1", "a.png", "image/png");
    expect(res).toEqual({ uploadUrl: "https://up", publicUrl: "https://pub" });
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/lib/actions/avatar-upload.test.ts 2>&1 | tail -15`
Expected: FAIL — `Cannot find module '@/lib/actions/avatar-upload'` ou export absent.

- [ ] **Step 3 : Implémenter `lib/actions/avatar-upload.ts`**

```ts
"use server";

import { getCachedSession } from "@/lib/session";
import { ALLOWED_CONTENT_TYPES, createPresignedUpload } from "@/lib/r2";

export async function generateAvatarUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const session = await getCachedSession();
  if (!session?.user) {
    throw new Error("Vous devez être connecté pour modifier votre avatar.");
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  return createPresignedUpload(`avatars/${session.user.id}`, filename, contentType);
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/lib/actions/avatar-upload.test.ts 2>&1 | tail -15`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
git add lib/actions/avatar-upload.ts tests/lib/actions/avatar-upload.test.ts
git commit -m "feat: user-scoped avatar upload presign action"
```

---

## Task 3 : Helper `hasCredentialAccount` (`lib/auth-utils.ts`)

**Files:**
- Modify: `lib/auth-utils.ts`
- Test: `tests/lib/auth-utils.test.ts` (créer si absent ; sinon y ajouter le bloc)

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// tests/lib/auth-utils.test.ts  (ajouter ce bloc ; conserver les tests existants s'il y en a)
import { describe, it, expect } from "vitest";
import { hasCredentialAccount } from "@/lib/auth-utils";

describe("hasCredentialAccount", () => {
  it("retourne true si un compte credential existe", () => {
    expect(
      hasCredentialAccount([{ provider: "credential" }, { provider: "google" }])
    ).toBe(true);
  });

  it("retourne false pour des comptes sociaux uniquement", () => {
    expect(hasCredentialAccount([{ provider: "google" }])).toBe(false);
  });

  it("retourne false pour une liste vide", () => {
    expect(hasCredentialAccount([])).toBe(false);
  });
});
```

> Si `tests/lib/auth-utils.test.ts` existe déjà, n'ajoute QUE le `describe("hasCredentialAccount", …)` ci-dessus sans dupliquer les imports déjà présents.

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/lib/auth-utils.test.ts 2>&1 | tail -15`
Expected: FAIL — `hasCredentialAccount` n'est pas exporté.

- [ ] **Step 3 : Ajouter le helper dans `lib/auth-utils.ts`** (à la fin du fichier)

```ts
/**
 * better-auth listUserAccounts() retourne un tableau d'objets dont le champ
 * `provider` vaut "credential" pour un compte email/mot de passe, ou le nom du
 * provider social ("google", "facebook", "apple"). On n'autorise le changement
 * de mot de passe que si un compte credential existe.
 */
export function hasCredentialAccount(
  accounts: { provider: string }[]
): boolean {
  return accounts.some((a) => a.provider === "credential");
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/lib/auth-utils.test.ts 2>&1 | tail -15`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add lib/auth-utils.ts tests/lib/auth-utils.test.ts
git commit -m "feat: add hasCredentialAccount auth helper"
```

---

## Task 4 : Template email de changement d'email + config `auth.ts` + exports client

**Files:**
- Modify: `lib/email/templates.ts`
- Modify: `lib/auth.ts`
- Modify: `lib/auth-client.ts`
- Test: `tests/lib/email/templates.test.ts` (ajouter un bloc ; créer si absent)

- [ ] **Step 1 : Écrire le test qui échoue (template)**

```ts
// tests/lib/email/templates.test.ts  (ajouter ce bloc)
import { describe, it, expect } from "vitest";
import { buildChangeEmailVerificationEmail } from "@/lib/email/templates";

describe("buildChangeEmailVerificationEmail", () => {
  it("adresse l'email à l'adresse actuelle et inclut le lien", () => {
    const msg = buildChangeEmailVerificationEmail(
      "actuel@exemple.com",
      "nouveau@exemple.com",
      "https://dbs.example/verify?token=abc"
    );
    expect(msg.to).toBe("actuel@exemple.com");
    expect(msg.subject).toMatch(/changement.*email|adresse email/i);
    expect(msg.html).toContain("https://dbs.example/verify?token=abc");
    expect(msg.html).toContain("nouveau@exemple.com");
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/lib/email/templates.test.ts 2>&1 | tail -15`
Expected: FAIL — export `buildChangeEmailVerificationEmail` absent.

- [ ] **Step 3 : Ajouter le template dans `lib/email/templates.ts`** (à la fin du fichier)

```ts
export function buildChangeEmailVerificationEmail(
  currentEmail: string,
  newEmail: string,
  url: string
): EmailMessage {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmez le changement d'adresse email</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">⚡ DBS Store</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Changement d'adresse email</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Vous avez demandé à remplacer votre adresse par <strong>${newEmail}</strong>.
                Cliquez sur le bouton ci-dessous pour confirmer. Ce lien est valable un temps limité.
              </p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">Confirmer le changement</a>
              </div>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre adresse reste inchangée.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 DBS Store — Abidjan, Côte d'Ivoire</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    to: currentEmail,
    subject: "Confirmez le changement d'adresse email — DBS Store",
    html,
  };
}
```

- [ ] **Step 4 : Lancer le test du template pour vérifier qu'il passe**

Run: `bun run test tests/lib/email/templates.test.ts 2>&1 | tail -15`
Expected: PASS.

- [ ] **Step 5 : Ajouter la config `user.changeEmail` dans `lib/auth.ts`**

Dans `lib/auth.ts`, ajouter l'import en haut (à côté de `import { sendOtpEmail } from "@/lib/email";`) :

```ts
import { enqueueEmail } from "@/lib/email/enqueue";
import { buildChangeEmailVerificationEmail } from "@/lib/email/templates";
```

Puis, dans l'objet passé à `betterAuth({ ... })`, ajouter un bloc `user` juste avant `socialProviders,` (l'ordre des clés n'a pas d'importance, mais place-le après `emailAndPassword`) :

```ts
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async ({ user, newEmail, url }) => {
          if (!env.RESEND_API_KEY) {
            console.log(`[changeEmail DEV] from=${user.email} to=${newEmail} url=${url}`);
            return;
          }
          await enqueueEmail(
            buildChangeEmailVerificationEmail(user.email, newEmail, url)
          );
        },
      },
    },
```

- [ ] **Step 6 : Exporter les méthodes dans `lib/auth-client.ts`**

Remplacer le bloc d'export déstructuré par :

```ts
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  updateUser,
  changeEmail,
  changePassword,
} = authClient;
```

- [ ] **Step 7 : Vérifier le typage et la non-régression**

Run: `bun run test 2>&1 | tail -5`
Expected: aucune régression ; les nouveaux tests template/auth-utils passent.

- [ ] **Step 8 : Commit**

```bash
git add lib/email/templates.ts tests/lib/email/templates.test.ts lib/auth.ts lib/auth-client.ts
git commit -m "feat: enable email change flow (server config + email template + client exports)"
```

---

## Task 5 : Composant `profil-avatar.tsx` + `getInitials`

**Files:**
- Create: `components/compte/profil-avatar.tsx`
- Test: `tests/components/compte/profil-avatar.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/compte/profil-avatar.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilAvatar, getInitials } from "@/components/compte/profil-avatar";

describe("getInitials", () => {
  it("prend les initiales de deux mots", () => {
    expect(getInitials("Jean Dupont")).toBe("JD");
  });
  it("prend une seule initiale pour un seul mot", () => {
    expect(getInitials("Madonna")).toBe("M");
  });
  it("retourne ? pour une chaîne vide", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});

describe("ProfilAvatar", () => {
  it("affiche les initiales sans image", () => {
    render(<ProfilAvatar name="Jean Dupont" image={null} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("affiche une image quand image est fourni", () => {
    render(<ProfilAvatar name="Jean Dupont" image="https://img/a.png" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img/a.png");
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/components/compte/profil-avatar.test.tsx 2>&1 | tail -15`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter `components/compte/profil-avatar.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ProfilAvatarProps {
  name: string;
  image?: string | null;
  className?: string;
}

export function ProfilAvatar({ name, image, className }: ProfilAvatarProps) {
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary font-semibold",
    className
  );

  if (image) {
    return (
      <span className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className={base} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/components/compte/profil-avatar.test.tsx 2>&1 | tail -15`
Expected: PASS (5 tests).

- [ ] **Step 5 : Commit**

```bash
git add components/compte/profil-avatar.tsx tests/components/compte/profil-avatar.test.tsx
git commit -m "feat: profil avatar component with initials fallback"
```

---

## Task 6 : Dialogue d'édition du nom (`edit-name-dialog.tsx`)

**Files:**
- Create: `components/compte/edit-name-dialog.tsx`
- Test: `tests/components/compte/edit-name-dialog.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/compte/edit-name-dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditNameDialog } from "@/components/compte/edit-name-dialog";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/auth-client", () => ({
  updateUser: vi.fn(),
}));
import { updateUser } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditNameDialog", () => {
  it("bloque la soumission si le nom est vide", async () => {
    const user = userEvent.setup();
    render(<EditNameDialog open onOpenChange={() => {}} currentName="" />);
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    expect(screen.getByText(/nom.*requis|saisir.*nom/i)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("appelle updateUser puis refresh au succès", async () => {
    vi.mocked(updateUser).mockResolvedValue({ data: {}, error: null } as never);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<EditNameDialog open onOpenChange={onOpenChange} currentName="Jean" />);
    const input = screen.getByLabelText(/nom/i);
    await user.clear(input);
    await user.type(input, "Jean Dupont");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    expect(updateUser).toHaveBeenCalledWith({ name: "Jean Dupont" });
    expect(mockRefresh).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/components/compte/edit-name-dialog.test.tsx 2>&1 | tail -15`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter `components/compte/edit-name-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-utils";

interface EditNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
}

export function EditNameDialog({ open, onOpenChange, currentName }: EditNameDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Le nom est requis.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Le nom ne doit pas dépasser 100 caractères.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await updateUser({ name: trimmed });
    setSubmitting(false);
    if (res.error) {
      setError(translateAuthError(res.error.message, "Échec de la mise à jour."));
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le nom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profil-name">Nom</Label>
            <Input
              id="profil-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/components/compte/edit-name-dialog.test.tsx 2>&1 | tail -15`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
git add components/compte/edit-name-dialog.tsx tests/components/compte/edit-name-dialog.test.tsx
git commit -m "feat: edit name dialog"
```

---

## Task 7 : Dialogue de changement d'email (`edit-email-dialog.tsx`)

**Files:**
- Create: `components/compte/edit-email-dialog.tsx`
- Test: `tests/components/compte/edit-email-dialog.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/compte/edit-email-dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditEmailDialog } from "@/components/compte/edit-email-dialog";

vi.mock("@/lib/auth-client", () => ({
  changeEmail: vi.fn(),
}));
import { changeEmail } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditEmailDialog", () => {
  it("bloque un email invalide", async () => {
    const user = userEvent.setup();
    render(<EditEmailDialog open onOpenChange={() => {}} currentEmail="a@b.com" />);
    await user.type(screen.getByLabelText(/nouvel email/i), "pasunemail");
    await user.click(screen.getByRole("button", { name: /envoyer|confirmer/i }));
    expect(screen.getByText(/email.*invalide|adresse.*invalide/i)).toBeInTheDocument();
    expect(changeEmail).not.toHaveBeenCalled();
  });

  it("appelle changeEmail et affiche le message de confirmation", async () => {
    vi.mocked(changeEmail).mockResolvedValue({ data: {}, error: null } as never);
    const user = userEvent.setup();
    render(<EditEmailDialog open onOpenChange={() => {}} currentEmail="a@b.com" />);
    await user.type(screen.getByLabelText(/nouvel email/i), "nouveau@exemple.com");
    await user.click(screen.getByRole("button", { name: /envoyer|confirmer/i }));
    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "nouveau@exemple.com",
      callbackURL: "/compte/profil",
    });
    expect(await screen.findByText(/lien de confirmation/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/components/compte/edit-email-dialog.test.tsx 2>&1 | tail -15`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter `components/compte/edit-email-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeEmail } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EditEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function EditEmailDialog({ open, onOpenChange, currentEmail }: EditEmailDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Adresse email invalide.");
      return;
    }
    if (trimmed === currentEmail) {
      setError("Cette adresse est déjà la vôtre.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await changeEmail({ newEmail: trimmed, callbackURL: "/compte/profil" });
    setSubmitting(false);
    if (res.error) {
      setError(translateAuthError(res.error.message, "Échec de la demande."));
      return;
    }
    setSent(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer l&apos;adresse email</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Un lien de confirmation a été envoyé à votre adresse actuelle
              ({currentEmail}). Le changement sera appliqué après confirmation.
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profil-new-email">Nouvel email</Label>
              <Input
                id="profil-new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/components/compte/edit-email-dialog.test.tsx 2>&1 | tail -15`
Expected: PASS (2 tests).

- [ ] **Step 5 : Commit**

```bash
git add components/compte/edit-email-dialog.tsx tests/components/compte/edit-email-dialog.test.tsx
git commit -m "feat: change email dialog"
```

---

## Task 8 : Dialogue de changement de mot de passe (`change-password-dialog.tsx`)

**Files:**
- Create: `components/compte/change-password-dialog.tsx`
- Test: `tests/components/compte/change-password-dialog.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/compte/change-password-dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordDialog } from "@/components/compte/change-password-dialog";

vi.mock("@/lib/auth-client", () => ({
  changePassword: vi.fn(),
}));
import { changePassword } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

async function fill(label: RegExp, value: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(label), value);
}

describe("ChangePasswordDialog", () => {
  it("bloque si le nouveau mot de passe fait moins de 8 caractères", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordDialog open onOpenChange={() => {}} />);
    await fill(/mot de passe actuel/i, "ancien123");
    await fill(/^nouveau mot de passe/i, "court");
    await fill(/confirmer/i, "court");
    await user.click(screen.getByRole("button", { name: /changer|enregistrer/i }));
    expect(screen.getByText(/8 caractères/i)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("bloque si la confirmation ne correspond pas", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordDialog open onOpenChange={() => {}} />);
    await fill(/mot de passe actuel/i, "ancien123");
    await fill(/^nouveau mot de passe/i, "nouveau123");
    await fill(/confirmer/i, "different123");
    await user.click(screen.getByRole("button", { name: /changer|enregistrer/i }));
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("appelle changePassword au succès", async () => {
    vi.mocked(changePassword).mockResolvedValue({ data: {}, error: null } as never);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);
    await fill(/mot de passe actuel/i, "ancien123");
    await fill(/^nouveau mot de passe/i, "nouveau123");
    await fill(/confirmer/i, "nouveau123");
    await user.click(screen.getByRole("button", { name: /changer|enregistrer/i }));
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "ancien123",
      newPassword: "nouveau123",
      revokeOtherSessions: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/components/compte/change-password-dialog.test.tsx 2>&1 | tail -15`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter `components/compte/change-password-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-utils";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      setError("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (next !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setSubmitting(false);
    if (res.error) {
      setError(translateAuthError(res.error.message, "Échec du changement de mot de passe."));
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pwd-current">Mot de passe actuel</Label>
            <Input
              id="pwd-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd-new">Nouveau mot de passe</Label>
            <Input
              id="pwd-new"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd-confirm">Confirmer le nouveau mot de passe</Label>
            <Input
              id="pwd-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Changement..." : "Changer le mot de passe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

> **Note test :** le label « Nouveau mot de passe » et « Confirmer le nouveau mot de
> passe » contiennent tous deux « mot de passe » ; le test cible le premier avec
> l'ancre `^nouveau mot de passe` et la confirmation avec `/confirmer/i`. « Mot de
> passe actuel » est ciblé par `/mot de passe actuel/i`. Les ancres évitent
> l'ambiguïté `getByLabelText`.

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/components/compte/change-password-dialog.test.tsx 2>&1 | tail -15`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
git add components/compte/change-password-dialog.tsx tests/components/compte/change-password-dialog.test.tsx
git commit -m "feat: change password dialog"
```

---

## Task 9 : Composant client `avatar-upload.tsx`

**Files:**
- Create: `components/compte/avatar-upload.tsx`
- Test: `tests/components/compte/avatar-upload.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

```tsx
// tests/components/compte/avatar-upload.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUpload } from "@/components/compte/avatar-upload";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

vi.mock("@/lib/actions/avatar-upload", () => ({
  generateAvatarUploadUrl: vi.fn(),
}));
vi.mock("@/lib/auth-client", () => ({ updateUser: vi.fn() }));

import { generateAvatarUploadUrl } from "@/lib/actions/avatar-upload";
import { updateUser } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
});

describe("AvatarUpload", () => {
  it("upload le fichier puis met à jour l'avatar et rafraîchit", async () => {
    vi.mocked(generateAvatarUploadUrl).mockResolvedValue({
      uploadUrl: "https://up",
      publicUrl: "https://pub/a.png",
    });
    vi.mocked(updateUser).mockResolvedValue({ data: {}, error: null } as never);

    const user = userEvent.setup();
    const { container } = render(<AvatarUpload name="Jean" image={null} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "a.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(generateAvatarUploadUrl).toHaveBeenCalledWith("a.png", "image/png");
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://up",
      expect.objectContaining({ method: "PUT" })
    );
    expect(updateUser).toHaveBeenCalledWith({ image: "https://pub/a.png" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `bun run test tests/components/compte/avatar-upload.test.tsx 2>&1 | tail -15`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Implémenter `components/compte/avatar-upload.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { ProfilAvatar } from "@/components/compte/profil-avatar";
import { generateAvatarUploadUrl } from "@/lib/actions/avatar-upload";
import { updateUser } from "@/lib/auth-client";

interface AvatarUploadProps {
  name: string;
  image: string | null;
}

export function AvatarUpload({ name, image }: AvatarUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl, publicUrl } = await generateAvatarUploadUrl(file.name, file.type);
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error(`Upload échoué (${res.status})`);
      const updated = await updateUser({ image: publicUrl });
      if (updated.error) throw new Error(updated.error.message ?? "Mise à jour échouée");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload de l'avatar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Changer la photo de profil"
      >
        <ProfilAvatar name={name} image={image} className="size-20 text-2xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 4 : Lancer le test pour vérifier qu'il passe**

Run: `bun run test tests/components/compte/avatar-upload.test.tsx 2>&1 | tail -15`
Expected: PASS (1 test).

- [ ] **Step 5 : Commit**

```bash
git add components/compte/avatar-upload.tsx tests/components/compte/avatar-upload.test.tsx
git commit -m "feat: avatar upload control"
```

---

## Task 10 : Réécriture de la page profil + section de gestion client

**Files:**
- Modify: `app/(compte)/compte/profil/page.tsx`
- Create: `components/compte/profil-sections.tsx` (îlot client orchestrant les dialogues et les boutons « Modifier »)

> **Pourquoi un composant `profil-sections.tsx` :** la page reste un server component
> (récupération session + comptes), mais les boutons qui ouvrent les `Dialog`
> nécessitent un état `open` côté client. On regroupe ces boutons + dialogues dans un
> seul îlot client recevant les données en props. `LogoutButton` (déjà client) y est
> intégré.

- [ ] **Step 1 : Implémenter `components/compte/profil-sections.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/app/(compte)/compte/profil/logout-button";
import { EditNameDialog } from "@/components/compte/edit-name-dialog";
import { EditEmailDialog } from "@/components/compte/edit-email-dialog";
import { ChangePasswordDialog } from "@/components/compte/change-password-dialog";

interface ProfilSectionsProps {
  name: string;
  email: string;
  canChangePassword: boolean;
}

export function ProfilSections({ name, email, canChangePassword }: ProfilSectionsProps) {
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <h3 className="text-sm font-semibold">Informations personnelles</h3>
        </div>
        <dl className="divide-y">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nom
              </dt>
              <dd className="mt-1 text-sm">{name || "—"}</dd>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditName(true)}>
              Modifier
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 truncate text-sm">{email}</dd>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditEmail(true)}>
              Modifier
            </Button>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border">
        <div className="border-b px-6 py-4">
          <h3 className="text-sm font-semibold">Sécurité</h3>
        </div>
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {canChangePassword ? (
            <>
              <p className="text-sm text-muted-foreground">
                Modifiez votre mot de passe régulièrement pour sécuriser votre compte.
              </p>
              <Button variant="outline" size="sm" onClick={() => setEditPassword(true)}>
                Changer le mot de passe
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous vous connectez via un compte externe. La gestion du mot de passe se
              fait chez votre fournisseur.
            </p>
          )}
        </div>
        <div className="border-t px-6 py-4">
          <LogoutButton />
        </div>
      </section>

      <EditNameDialog open={editName} onOpenChange={setEditName} currentName={name} />
      <EditEmailDialog open={editEmail} onOpenChange={setEditEmail} currentEmail={email} />
      {canChangePassword ? (
        <ChangePasswordDialog open={editPassword} onOpenChange={setEditPassword} />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2 : Réécrire `app/(compte)/compte/profil/page.tsx`**

```tsx
import { headers } from "next/headers";
import { getCachedSession } from "@/lib/session";
import { getAuth } from "@/lib/auth";
import { hasCredentialAccount } from "@/lib/auth-utils";
import { AvatarUpload } from "@/components/compte/avatar-upload";
import { ProfilSections } from "@/components/compte/profil-sections";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  // getCachedSession() deduplicates the auth call already made by the layout.
  const session = await getCachedSession();
  const user = session!.user;

  const auth = await getAuth();
  const accounts = await auth.api.listUserAccounts({ headers: await headers() });
  const canChangePassword = hasCredentialAccount(accounts ?? []);

  const memberSince = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
  }).format(new Date(user.createdAt));

  return (
    <div>
      <h2 className="text-lg font-semibold">Mon profil</h2>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:gap-6">
        <AvatarUpload name={user.name || user.email} image={user.image ?? null} />
        <div className="text-center sm:text-left">
          <p className="text-lg font-semibold">{user.name || "—"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
            <Badge variant={user.emailVerified ? "default" : "secondary"}>
              {user.emailVerified ? "Email vérifié" : "Email non vérifié"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Membre depuis {memberSince}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProfilSections
          name={user.name}
          email={user.email}
          canChangePassword={canChangePassword}
        />
      </div>
    </div>
  );
}
```

> **Vérifier la signature `listUserAccounts` :** better-auth retourne un tableau
> d'objets comportant un champ `provider`. Si le typage diffère dans la version
> installée, adapter `hasCredentialAccount`/le mapping en conséquence — le champ à
> tester reste le nom du provider (`"credential"` pour email/mot de passe).

- [ ] **Step 3 : Vérifier lint + typage sur les fichiers touchés**

Run: `bun run lint 2>&1 | grep -iE "compte/profil|profil-sections" || echo "no new errors"`
Expected: `no new errors`.

- [ ] **Step 4 : Lancer toute la suite de tests**

Run: `bun run test 2>&1 | tail -8`
Expected: tous les tests passent (nouveaux + existants), aucune régression.

- [ ] **Step 5 : Vérification manuelle (dev)**

```bash
bun run dev
```
Se connecter avec le compte de test (cf. seed), aller sur `/compte/profil`. Vérifier :
en-tête avatar + nom + badge + « Membre depuis » ; « Modifier » nom fonctionne ;
« Modifier » email affiche le message de confirmation (URL loggée en console en dev
sans `RESEND_API_KEY`) ; « Changer le mot de passe » fonctionne. (L'upload avatar
échoue proprement sans config R2 en dev — comportement attendu.)

- [ ] **Step 6 : Commit**

```bash
git add "app/(compte)/compte/profil/page.tsx" components/compte/profil-sections.tsx
git commit -m "feat: redesign profile page with avatar header and edit sections"
```

---

## Self-Review (effectuée à l'écriture du plan)

**Couverture du spec :**
- Refonte visuelle (en-tête avatar, cartes) → Task 5, 9, 10. ✅
- Édition du nom → Task 6. ✅
- Changement d'email (lien) → Task 4 (config + template) + Task 7 (UI). ✅
- Changement de mot de passe (conditionnel) → Task 3 (helper) + Task 8 (UI) + Task 10 (affichage conditionnel). ✅
- Upload avatar (R2) → Task 1 (refactor) + Task 2 (action) + Task 9 (UI). ✅
- Gestion d'erreurs (pas d'échec silencieux) → `translateAuthError` + affichage dans chaque dialogue + try/catch avatar. ✅
- Tests → un test par composant/action/helper. ✅
- Section masquée pour compte social → Task 3 + Task 10. ✅

**Cohérence des types/signatures :**
- `generateAvatarUploadUrl(filename, contentType)` → identique entre Task 2 et Task 9. ✅
- `createPresignedUpload(keyPrefix, filename, contentType)` → identique Task 1 et Task 2. ✅
- `hasCredentialAccount(accounts: {provider}[])` → identique Task 3 et Task 10. ✅
- Méthodes auth-client exportées (`updateUser`, `changeEmail`, `changePassword`) → définies Task 4, consommées Tasks 6/7/8/9. ✅
- `ProfilAvatar` props (`name`, `image`, `className`) → identiques Task 5 et Task 9. ✅

**Placeholders :** aucun TODO/TBD ; tout le code est fourni intégralement.

**Risque connu :** la forme exacte du retour de `auth.api.listUserAccounts` peut varier
selon la version de better-auth — une note de vérification est incluse dans Task 10.
