# Phase 7 — Page Support : Design Spec

## Objectif

Ajouter une page `/support` au storefront avec une FAQ statique et un formulaire de contact. Le formulaire envoie un email à l'admin via `enqueueEmail()` (Cloudflare Queue). Pas de stockage en DB, pas de CRUD admin.

---

## Structure de la page

Layout vertical, une seule colonne :

1. **Breadcrumb** — Accueil > Support
2. **En-tête** — Titre + description
3. **Section FAQ** — Accordion Shadcn avec catégories
4. **Section Contact** — Formulaire (nom, email, sujet, message) + confirmation inline

---

## FAQ

### Source de données

Fichier de constantes `lib/data/faq.ts` exportant un tableau typé :

```typescript
type FaqCategory = {
  title: string;       // e.g. "Commandes"
  items: FaqItem[];
};

type FaqItem = {
  question: string;
  answer: string;      // texte brut (pas de HTML)
};

export const FAQ_DATA: FaqCategory[] = [...];
```

### Catégories FAQ

| Catégorie | Exemples de questions |
|-----------|----------------------|
| Commandes | Comment passer commande ? Comment suivre ma commande ? Puis-je annuler ? |
| Livraison | Zones de livraison ? Délais ? Frais ? |
| Paiement | Modes de paiement ? Pourquoi COD uniquement ? |
| Compte | Comment créer un compte ? Mot de passe oublié ? |
| Produits | Garantie ? Produits authentiques ? |

### Composant

`components/support/faq-section.tsx` — composant serveur (pas de state).

Utilise `Accordion` de Shadcn UI (à installer). Chaque catégorie est un groupe avec un titre `<h3>`, chaque question est un `AccordionItem` avec `AccordionTrigger` / `AccordionContent`.

Type d'accordion : `multiple` (plusieurs réponses ouvertes à la fois).

---

## Formulaire de contact

### Champs

| Champ | Type | Validation |
|-------|------|------------|
| `name` | `string` | Requis, 2-100 caractères |
| `email` | `string` | Requis, format email valide |
| `subject` | `string` | Requis, 5-200 caractères |
| `message` | `string` | Requis, 10-2000 caractères |

### Composant client

`components/support/contact-form.tsx` — `"use client"`.

- State : `submitting`, `serverError`, `success`
- Sur submit : appelle le server action, affiche le résultat
- Sur succès : affiche un message de confirmation, reset le formulaire
- Sur erreur : affiche le message d'erreur retourné par le server action
- Pattern identique aux formulaires existants (product-form, team-management)

### Server action

`lib/actions/support.ts` :

```typescript
"use server";

export type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function submitContactForm(
  data: ContactFormData
): Promise<{ error?: string }> {
  // 1. Valider les inputs (longueurs, format email)
  // 2. Construire l'email via buildContactEmail()
  // 3. Appeler enqueueEmail(emailMessage)
  // 4. Retourner {} en cas de succès
  // En cas d'erreur : retourner { error: "message" }
}
```

Pas d'auth requise — la page est publique.

### Email

Étendre `lib/email/templates.ts` avec une fonction `buildContactEmail()` :

```typescript
export function buildContactEmail(data: ContactFormData): EmailMessage {
  return {
    to: ADMIN_EMAIL,            // constante ou env var
    subject: `[Contact] ${data.subject}`,
    html: buildContactHtml(data),
  };
}
```

Le template HTML reprend le même style que `buildOtpEmail` (header DBS Store, layout table, footer). Le corps affiche : nom, email de l'expéditeur (pour répondre), sujet, message.

L'adresse email admin sera une constante dans `lib/email/templates.ts` (e.g. `contact@dbstore.ci` — à confirmer).

---

## Navigation

### Desktop (`desktop-nav.tsx`)

Ajouter un lien "Support" après le lien "Offres", avec le même style que les autres liens :

```tsx
<Link
  href="/support"
  className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
>
  Support
</Link>
```

### Mobile (`mobile-menu.tsx`)

Ajouter un lien "Support" dans la liste des liens principaux, après "Offres & Promotions" :

```tsx
<Link
  href="/support"
  className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-4 text-base font-medium transition-colors hover:bg-muted"
  onClick={handleClose}
>
  Support
</Link>
```

---

## Metadata

```typescript
export const metadata: Metadata = {
  title: "Support — DBS Store",
  description:
    "Consultez notre FAQ ou contactez-nous. Nous sommes là pour vous aider avec vos commandes, livraisons et questions sur nos produits.",
};
```

---

## Fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| `components/ui/accordion.tsx` | Créer | Composant Shadcn Accordion (via CLI) |
| `lib/data/faq.ts` | Créer | Constantes FAQ catégorisées |
| `app/(main)/support/page.tsx` | Créer | Page serveur : metadata + FAQ + formulaire |
| `components/support/faq-section.tsx` | Créer | Section FAQ avec Accordion |
| `components/support/contact-form.tsx` | Créer | Formulaire client |
| `lib/actions/support.ts` | Créer | Server action + validation |
| `lib/email/templates.ts` | Modifier | Ajouter `buildContactEmail()` |
| `components/layout/app-bar/desktop-nav.tsx` | Modifier | Ajouter lien Support |
| `components/layout/app-bar/mobile-menu.tsx` | Modifier | Ajouter lien Support |

---

## Tests

| Test | Fichier |
|------|---------|
| FAQ section renders toutes les catégories et items | `tests/components/support/faq-section.test.tsx` |
| Contact form validation (champs vides, email invalide) | `tests/components/support/contact-form.test.tsx` |
| Contact form affiche succès/erreur | `tests/components/support/contact-form.test.tsx` |
| Server action validation (rejette inputs invalides) | `tests/lib/actions/support.test.ts` |
| Server action appelle enqueueEmail avec les bons params | `tests/lib/actions/support.test.ts` |
| buildContactEmail génère le bon HTML | `tests/lib/email/templates.test.ts` |

---

## Hors scope

- Stockage des messages en D1
- CRUD admin pour la FAQ
- Captcha / rate limiting (v2)
- Chatbot / live chat
- Page de tickets
