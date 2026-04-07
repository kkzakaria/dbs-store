import type { MessageBatch } from "@cloudflare/workers-types";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

export async function handleEmailQueue(
  batch: MessageBatch<unknown>,
  _env: CloudflareEnv
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await sendEmail(message.body as EmailMessage);
      message.ack();
    } catch (err) {
      console.error(
        `[email-queue] send failed for message ${message.id} (attempt ${message.attempts}):`,
        err
      );
      message.retry();
    }
  }
}
