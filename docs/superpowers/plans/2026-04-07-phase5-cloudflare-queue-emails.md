# Phase 5 — Cloudflare Queue for async emails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route all transactional emails through a Cloudflare Queue with retries + DLQ, while preserving the existing `sendOtpEmail` API and a synchronous fallback for local Node dev.

**Architecture:** Refactor `lib/email.ts` into a small module (`lib/email/`) with three pure pieces — `templates`, `send` (Resend wrapper), `enqueue` (queue producer with sync fallback). Add a Cloudflare Queue producer binding `EMAIL_QUEUE` and a consumer that calls `sendEmail` with retry → DLQ. Wrap the OpenNext-generated worker to add a `queue()` handler alongside `fetch()`.

**Tech Stack:** TypeScript, Next.js 16, `@opennextjs/cloudflare`, Cloudflare Workers + Queues, Resend SDK, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-07-phase5-cloudflare-queue-emails-design.md`

---

## File Structure

**Created:**
- `lib/email/types.ts` — `EmailMessage` type + `OtpType` re-export
- `lib/email/send.ts` — `sendEmail(msg)` Resend wrapper (throws on error)
- `lib/email/templates.ts` — `buildOtpEmail(to, otp, type)` pure function
- `lib/email/enqueue.ts` — `enqueueEmail(msg)` with sync fallback
- `lib/email/consumer.ts` — `handleEmailQueue(batch)` queue consumer logic
- `worker/index.ts` — Custom worker wrapper re-exporting OpenNext `fetch` + adding `queue`
- `tests/lib/email/templates.test.ts`
- `tests/lib/email/send.test.ts`
- `tests/lib/email/enqueue.test.ts`
- `tests/lib/email/consumer.test.ts`

**Modified:**
- `lib/email.ts` — becomes a thin re-export shim wrapping `enqueueEmail(buildOtpEmail(...))`
- `wrangler.jsonc` — add `queues.producers` + `queues.consumers`, change `main`
- `worker-configuration.d.ts` — regenerated to include `EMAIL_QUEUE` binding type
- `tests/lib/email.test.ts` — kept (covers integration through `sendOtpEmail` shim)
- `docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md` — mark Phase 5 done, clarify image scope removal

---

## Task 0: Spike — verify OpenNext + custom queue handler wrapper

**Goal:** Confirm we can wrap `.open-next/worker.js` to add a `queue()` export without breaking the build/deploy. If this fails, the plan falls back to a separate consumer worker (out-of-scope deviation requiring a re-plan).

**Files:**
- Create: `worker/index.ts`
- Modify: `wrangler.jsonc` (temporarily)

- [ ] **Step 1: Run `bun run build:worker` once to confirm `.open-next/worker.js` exists**

Run: `bun run build:worker`
Expected: succeeds, `.open-next/worker.js` is present.

- [ ] **Step 2: Create the wrapper file**

Create `worker/index.ts`:

```ts
// Custom Cloudflare Worker entry that wraps the OpenNext-generated worker
// to add a `queue()` handler for the EMAIL_QUEUE consumer.
//
// The OpenNext build produces `.open-next/worker.js` which default-exports
// `{ fetch }`. We re-export it and add `queue` alongside.

// @ts-expect-error - generated file, no types
import openNextWorker from "../.open-next/worker.js";
import { handleEmailQueue } from "../lib/email/consumer";

export default {
  fetch: openNextWorker.fetch,
  async queue(batch: MessageBatch<unknown>, env: CloudflareEnv): Promise<void> {
    await handleEmailQueue(batch);
  },
};

