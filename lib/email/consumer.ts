import type { MessageBatch } from "@cloudflare/workers-types";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

export async function handleEmailQueue(
  batch: MessageBatch<unknown>,
  _env: CloudflareEnv
): Promise<void> {
  await Promise.allSettled(
    batch.messages.map(async (message) => {
      const body = message.body as EmailMessage;
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
            to: body?.to,
            subject: body?.subject,
            error: err instanceof Error ? err.message : String(err),
            isFinalAttempt,
          })
        );
        message.retry();
      }
    })
  );
}
