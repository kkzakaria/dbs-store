# Phase 5 — Cloudflare Queue pour emails async (design)

**Date :** 2026-04-07
**Statut :** Validé, prêt pour planning
**Phase roadmap :** Phase 5 (PRD v1)

## Scope

**Inclus :**
- File d'attente Cloudflare Queue pour l'envoi d'emails (asynchrone)
- Migration de `sendOtpEmail` (auth OTP) vers la queue
- API générique `enqueueEmail({ to, subject, html })` réutilisable pour Phase 7 et futurs emails
- Dead Letter Queue (DLQ) pour les échecs définitifs
- Fallback synchrone en dev local (Node + better-sqlite3)
- Consumer DLQ qui archive les échecs définitifs dans la table D1 `failed_emails`

**Exclus (out of scope, sortis du roadmap initial) :**
- Image processing / resize via queue (reporté — Workers n'a pas `sharp` natif, gain marginal vs Next.js Image, à reconsidérer si besoin concret)
- Nouveaux templates email (commande, contact) — la Phase 5 fournit l'API, les use-cases viendront avec leurs phases respectives

> ⚠️ Le roadmap PRD v1 (`docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md`) doit être mis à jour pour refléter le retrait du scope image de la Phase 5.

## Architecture

```
[Server code]            [Producer]              [Cloudflare Queue]      [Consumer Worker]      [Resend API]
   sendOtpEmail   →   enqueueEmail(msg)   →    EMAIL_QUEUE binding   →   queue() handler   →   resend.emails.send
                            │                                                    │
                       (dev: fallback                                       (échec 3x)
                        sync direct)                                             ↓
                                                                         EMAIL_DLQ (DLQ)
```

## Composants

### `lib/email/types.ts`
Type partagé producer/consumer :
```ts
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};
```

### `lib/email/send.ts`
`sendEmail(msg: EmailMessage): Promise<void>` — appel bas-niveau Resend (extrait de `lib/email.ts` actuel). Aucune logique OTP. Throw sur erreur Resend (utilisé par le consumer pour déclencher retry).

### `lib/email/templates.ts`
`buildOtpEmail(otp: string, type: OtpType): EmailMessage` — déménagement du HTML actuel + des `SUBJECTS`. Pure function, facilement testable.

### `lib/email/enqueue.ts`
`enqueueEmail(msg: EmailMessage): Promise<void>` :
- Tente `getCloudflareContext().env.EMAIL_QUEUE`
- Si binding présent → `EMAIL_QUEUE.send(msg)`
- Sinon (dev Node, ou contexte sans bindings) → `await sendEmail(msg)` direct (fallback synchrone, comportement actuel préservé)

### `lib/email.ts` (existant, refactorisé)
Devient un mince wrapper rétrocompatible :
```ts
export async function sendOtpEmail(to, otp, type) {
  return enqueueEmail(buildOtpEmail(otp, type, to));
}
```
Better Auth et tous les appelants existants ne changent pas.

### `lib/email/dlq-consumer.ts`
`handleEmailDlq(batch, env): Promise<void>` — consumer pour la DLQ `dbs-store-emails-dlq`. Archive chaque message mort dans la table D1 `failed_emails` via Drizzle. Sur succès D1 : `message.ack()`. Sur erreur D1 : `message.retry()` (Cloudflare droppera après `max_retries`, acceptable pour la DLQ). Chaque message est traité via `Promise.allSettled` pour isolation des échecs.

### Consumer worker — `queue()` handler
Handler `queue(batch, env)` qui :
1. Itère sur `batch.messages`
2. Pour chaque message : `await sendEmail(msg.body)`
3. Sur succès : `message.ack()`
4. Sur erreur : laisse remonter (retry automatique Cloudflare)

**Intégration avec OpenNext (point délicat) :**
`@opennextjs/cloudflare` génère un worker `fetch()` only. Approche retenue :

- **Option A (recommandée) — Wrapper worker** : créer un fichier custom (ex. `worker/index.ts`) qui ré-exporte le worker OpenNext (`fetch`) + ajoute `queue()`. `wrangler.jsonc` `main` pointe vers le wrapper, qui importe `.open-next/worker.js`. À valider par un spike avant gros du travail.
- **Option B (fallback)** : worker dédié consumer séparé, déployé en parallèle. Plus propre architecturalement mais double le pipeline.

Le plan d'implémentation commencera par un spike de l'option A. Si bloquant, bascule sur B.

## Configuration `wrangler.jsonc`

```jsonc
"queues": {
  "producers": [
    { "binding": "EMAIL_QUEUE", "queue": "dbs-store-emails" }
  ],
  "consumers": [
    {
      "queue": "dbs-store-emails",
      "max_batch_size": 10,
      "max_batch_timeout": 5,
      "max_retries": 3,
      "dead_letter_queue": "dbs-store-emails-dlq"
    }
  ]
}
```

Les queues sont créées **manuellement** une fois en prod :
```bash
wrangler queues create dbs-store-emails
wrangler queues create dbs-store-emails-dlq
```
Documenté dans le checkpoint de la phase. Pas de migration D1.

## Flux d'erreur

| Étape | Comportement |
|-------|--------------|
| Resend retourne erreur | `sendEmail` throw → message non-ack |
| Retry 1, 2, 3 | Backoff exponentiel géré par Cloudflare |
| Échec définitif (3x) | Message routé vers `dbs-store-emails-dlq` |
| Investigation | `wrangler queues consumer dbs-store-emails-dlq peek` |
| Consumer DLQ | **Aucun** (out of scope) |

## Comportement en dev local

`bun run dev` (Node + better-sqlite3, port 33000) n'a pas accès au binding `EMAIL_QUEUE`. `enqueueEmail` détecte l'absence et **fallback synchrone** vers `sendEmail` direct. Comportement OTP local identique à aujourd'hui. Cohérent avec l'approche D1 (better-sqlite3 fallback).

`bun run preview` (wrangler dev, port 8788) a accès aux bindings ; à confirmer pendant le spike si miniflare émule correctement les queues localement.

## Tests

| Fichier | Couverture |
|---------|------------|
| `lib/email/templates.test.ts` | Snapshots HTML pour les 3 types OTP (sign-in, email-verification, forget-password) — n'existait pas, ajout |
| `lib/email/send.test.ts` | `sendEmail` appelle Resend correctement, throw sur erreur |
| `lib/email/enqueue.test.ts` | Fallback sync en l'absence de binding ; appel `EMAIL_QUEUE.send` quand binding mocké |
| Consumer queue handler | Test unitaire avec batch mocké : ack sur succès, throw sur échec Resend |

Pas de test e2e Queue (nécessite miniflare avec support queues, hors stack vitest actuelle). Validation manuelle via `bun run preview` et prod.

## Migration / rétrocompatibilité

- **Aucun appelant à modifier** : `sendOtpEmail(to, otp, type)` garde sa signature
- Better Auth continue d'appeler la même fonction
- Pas de migration D1
- Création des queues : étape manuelle one-time documentée dans le checkpoint

## Risques identifiés

1. **Compat OpenNext + `queue()` handler** — non vérifié. Spike requis en début de plan. Si bloquant : option B (worker séparé).
2. **`getCloudflareContext()` hors request scope** — `enqueueEmail` est appelé depuis le contexte server action / Better Auth handler, donc dans une request. À confirmer pendant l'implémentation.
3. **Cold start consumer** — init Resend SDK ~50ms, négligeable pour de l'async.
4. **Miniflare queues local** — incertitude sur le support en `wrangler dev`. Si non supporté, validation queue uniquement en prod (acceptable pour Phase 5).

## Checkpoint de la phase

- [ ] Queues créées en prod (`dbs-store-emails`, `dbs-store-emails-dlq`)
- [ ] `wrangler.jsonc` configuré (producer + consumer + DLQ)
- [ ] Code refactoré : `lib/email/` modulaire, `sendOtpEmail` rétrocompatible
- [ ] Consumer `queue()` intégré au worker (option A ou B)
- [ ] Tests passent, lint OK, build OK
- [ ] CI verte
- [ ] Deploy prod réussi
- [ ] Validation manuelle : envoi OTP en prod transite par la queue (vérifié via Cloudflare dashboard)
- [ ] Roadmap PRD v1 mis à jour (Phase 5 marquée DONE, scope image clarifié)
