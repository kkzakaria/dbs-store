# Phase 8 — Newsletter : Design Spec

## Objectif

Permettre aux visiteurs de s'inscrire a la newsletter DBS Store depuis la homepage. Collecter les emails en D1 avec protection anti-spam (honeypot + rate limit KV). Preparer le terrain pour la desinscription.

---

## 1. Base de donnees

### Table `newsletter_subscribers`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | text PK | UUID |
| `email` | text UNIQUE NOT NULL | Email normalise (lowercase, trim) |
| `token` | text UNIQUE NOT NULL | Token UUID pour desinscription |
| `is_active` | integer (boolean) | `true` par defaut, `false` apres desinscription |
| `created_at` | integer (timestamp) | Date d'inscription |

Migration : `0004_newsletter_subscribers.sql`

---

## 2. Server actions

Fichier : `lib/actions/newsletter.ts`

### `subscribeNewsletter(data: unknown)`

1. Valide l'email (regex + trim + lowercase)
2. Verifie le honeypot (champ `website` doit etre vide)
3. Rate limit KV : verifie IP, max 3 inscriptions/heure — cle `newsletter-rl:{ip}`, TTL 1h
4. Si email deja en base → retourne succes silencieux (pas de fuite d'information)
5. Sinon → insere avec token UUID + `is_active: true`
6. Retourne `{ success: true }` ou `{ error: string }`

### `unsubscribeNewsletter(token: string)`

1. Valide le format du token (UUID)
2. Cherche l'abonne par token
3. Met `is_active` a `false`
4. Retourne `{ success: true }` ou `{ error: string }`

---

## 3. Composants & pages

### Composant `components/newsletter-form.tsx`

- Client component (`"use client"`)
- Input email + bouton "S'inscrire"
- Champ honeypot cache (`website`, `aria-hidden`, `tabIndex={-1}`, `autocomplete="off"`)
- Etats : idle → loading → success / error
- Message succes : "Merci pour votre inscription !"
- Remplace le bloc statique actuel dans `app/(main)/page.tsx` (lignes 142-159)

### Page `/newsletter/unsubscribe`

- Fichier : `app/(main)/newsletter/unsubscribe/page.tsx`
- Recoit `?token=xxx` en query param
- Server component : appelle `unsubscribeNewsletter(token)` au chargement
- Affiche "Vous avez ete desinscrit" ou "Lien invalide"
- Pas de formulaire, juste un resultat + lien retour vers l'accueil

---

## 4. Rate limit KV

### Helper `lib/rate-limit.ts`

- Fonction `checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean>`
- Lit le compteur depuis KV, incremente, ecrit avec TTL
- En dev local (pas de KV) → toujours autorise (skip)
- Reutilisable pour d'autres cas futurs (contact form, etc.)

### Recuperation de l'IP

- Via `headers().get("cf-connecting-ip")` (Cloudflare) avec fallback sur `x-forwarded-for`

---

## 5. Tests

### `tests/lib/actions/newsletter.test.ts`

- Validation email (format invalide, vide, trop long)
- Honeypot rempli → rejet
- Doublon email → succes silencieux
- Inscription reussie → insert en base
- Desinscription token valide → `is_active = false`
- Desinscription token invalide → erreur

### `tests/components/newsletter-form.test.tsx`

- Rendu initial (input, bouton)
- Soumission reussie → message succes
- Soumission erreur → message erreur
- Champ honeypot present mais cache

### `tests/app/newsletter-unsubscribe.test.tsx`

- Token valide → message de confirmation
- Token invalide/manquant → message d'erreur

### Mocks

- `getDb` mocke (comme les tests existants)
- `getKv` mocke (retourne un fake KV store)

---

## 6. Decisions

- **Doublons silencieux** : un email deja inscrit recoit un succes sans action (pas de fuite d'information)
- **Anti-spam double** : honeypot + rate limit KV (3/heure/IP)
- **Desinscription preparee** : token UUID par abonne + page `/newsletter/unsubscribe`, pret pour quand on enverra des newsletters
- **Pas d'email de confirmation** : hors scope — on stocke l'email directement, la double opt-in viendra si necessaire
