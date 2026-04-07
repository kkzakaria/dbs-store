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
