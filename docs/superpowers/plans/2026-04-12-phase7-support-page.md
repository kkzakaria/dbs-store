# Phase 7 — Page Support : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/support` page with a static FAQ (accordion) and a contact form that sends email via Cloudflare Queue.

**Architecture:** Server-rendered page with two sections — FAQ (server component, Shadcn Accordion, static data from constants file) and contact form (client component calling a server action that validates inputs and calls `enqueueEmail()`). No DB, no admin CRUD.

**Tech Stack:** Next.js 16, React 19, Shadcn Accordion, Vitest, enqueueEmail (Cloudflare Queue / Resend fallback)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/ui/accordion.tsx` | Create (Shadcn CLI) | Radix accordion primitive |
| `lib/data/faq.ts` | Create | FAQ constants (categories + items) |
| `lib/actions/support.ts` | Create | `submitContactForm` server action + validation |
| `lib/email/templates.ts` | Modify | Add `buildContactEmail()` |
| `components/support/faq-section.tsx` | Create | FAQ accordion UI |
| `components/support/contact-form.tsx` | Create | Contact form client component |
| `app/(main)/support/page.tsx` | Create | Page: metadata + FAQ + form |
| `components/layout/app-bar/desktop-nav.tsx` | Modify | Add Support link |
| `components/layout/app-bar/mobile-menu.tsx` | Modify | Add Support link |
| `tests/lib/email/templates.test.ts` | Modify | Tests for `buildContactEmail` |
| `tests/lib/actions/support.test.ts` | Create | Tests for server action |
| `tests/components/support/faq-section.test.tsx` | Create | Tests for FAQ rendering |
| `tests/components/support/contact-form.test.tsx` | Create | Tests for contact form |

---

### Task 1: Install Shadcn Accordion

**Files:**
- Create: `components/ui/accordion.tsx`

- [ ] **Step 1: Install the accordion component**

```bash
bunx shadcn@latest add accordion
```

- [ ] **Step 2: Verify the file was created**

```bash
ls components/ui/accordion.tsx
```

Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add components/ui/accordion.tsx
git commit -m "chore: add shadcn accordion component"
```

---

### Task 2: FAQ data constants

**Files:**
- Create: `lib/data/faq.ts`

- [ ] **Step 1: Create the FAQ data file**

Create `lib/data/faq.ts`:

```typescript
export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  title: string;
  items: FaqItem[];
};

export const FAQ_DATA: FaqCategory[] = [
  {
    title: "Commandes",
    items: [
      {
        question: "Comment passer une commande ?",
        answer:
          "Parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis cliquez sur « Commander ». Remplissez vos informations de livraison et confirmez votre commande. Vous recevrez un email de confirmation.",
      },
      {
        question: "Comment suivre ma commande ?",
        answer:
          "Connectez-vous à votre compte et rendez-vous dans « Mes commandes ». Vous y trouverez le statut de chaque commande (en attente, confirmée, expédiée, livrée).",
      },
      {
        question: "Puis-je annuler ma commande ?",
        answer:
          "Vous pouvez demander l'annulation d'une commande tant qu'elle n'a pas été expédiée. Contactez-nous via le formulaire ci-dessous en précisant votre numéro de commande.",
      },
    ],
  },
  {
    title: "Livraison",
    items: [
      {
        question: "Quelles sont les zones de livraison ?",
        answer:
          "Nous livrons dans toute la Côte d'Ivoire, principalement à Abidjan et dans les grandes villes. Les délais peuvent varier selon votre localisation.",
      },
      {
        question: "Quels sont les délais de livraison ?",
        answer:
          "La livraison à Abidjan prend généralement 24 à 48 heures après confirmation de la commande. Pour les autres villes, comptez 3 à 5 jours ouvrés.",
      },
      {
        question: "Quels sont les frais de livraison ?",
        answer:
          "La livraison est actuellement gratuite pour toutes les commandes sur DBS Store.",
      },
    ],
  },
  {
    title: "Paiement",
    items: [
      {
        question: "Quels sont les modes de paiement acceptés ?",
        answer:
          "Nous acceptons actuellement le paiement à la livraison (COD). Vous payez en espèces au livreur lors de la réception de votre colis.",
      },
      {
        question: "Pourquoi uniquement le paiement à la livraison ?",
        answer:
          "Le paiement à la livraison vous permet de vérifier votre commande avant de payer. Les paiements en ligne (Mobile Money, carte bancaire) seront disponibles prochainement.",
      },
    ],
  },
  {
    title: "Compte",
    items: [
      {
        question: "Comment créer un compte ?",
        answer:
          "Cliquez sur « Connexion » puis « Créer un compte ». Renseignez votre email et un mot de passe. Vous recevrez un code de vérification par email pour activer votre compte.",
      },
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer:
          "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Entrez votre adresse email et suivez les instructions pour réinitialiser votre mot de passe.",
      },
    ],
  },
  {
    title: "Produits",
    items: [
      {
        question: "Les produits sont-ils authentiques ?",
        answer:
          "Oui, tous nos produits sont 100 % authentiques et proviennent de fournisseurs agréés. Nous garantissons l'authenticité de chaque article vendu sur DBS Store.",
      },
      {
        question: "Les produits sont-ils garantis ?",
        answer:
          "Oui, tous nos produits bénéficient d'une garantie constructeur. La durée varie selon le produit et la marque. Les détails sont indiqués sur chaque fiche produit.",
      },
    ],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/faq.ts
git commit -m "feat(support): add FAQ data constants"
```

