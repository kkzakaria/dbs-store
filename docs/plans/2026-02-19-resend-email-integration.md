# Resend Email Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `console.log` stub in `sendVerificationOTP` with a real Resend email delivery using an HTML template branded for DBS Store.

**Architecture:** A new `lib/email.ts` module exports `sendOtpEmail(to, otp, type)` which calls the Resend SDK. `lib/auth.ts` imports and calls it from `sendVerificationOTP`. In development without a `RESEND_API_KEY`, the function falls back to `console.log`.

**Tech Stack:** Resend SDK (`resend`), Node.js inline HTML string template, Vitest + vi.mock for tests.

---

### Task 1: Install the Resend package and add env vars

**Files:**
- Modify: `.env.example`
- Modify: `.env.local` (add keys, don't commit)

**Step 1: Install resend**

```bash
bun add resend
```

Expected output: `resend` added to `package.json` dependencies.

**Step 2: Add env vars to `.env.example`**

Open `.env.example` and append after the `# Database` section:

```
# Email — Resend
RESEND_API_KEY=            # Clé API depuis resend.com/api-keys
RESEND_FROM_EMAIL=DBS Store <noreply@dbs-store.ci>
```

**Step 3: Add env vars to `.env.local`**

Add your real Resend API key (from https://resend.com/api-keys) to `.env.local`:

```
RESEND_API_KEY=re_your_actual_key_here
RESEND_FROM_EMAIL=DBS Store <noreply@dbs-store.ci>
```

**Step 4: Commit only `.env.example`**

```bash
git add .env.example package.json bun.lockb
git commit -m "chore: add resend dependency and env vars"
```

---

### Task 2: Create `lib/email.ts` with `sendOtpEmail` — TDD

**Files:**
- Create: `lib/email.ts`
- Create: `tests/lib/email.test.ts`

**Step 1: Write the failing tests**

Create `tests/lib/email.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Must import AFTER mock is registered
const { sendOtpEmail } = await import("@/lib/email");

describe("sendOtpEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  it("calls resend.emails.send with the recipient email", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "forget-password");
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@exemple.com");
  });

  it("uses the correct subject for forget-password type", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "forget-password");
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toMatch(/réinitialisation/i);
  });

  it("includes the OTP code in the html body", async () => {
    await sendOtpEmail("user@exemple.com", "654321", "forget-password");
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("654321");
  });

  it("throws if resend returns an error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });
    await expect(sendOtpEmail("user@exemple.com", "123456", "forget-password"))
      .rejects.toThrow("Invalid API key");
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
bun run test tests/lib/email.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/email'`

**Step 3: Create `lib/email.ts`**

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "DBS Store <noreply@dbs-store.ci>";

const SUBJECTS: Record<string, string> = {
  "forget-password": "Réinitialisation de votre mot de passe — DBS Store",
};

function buildHtml(otp: string, type: string): string {
  const title =
    type === "forget-password"
      ? "Réinitialisation de mot de passe"
      : "Vérification de votre compte";

  const digits = otp.split("").join("  ");

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

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                ⚡ DBS Store
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">${title}</h1>
              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6;">
                Utilisez le code ci-dessous pour continuer. Il est valable <strong>5 minutes</strong>.
              </p>

              <!-- OTP block -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f172a;font-family:'Courier New',monospace;">
                  ${digits}
                </span>
              </div>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Si vous n'avez pas demandé ce code, ignorez cet email. Votre compte reste sécurisé.
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

export async function sendOtpEmail(
  to: string,
  otp: string,
  type: string
): Promise<void> {
  const subject = SUBJECTS[type] ?? "Votre code de vérification — DBS Store";
  const html = buildHtml(otp, type);

  const { error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    throw new Error(error.message);
  }
}
```

**Step 4: Run tests to confirm they pass**

```bash
bun run test tests/lib/email.test.ts
```

Expected: 4 tests passing.

**Step 5: Commit**

```bash
git add lib/email.ts tests/lib/email.test.ts
git commit -m "feat: add sendOtpEmail with Resend and HTML template"
```

---

### Task 3: Wire `sendOtpEmail` into `lib/auth.ts`

**Files:**
- Modify: `lib/auth.ts:58-65`

**Step 1: Update `sendVerificationOTP` in `lib/auth.ts`**

Replace the current `sendVerificationOTP` callback (lines 59-64) with:

```typescript
async sendVerificationOTP({ email, otp, type }) {
  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
    console.log(`[emailOTP DEV] type=${type} email=${email} otp=${otp}`);
    return;
  }
  await sendOtpEmail(email, otp, type);
},
```

And add the import at the top of `lib/auth.ts` (after existing imports):

```typescript
import { sendOtpEmail } from "@/lib/email";
```

**Step 2: Run the full test suite**

```bash
bun run test
```

Expected: all tests passing (the auth.ts unit tests don't test `sendVerificationOTP` internals, so no new failures).

**Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: wire sendOtpEmail into Better Auth sendVerificationOTP"
```

---

### Task 4: Manual smoke test (dev)

**No code changes — just verify the dev fallback works.**

**Step 1: Start the dev server**

```bash
bun run dev
```

**Step 2: Trigger an OTP**

Navigate to `http://localhost:33000/mot-de-passe-oublie`, enter any email, submit.

**Step 3: Check the terminal**

Expected output in the server terminal:
```
[emailOTP DEV] type=forget-password email=<your-email> otp=<6-digit-code>
```

If you see this, the fallback is working. To test real email delivery, set `RESEND_API_KEY` in `.env.local` and retry.

---

## Notes

- The Resend free plan allows 3,000 emails/month and up to 100/day.
- To send from `noreply@dbs-store.ci`, you must verify the `dbs-store.ci` domain in the Resend dashboard (DNS TXT records). During development, Resend allows sending to your own verified email address without domain verification.
- The `RESEND_FROM_EMAIL` env var lets you override the sender without changing code (useful for staging vs production).
