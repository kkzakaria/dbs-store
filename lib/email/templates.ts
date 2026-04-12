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

export type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildContactHtml(data: ContactFormData): string {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const subject = escapeHtml(data.subject);
  const message = escapeHtml(data.message);

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
                  <td style="padding:8px 0;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#64748b;vertical-align:top;">Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#64748b;vertical-align:top;">Sujet</td>
                  <td style="padding:8px 0;">${subject}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:16px 0 8px;font-weight:600;color:#64748b;">Message</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;white-space:pre-wrap;">${message}</td>
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
  const adminEmail = process.env.CONTACT_EMAIL ?? "contact@dbstore.ci";
  return {
    to: adminEmail,
    subject: `[Contact] ${escapeHtml(data.subject)}`,
    html: buildContactHtml(data),
  };
}