// Re-export the DOQueueHandler / DOShardedTagCache durable objects that
// OpenNext expects to be exported from the worker entry.
export * from "../.open-next/worker.js";
```

- [ ] **Step 3: Create a stub `lib/email/consumer.ts` so the import resolves**

Create `lib/email/consumer.ts`:

```ts
export async function handleEmailQueue(
  _batch: MessageBatch<unknown>,
  _env: CloudflareEnv
): Promise<void> {
  // Stubbed for spike — real implementation in Task 6
}
```

- [ ] **Step 4: Point `wrangler.jsonc` `main` at the wrapper**

Edit `wrangler.jsonc`, change:
```jsonc
"main": ".open-next/worker.js",
```
to:
```jsonc
"main": "worker/index.ts",
```

- [ ] **Step 5: Run the worker build again**

Run: `bun run build:worker`
Expected: build succeeds. If it fails because OpenNext rewrites `main`, revert step 4 and instead modify `open-next.config.ts` per OpenNext docs (`buildCommand` / custom entry). If neither works, **STOP** and re-plan with a separate consumer worker.

- [ ] **Step 6: Run `bun run build` (Next-only)**

Run: `bun run build`
Expected: succeeds (Next build is independent of the worker entry).

- [ ] **Step 7: Commit the spike result**

```bash
git add worker/index.ts lib/email/consumer.ts wrangler.jsonc
git commit -m "spike(phase5): wrap OpenNext worker with queue handler entry"
```

---

## Task 1: Extract `EmailMessage` type and `sendEmail` Resend wrapper

**Files:**
- Create: `lib/email/types.ts`
- Create: `lib/email/send.ts`
- Test: `tests/lib/email/send.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/email/send.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

const { sendEmail } = await import("@/lib/email/send");

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "id" }, error: null });
  });

  it("calls Resend with the message fields and a from address", async () => {
    await sendEmail({ to: "u@x.ci", subject: "S", html: "<p>H</p>" });
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("u@x.ci");
    expect(call.subject).toBe("S");
    expect(call.html).toBe("<p>H</p>");
    expect(call.from).toContain("dbs-store.ci");
  });

  it("throws when Resend returns an error.message", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      sendEmail({ to: "u@x.ci", subject: "S", html: "H" })
    ).rejects.toThrow("boom");
  });

  it("throws with error.name fallback when message is absent", async () => {
    mockSend.mockResolvedValue({ data: null, error: { name: "RateLimitError" } });
    await expect(
      sendEmail({ to: "u@x.ci", subject: "S", html: "H" })
    ).rejects.toThrow("RateLimitError");
  });
});
```

- [ ] **Step 2: Run the test, verify failure**

Run: `bun run test tests/lib/email/send.test.ts`
Expected: FAIL — module `@/lib/email/send` not found.

- [ ] **Step 3: Create the type module**

Create `lib/email/types.ts`:

```ts
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type OtpType = "sign-in" | "email-verification" | "forget-password";
```

- [ ] **Step 4: Create the send module**

Create `lib/email/send.ts`:

```ts
import { Resend } from "resend";
import type { EmailMessage } from "./types";

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "DBS Store <noreply@dbs-store.ci>";

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
  });
  if (error) {
    throw new Error(error.message || error.name || "Resend: unknown error");
  }
}
```

- [ ] **Step 5: Run the test, verify pass**

Run: `bun run test tests/lib/email/send.test.ts`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add lib/email/types.ts lib/email/send.ts tests/lib/email/send.test.ts
git commit -m "feat(email): extract sendEmail Resend wrapper and EmailMessage type"
```

---

## Task 2: Extract OTP templates into a pure builder

**Files:**
- Create: `lib/email/templates.ts`
- Test: `tests/lib/email/templates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/email/templates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildOtpEmail } from "@/lib/email/templates";

describe("buildOtpEmail", () => {
  it("returns an EmailMessage with the recipient", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "forget-password");
    expect(msg.to).toBe("u@x.ci");
  });

  it("uses the forget-password subject", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "forget-password");
    expect(msg.subject).toMatch(/réinitialisation/i);
  });

  it("uses the email-verification subject", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "email-verification");
    expect(msg.subject).toMatch(/vérifiez votre adresse/i);
  });

  it("uses the sign-in subject", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "sign-in");
    expect(msg.subject).toMatch(/code de connexion/i);
  });

  it("embeds the OTP code in the html body", () => {
    const msg = buildOtpEmail("u@x.ci", "654321", "forget-password");
    expect(msg.html).toContain("654321");
  });

  it("includes the DBS Store header", () => {
    const msg = buildOtpEmail("u@x.ci", "1", "sign-in");
    expect(msg.html).toContain("DBS Store");
  });
});
```

