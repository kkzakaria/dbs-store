import { Resend } from "resend";

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
                  ${otp}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResendClient = { emails: { send: (...args: any[]) => Promise<any> } };

function createResendClient(): ResendClient {
  try {
    return new Resend(process.env.RESEND_API_KEY);
  } catch (e: unknown) {
    if (
      e instanceof TypeError &&
      e.message.includes("is not a constructor")
    ) {
      // Fallback for test environments where the mock uses an arrow function
      return (Resend as unknown as (key?: string) => ResendClient)(
        process.env.RESEND_API_KEY
      );
    }
    throw e;
  }
}

const resend = createResendClient();

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
