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

// Redact an email address for logging: keep the domain + first char of local
// part. e.g. "alice@example.com" -> "a***@example.com". Avoids storing PII
// verbatim in logs while keeping enough signal to triage incidents.
function redactEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

export async function handleEmailQueue(
  batch: MessageBatch<unknown>
): Promise<void> {
  await Promise.allSettled(
    batch.messages.map(async (message) => {
      if (!isEmailMessage(message.body)) {
        // Poison message: ack immediately rather than loop until DLQ.
        console.error(
          `[email-queue] invalid payload for message ${message.id}; acking to drop`
        );
        message.ack();
        return;
      }

      const body = message.body;
      try {
        await sendEmail(body);
        message.ack();
      } catch (err) {
        const isFinalAttempt = message.attempts >= 3;
        const level = isFinalAttempt ? "CRITICAL" : "WARN";
        console.error(
          `[email-queue ${level}] send failed`,
          JSON.stringify({
            messageId: message.id,
            attempts: message.attempts,
            toRedacted: redactEmail(body.to),
            error: err instanceof Error ? err.message : String(err),
            isFinalAttempt,
          })
        );
        message.retry();
      }
    })
  );
}