- [ ] **Step 2: Run the test, verify failure**

Run: `bun run test tests/lib/email/templates.test.ts`
Expected: FAIL — `@/lib/email/templates` not found.

- [ ] **Step 3: Create the templates module**

Create `lib/email/templates.ts` by copying the existing HTML/subject logic from `lib/email.ts` (lines 8–85) into a pure function:

```ts
import type { EmailMessage, OtpType } from "./types";

const SUBJECTS: Record<OtpType, string> = {
  "forget-password": "Réinitialisation de votre mot de passe — DBS Store",
  "email-verification": "Vérifiez votre adresse email — DBS Store",
  "sign-in": "Votre code de connexion — DBS Store",
};

function buildHtml(otp: string, type: OtpType): string {
  const title =
    type === "forget-password"
      ? "Réinitialisation de mot de passe"
      : type === "email-verification"
        ? "Vérification de votre adresse email"
        : "Connexion à votre compte";

  const body =
    type === "forget-password"
      ? "Utilisez le code ci-dessous pour réinitialiser votre mot de passe. Il est valable <strong>5 minutes</strong>."
      : type === "email-verification"
        ? "Utilisez le code ci-dessous pour valider votre adresse email. Il est valable <strong>5 minutes</strong>."
        : "Utilisez le code ci-dessous pour vous connecter. Il est valable <strong>5 minutes</strong>.";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">${title}</h1>
              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6;">${body}</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f172a;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Si vous n'avez pas demandé ce code, ignorez cet email. Votre compte reste sécurisé.
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
}

export function buildOtpEmail(
  to: string,
  otp: string,
  type: OtpType
): EmailMessage {
  return {
    to,
    subject: SUBJECTS[type],
    html: buildHtml(otp, type),
  };
}
```

- [ ] **Step 4: Run the test, verify pass**

Run: `bun run test tests/lib/email/templates.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/email/templates.ts tests/lib/email/templates.test.ts
git commit -m "feat(email): extract buildOtpEmail pure template builder"
```

---

## Task 3: Implement `enqueueEmail` with sync fallback

**Files:**
- Create: `lib/email/enqueue.ts`
- Test: `tests/lib/email/enqueue.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/email/enqueue.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQueueSend = vi.fn();
const mockSendEmail = vi.fn();
const mockGetCfContext = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCfContext,
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: mockSendEmail,
}));

const { enqueueEmail } = await import("@/lib/email/enqueue");

describe("enqueueEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
    mockQueueSend.mockResolvedValue(undefined);
  });

  it("sends to EMAIL_QUEUE when binding is present", async () => {
    mockGetCfContext.mockResolvedValue({
      env: { EMAIL_QUEUE: { send: mockQueueSend } },
    });

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await enqueueEmail(msg);

    expect(mockQueueSend).toHaveBeenCalledWith(msg);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("falls back to sendEmail when EMAIL_QUEUE binding is missing", async () => {
    mockGetCfContext.mockResolvedValue({ env: {} });

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await enqueueEmail(msg);

    expect(mockSendEmail).toHaveBeenCalledWith(msg);
    expect(mockQueueSend).not.toHaveBeenCalled();
  });

  it("falls back to sendEmail when getCloudflareContext throws (Node dev)", async () => {
    mockGetCfContext.mockRejectedValue(new Error("no cf context"));

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await enqueueEmail(msg);

    expect(mockSendEmail).toHaveBeenCalledWith(msg);
  });
});
```

- [ ] **Step 2: Run the test, verify failure**

Run: `bun run test tests/lib/email/enqueue.test.ts`
Expected: FAIL — `@/lib/email/enqueue` not found.