---

### Task 3: Contact email template + tests

**Files:**
- Modify: `lib/email/templates.ts`
- Modify: `tests/lib/email/templates.test.ts`

- [ ] **Step 1: Write failing tests for `buildContactEmail`**

Append to `tests/lib/email/templates.test.ts`:

```typescript
import { buildContactEmail } from "@/lib/email/templates";

describe("buildContactEmail", () => {
  const data = {
    name: "Kouamé",
    email: "kouame@test.ci",
    subject: "Question livraison",
    message: "Bonjour, quand sera livrée ma commande ?",
  };

  it("sends to the admin email address", () => {
    const msg = buildContactEmail(data);
    expect(msg.to).toContain("@");
  });

  it("prefixes the subject with [Contact]", () => {
    const msg = buildContactEmail(data);
    expect(msg.subject).toBe("[Contact] Question livraison");
  });

  it("includes the sender name in the HTML body", () => {
    const msg = buildContactEmail(data);
    expect(msg.html).toContain("Kouamé");
  });

  it("includes the sender email in the HTML body", () => {
    const msg = buildContactEmail(data);
    expect(msg.html).toContain("kouame@test.ci");
  });

  it("includes the message in the HTML body", () => {
    const msg = buildContactEmail(data);
    expect(msg.html).toContain("Bonjour, quand sera livrée ma commande ?");
  });

  it("includes the DBS Store header", () => {
    const msg = buildContactEmail(data);
    expect(msg.html).toContain("DBS Store");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run test tests/lib/email/templates.test.ts
```

Expected: FAIL — `buildContactEmail` is not exported.

- [ ] **Step 3: Implement `buildContactEmail` in `lib/email/templates.ts`**

Add to `lib/email/templates.ts`:

```typescript
export type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const ADMIN_EMAIL = process.env.CONTACT_EMAIL ?? "contact@dbstore.ci";

function buildContactHtml(data: ContactFormData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau message de contact</title>
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
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#0f172a;">Nouveau message de contact</h1>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;color:#334155;line-height:1.6;">
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#64748b;width:80px;vertical-align:top;">Nom</td>
                  <td style="padding:8px 0;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#64748b;vertical-align:top;">Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${data.email}" style="color:#2563eb;text-decoration:none;">${data.email}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#64748b;vertical-align:top;">Sujet</td>
                  <td style="padding:8px 0;">${data.subject}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:16px 0 8px;font-weight:600;color:#64748b;">Message</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;white-space:pre-wrap;">${data.message}</td>
                </tr>
              </table>
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
}

export function buildContactEmail(data: ContactFormData): EmailMessage {
  return {
    to: ADMIN_EMAIL,
    subject: `[Contact] ${data.subject}`,
    html: buildContactHtml(data),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/lib/email/templates.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/templates.ts tests/lib/email/templates.test.ts
git commit -m "feat(support): add contact email template with tests"
```

---

### Task 4: Server action + tests

**Files:**
- Create: `lib/actions/support.ts`
- Create: `tests/lib/actions/support.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/actions/support.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEnqueueEmail = vi.fn();

vi.mock("@/lib/email/enqueue", () => ({
  enqueueEmail: mockEnqueueEmail,
}));

vi.mock("@/lib/email/templates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email/templates")>();
  return {
    ...actual,
    buildContactEmail: actual.buildContactEmail,
  };
});

const { submitContactForm } = await import("@/lib/actions/support");

describe("submitContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnqueueEmail.mockResolvedValue(undefined);
  });

  it("returns error when name is empty", async () => {
    const result = await submitContactForm({
      name: "",
      email: "a@b.ci",
      subject: "Hello",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when name is too short", async () => {
    const result = await submitContactForm({
      name: "A",
      email: "a@b.ci",
      subject: "Hello",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when email is invalid", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "not-an-email",
      subject: "Hello",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when subject is too short", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "a@b.ci",
      subject: "Hi",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when message is too short", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "a@b.ci",
      subject: "Hello world",
      message: "Court",
    });
    expect(result.error).toBeDefined();
  });

  it("calls enqueueEmail on valid input", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "kouame@test.ci",
      subject: "Question livraison",
      message: "Bonjour, je voudrais savoir le délai.",
    });
    expect(result.error).toBeUndefined();
    expect(mockEnqueueEmail).toHaveBeenCalledOnce();
  });

  it("passes correct email structure to enqueueEmail", async () => {
    await submitContactForm({
      name: "Kouamé",
      email: "kouame@test.ci",
      subject: "Question livraison",
      message: "Bonjour, je voudrais savoir le délai.",
    });
    const emailArg = mockEnqueueEmail.mock.calls[0][0];
    expect(emailArg.subject).toBe("[Contact] Question livraison");
    expect(emailArg.html).toContain("Kouamé");
    expect(emailArg.html).toContain("kouame@test.ci");
  });

  it("returns error when enqueueEmail fails", async () => {
    mockEnqueueEmail.mockRejectedValue(new Error("queue down"));
    const result = await submitContactForm({
      name: "Kouamé",
      email: "kouame@test.ci",
      subject: "Question livraison",
      message: "Bonjour, je voudrais savoir le délai.",
    });
    expect(result.error).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run test tests/lib/actions/support.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the server action**

Create `lib/actions/support.ts`:

```typescript
"use server";