- [ ] **Step 3: Create the enqueue module**

Create `lib/email/enqueue.ts`:

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

export async function enqueueEmail(msg: EmailMessage): Promise<void> {
  try {
    const { env } = await getCloudflareContext<CloudflareEnv>();
    const queue = (env as { EMAIL_QUEUE?: Queue<EmailMessage> }).EMAIL_QUEUE;
    if (queue) {
      await queue.send(msg);
      return;
    }
  } catch {
    // No Cloudflare context (e.g. Node dev) — fall through to sync send
  }
  await sendEmail(msg);
}
```

- [ ] **Step 4: Run the test, verify pass**

Run: `bun run test tests/lib/email/enqueue.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/email/enqueue.ts tests/lib/email/enqueue.test.ts
git commit -m "feat(email): add enqueueEmail with EMAIL_QUEUE binding and sync fallback"
```

---

## Task 4: Refactor `lib/email.ts` into a thin shim

**Files:**
- Modify: `lib/email.ts` (replace contents)
- Test: `tests/lib/email.test.ts` (existing — must keep passing)

- [ ] **Step 1: Replace `lib/email.ts` contents**

Overwrite `lib/email.ts` with:

```ts
// Backwards-compatible shim. New code should import from `@/lib/email/enqueue`
// and `@/lib/email/templates` directly.
import { enqueueEmail } from "./email/enqueue";
import { buildOtpEmail } from "./email/templates";
import type { OtpType } from "./email/types";

export type { OtpType };

export async function sendOtpEmail(
  to: string,
  otp: string,
  type: OtpType
): Promise<void> {
  await enqueueEmail(buildOtpEmail(to, otp, type));
}
```

- [ ] **Step 2: Update the existing integration test to mock the queue path**

The current `tests/lib/email.test.ts` mocks `resend` directly. Now `sendOtpEmail` goes through `enqueueEmail`, which in tests has no Cloudflare context (`getCloudflareContext` will throw), so the fallback `sendEmail` path is taken, which still calls Resend. The existing tests should keep passing **without modification**.

- [ ] **Step 3: Run all email tests**

Run: `bun run test tests/lib/email.test.ts tests/lib/email/`
Expected: all green (existing 7 tests + new ones from tasks 1–3).

- [ ] **Step 4: Run typecheck via build**

Run: `bun run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts
git commit -m "refactor(email): turn lib/email.ts into a shim over enqueueEmail"
```

---

## Task 5: Implement the queue consumer

**Files:**
- Modify: `lib/email/consumer.ts` (replace stub from Task 0)
- Test: `tests/lib/email/consumer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/email/consumer.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MessageBatch } from "@cloudflare/workers-types";

const mockSendEmail = vi.fn();

vi.mock("@/lib/email/send", () => ({
  sendEmail: mockSendEmail,
}));

const { handleEmailQueue } = await import("@/lib/email/consumer");

function makeBatch(messages: Array<{ id: string; body: unknown }>) {
  const acks: string[] = [];
  const retries: string[] = [];
  return {
    batch: {
      queue: "dbs-store-emails",
      messages: messages.map((m) => ({
        id: m.id,
        timestamp: new Date(),
        body: m.body,
        attempts: 1,
        ack: () => acks.push(m.id),
        retry: () => retries.push(m.id),
      })),
    } as unknown as MessageBatch<unknown>,
    acks,
    retries,
  };
}

describe("handleEmailQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acks each message after successful send", async () => {
    mockSendEmail.mockResolvedValue(undefined);
    const { batch, acks } = makeBatch([
      { id: "1", body: { to: "a@x.ci", subject: "S", html: "H" } },
      { id: "2", body: { to: "b@x.ci", subject: "S", html: "H" } },
    ]);

    await handleEmailQueue(batch);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(acks).toEqual(["1", "2"]);
  });

  it("calls retry() on a message when sendEmail throws", async () => {
    mockSendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("resend down"));
    const { batch, acks, retries } = makeBatch([
      { id: "1", body: { to: "a@x.ci", subject: "S", html: "H" } },
      { id: "2", body: { to: "b@x.ci", subject: "S", html: "H" } },
    ]);

    await handleEmailQueue(batch);

    expect(acks).toEqual(["1"]);
    expect(retries).toEqual(["2"]);
  });
});
```

- [ ] **Step 2: Run the test, verify failure**

Run: `bun run test tests/lib/email/consumer.test.ts`
Expected: FAIL — stub does nothing, no acks recorded.

- [ ] **Step 3: Replace the stub with the real consumer**

Replace `lib/email/consumer.ts` contents:

```ts
import type { MessageBatch } from "@cloudflare/workers-types";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

function isEmailMessage(v: unknown): v is EmailMessage {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return (
    typeof x.to === "string" &&
    typeof x.subject === "string" &&
    typeof x.html === "string"
  );
}