import { enqueueEmail } from "@/lib/email/enqueue";
import { buildContactEmail } from "@/lib/email/templates";
import type { ContactFormData } from "@/lib/email/templates";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(
  data: ContactFormData
): { success: true } | { success: false; error: string } {
  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 100) {
    return { success: false, error: "Le nom doit contenir entre 2 et 100 caractères." };
  }
  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) {
    return { success: false, error: "Veuillez entrer une adresse email valide." };
  }
  if (!data.subject || data.subject.trim().length < 5 || data.subject.trim().length > 200) {
    return { success: false, error: "Le sujet doit contenir entre 5 et 200 caractères." };
  }
  if (!data.message || data.message.trim().length < 10 || data.message.trim().length > 2000) {
    return { success: false, error: "Le message doit contenir entre 10 et 2000 caractères." };
  }
  return { success: true };
}

export async function submitContactForm(
  data: ContactFormData
): Promise<{ error?: string }> {
  const validation = validateContactForm(data);
  if (!validation.success) {
    return { error: validation.error };
  }

  const trimmed: ContactFormData = {
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject.trim(),
    message: data.message.trim(),
  };

  try {
    const emailMessage = buildContactEmail(trimmed);
    await enqueueEmail(emailMessage);
    return {};
  } catch (err) {
    console.error("[submitContactForm]", err);
    return { error: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/lib/actions/support.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/support.ts tests/lib/actions/support.test.ts
git commit -m "feat(support): add contact form server action with validation and tests"
```

---

### Task 5: FAQ section component + tests

**Files:**
- Create: `components/support/faq-section.tsx`
- Create: `tests/components/support/faq-section.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/support/faq-section.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FaqSection } from "@/components/support/faq-section";
import { FAQ_DATA } from "@/lib/data/faq";

describe("FaqSection", () => {
  it("renders all FAQ category titles", () => {
    render(<FaqSection />);
    for (const category of FAQ_DATA) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });

  it("renders all questions as accordion triggers", () => {
    render(<FaqSection />);
    const allQuestions = FAQ_DATA.flatMap((c) => c.items.map((i) => i.question));
    for (const question of allQuestions) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });

  it("renders the correct number of accordion items", () => {
    render(<FaqSection />);
    const totalItems = FAQ_DATA.reduce((sum, c) => sum + c.items.length, 0);
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBe(totalItems);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run test tests/components/support/faq-section.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the FAQ section component**

Create `components/support/faq-section.tsx`:

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_DATA } from "@/lib/data/faq";

export function FaqSection() {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-bold tracking-tight">
        Questions fréquentes
      </h2>
      <div className="mt-6 space-y-8">
        {FAQ_DATA.map((category) => (
          <div key={category.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category.title}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {category.items.map((item) => (
                <AccordionItem
                  key={item.question}
                  value={item.question}
                  className="rounded-lg border px-4"
                >
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/components/support/faq-section.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/support/faq-section.tsx tests/components/support/faq-section.test.tsx
git commit -m "feat(support): add FAQ section component with tests"
```

---

### Task 6: Contact form component + tests

**Files:**
- Create: `components/support/contact-form.tsx`
- Create: `tests/components/support/contact-form.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/components/support/contact-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/support/contact-form";

describe("ContactForm", () => {
  it("renders all form fields", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sujet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();
  });

  it("disables the submit button while submitting", async () => {
    const user = userEvent.setup();
    // Mock the action to never resolve (simulate pending state)
    const mockAction = vi.fn(() => new Promise<{ error?: string }>(() => {}));
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(screen.getByRole("button", { name: /envoi/i })).toBeDisabled();
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({});
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(await screen.findByText(/message.*envoyé/i)).toBeInTheDocument();
  });

  it("shows server error message on failure", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ error: "Email invalide" });
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
  });

  it("calls the default server action when no action prop is provided", async () => {
    // Just verify it renders without crashing
    render(<ContactForm />);
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun run test tests/components/support/contact-form.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the contact form component**

Create `components/support/contact-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactForm } from "@/lib/actions/support";
import type { ContactFormData } from "@/lib/email/templates";

type ContactFormProps = {
  action?: (data: ContactFormData) => Promise<{ error?: string }>;
};

export function ContactForm({ action }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: ContactFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const submit = action ?? submitContactForm;
    const result = await submit(data);

    if (result.error) {
      setServerError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setSubmitting(false);
      form.reset();
    }
  }

  return (
    <section aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="text-xl font-bold tracking-tight">
        Nous contacter
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Vous n&apos;avez pas trouvé de réponse ? Envoyez-nous un message.
      </p>

      {success ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-medium text-green-800">
            Votre message a été envoyé avec succès !
          </p>
          <p className="mt-1 text-sm text-green-700">
            Nous vous répondrons dans les plus brefs délais.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSuccess(false)}
          >
            Envoyer un autre message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nom</Label>
              <Input
                id="contact-name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder="votre@email.ci"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">Sujet</Label>
            <Input
              id="contact-subject"
              name="subject"
              required
              minLength={5}
              maxLength={200}
              placeholder="Le sujet de votre message"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Décrivez votre demande en détail..."
            />
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="gap-2">
            <Send className="size-4" />
            {submitting ? "Envoi en cours..." : "Envoyer le message"}
          </Button>
        </form>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test tests/components/support/contact-form.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/support/contact-form.tsx tests/components/support/contact-form.test.tsx
git commit -m "feat(support): add contact form component with tests"
```

---

### Task 7: Support page + navigation links

**Files:**
- Create: `app/(main)/support/page.tsx`
- Modify: `components/layout/app-bar/desktop-nav.tsx`
- Modify: `components/layout/app-bar/mobile-menu.tsx`

- [ ] **Step 1: Create the support page**

Create `app/(main)/support/page.tsx`:

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { FaqSection } from "@/components/support/faq-section";
import { ContactForm } from "@/components/support/contact-form";

export const metadata: Metadata = {
  title: "Support — DBS Store",
  description:
    "Consultez notre FAQ ou contactez-nous. Nous sommes là pour vous aider avec vos commandes, livraisons et questions sur nos produits.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Accueil
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">Support</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        Centre d&apos;aide
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Trouvez des réponses à vos questions ou contactez notre équipe.
      </p>

      <div className="mt-10">
        <FaqSection />
      </div>

      <hr className="my-12 border-border" />

      <div className="mb-8">
        <ContactForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Support link to desktop nav**

In `components/layout/app-bar/desktop-nav.tsx`, after the "Offres" `<Link>` (line 128-133), add:

```tsx
      <Link
        href="/support"
        className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Support
      </Link>
```

- [ ] **Step 3: Add Support link to mobile menu**

In `components/layout/app-bar/mobile-menu.tsx`, after the "Offres & Promotions" `<Link>` (line 87-93), add:

```tsx
            <Link
              href="/support"
              className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-4 text-base font-medium transition-colors hover:bg-muted"
              onClick={handleClose}
            >
              Support
            </Link>
```

- [ ] **Step 4: Run the full test suite**

```bash
bun run test
```

Expected: all tests PASS.

- [ ] **Step 5: Run lint**

```bash
bun run lint
```

Expected: no new errors.

- [ ] **Step 6: Verify in browser**

Open `http://localhost:33000/support` and check:
- Breadcrumb displays correctly
- All FAQ categories render with accordion expand/collapse
- Contact form fields are present and interactive
- Navigation links (desktop + mobile) point to `/support`

- [ ] **Step 7: Commit**

```bash
git add "app/(main)/support/page.tsx" components/layout/app-bar/desktop-nav.tsx components/layout/app-bar/mobile-menu.tsx
git commit -m "feat(support): add support page with FAQ and contact form, add nav links"
```

---

### Task 8: Final verification + update roadmap

**Files:**
- Modify: `docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md`

- [ ] **Step 1: Run full CI locally**

```bash
bun run lint && bun run test && bun run build
```

Expected: all pass.

- [ ] **Step 2: Update roadmap**

In `docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md`, update Phase 7:

Change `**Statut : A faire**` to `**Statut : DONE**`

Check the checkboxes:
```markdown
- [x] FAQ affichée
- [x] Formulaire de contact fonctionnel
- [x] Tests passent, CI verte, deploy prod OK
```

Update the summary table: change Phase 7 status from `A faire` to `**Done**`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md
git commit -m "docs: mark Phase 7 (support page) as done"
```