export async function handleEmailQueue(
  batch: MessageBatch<unknown>
): Promise<void> {
  await Promise.allSettled(
    batch.messages.map(async (message) => {
      if (!isEmailMessage(message.body)) {
        // Poison message: ack immediately rather than loop until DLQ
        console.error(
          `[email-queue] invalid payload for message ${message.id}; acking to drop`
        );
        message.ack();
        return;
      }
      try {
        await sendEmail(message.body);
        message.ack();
      } catch (err) {
        console.error(
          `[email-queue] send failed for message ${message.id} (attempt ${message.attempts}):`,
          err
        );
        message.retry();
      }
    })
  );
}
```

- [ ] **Step 4: Run the test, verify pass**

Run: `bun run test tests/lib/email/consumer.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/email/consumer.ts tests/lib/email/consumer.test.ts
git commit -m "feat(email): implement queue consumer with per-message retry"
```

---

## Task 6: Configure `wrangler.jsonc` queues + binding types

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `worker-configuration.d.ts` (regenerated)

- [ ] **Step 1: Add queues block to `wrangler.jsonc`**

Inside the top-level object, after the `kv_namespaces` block, add:

```jsonc
"queues": {
  "producers": [
    {
      "binding": "EMAIL_QUEUE",
      "queue": "dbs-store-emails"
    }
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

Verify `main` is still `worker/index.ts` from Task 0.

- [ ] **Step 2: Regenerate the binding types**

Run: `bunx wrangler types`
Expected: `worker-configuration.d.ts` updated with `EMAIL_QUEUE: Queue` in `interface CloudflareEnv`.

- [ ] **Step 3: Run typecheck via build**

Run: `bun run build`
Expected: succeeds. The cast `(env as { EMAIL_QUEUE?: ... })` in `enqueue.ts` can now be tightened — leave it as-is to keep `enqueue.ts` independent of the generated type, OR remove the cast if the regenerated type is correct. Pick the latter.

If removing the cast: edit `lib/email/enqueue.ts` and replace
```ts
const queue = (env as { EMAIL_QUEUE?: Queue<EmailMessage> }).EMAIL_QUEUE;
```
with
```ts
const queue = env.EMAIL_QUEUE;
```

- [ ] **Step 4: Run all tests**

Run: `bun run test`
Expected: green.

- [ ] **Step 5: Run lint**

Run: `bun run lint`
Expected: no NEW errors (pre-existing errors in auth/app-bar are OK per CLAUDE.md).

- [ ] **Step 6: Commit**

```bash
git add wrangler.jsonc worker-configuration.d.ts lib/email/enqueue.ts
git commit -m "feat(infra): add EMAIL_QUEUE producer + consumer + DLQ wrangler config"
```

---

## Task 7: End-to-end worker build verification

**Files:** none modified (verification only)

- [ ] **Step 1: Build the full Workers bundle**

Run: `bun run build:worker`
Expected: succeeds. Look at the output bundle path printed by `opennextjs-cloudflare`.

- [ ] **Step 2: Inspect the generated worker entry includes both fetch and queue**

Run: `bun run -s wrangler deploy --dry-run --outdir=/tmp/dbs-deploy`
Expected: succeeds, outputs a worker bundle. The dry run validates that wrangler accepts the wrapped entry + queue config.

- [ ] **Step 3: Commit nothing (verification only)**

No changes.

---

## Task 8: Manual queue creation runbook + roadmap update

**Files:**
- Modify: `docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md`

- [ ] **Step 1: Create the queues in production (manual, one-time)**

Run (locally, against the production Cloudflare account):
```bash
bunx wrangler queues create dbs-store-emails
bunx wrangler queues create dbs-store-emails-dlq
```
Expected: both queues created. If they already exist, skip.

> **Note for the executor:** if the user has not authorised this manual step yet, **stop** and ask before running. This action is not reversible without confirmation and touches shared infrastructure.

- [ ] **Step 2: Update the roadmap**

Edit `docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md`:

In the Phase 5 section, change `**Statut : A faire**` to `**Statut : DONE**` and replace the scope/checkpoint blocks with:

```markdown
**Scope (révisé) :**
- Cloudflare Queue pour l'envoi d'emails (OTP auth, futurs emails) en asynchrone
- Helper générique `enqueueEmail` réutilisable (Phase 7+)
- Dead Letter Queue pour les échecs définitifs
- Fallback synchrone en dev local
- **Hors scope** : image processing (reporté — pas de besoin concret, Workers sans `sharp` natif)

**Checkpoint :**
- [x] Queues créées en prod (`dbs-store-emails`, `dbs-store-emails-dlq`)
- [x] Producer + consumer + DLQ configurés dans `wrangler.jsonc`
- [x] `sendOtpEmail` rétrocompatible passe par la queue
- [x] Tests passent, CI verte, deploy prod OK
```

In the summary table at the bottom, change Phase 5 row to `**Done**`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-04-02-prd-v1-roadmap.md
git commit -m "docs: mark Phase 5 (queue emails) as done, clarify image scope removal"
```

---

## Task 9: Open the PR

**Files:** none

- [ ] **Step 1: Push the branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: Create the PR**

```bash
gh pr create --title "feat(phase5): Cloudflare Queue for async emails" --body "$(cat <<'EOF'
## Summary
- Adds a Cloudflare Queue (`dbs-store-emails`) producer + consumer for transactional emails, with DLQ.
- Refactors `lib/email.ts` into a small `lib/email/` module (`types`, `send`, `templates`, `enqueue`, `consumer`).
- Wraps the OpenNext-generated worker (`worker/index.ts`) to add a `queue()` handler alongside `fetch()`.
- Preserves `sendOtpEmail` so Better Auth requires no changes; sync fallback in Node dev.
- Image-processing scope removed from Phase 5 (out of scope, see spec).

## Test plan
- [ ] `bun run test` green
- [ ] `bun run lint` no new errors
- [ ] `bun run build:worker` succeeds
- [ ] CI green
- [ ] Manual: trigger an OTP in prod and verify it transits via the Cloudflare Queue dashboard
EOF
)"
```

- [ ] **Step 3: Wait for CI + review**

Once CI is green and review passes, squash-merge. Deploy workflow takes over.

---

## Self-review checklist (executor: skim before starting)

- Spec coverage: every section of `2026-04-07-phase5-cloudflare-queue-emails-design.md` maps to a task above (types→T1, send→T1, templates→T2, enqueue→T3, shim→T4, consumer→T5, wrangler→T6, DLQ→T6, build verif→T7, ops/runbook→T8).
- No TODO/TBD/placeholder steps.
- Type names consistent: `EmailMessage`, `OtpType`, `handleEmailQueue`, `EMAIL_QUEUE`, `enqueueEmail`, `buildOtpEmail`, `sendEmail` — used identically across all tasks.
- Risk gate: Task 0 spike must succeed before T1+. If it fails, STOP and re-plan.
