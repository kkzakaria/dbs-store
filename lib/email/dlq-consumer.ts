import type { MessageBatch } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { failed_emails } from "@/lib/db/schema";
import type { EmailMessage } from "./types";

type DlqBody = EmailMessage & { _error?: string };

export async function handleEmailDlq(
  batch: MessageBatch<unknown>,
  env: CloudflareEnv
): Promise<void> {
  const db = drizzle(env.DB);

  await Promise.allSettled(
    batch.messages.map(async (message) => {
      const body = (message.body ?? {}) as DlqBody;
      try {
        await db.insert(failed_emails).values({
          id: message.id,
          to: body.to ?? "",
          subject: body.subject ?? "",
          html: body.html ?? "",
          attempts: message.attempts,
          error: body._error ?? null,
          failed_at: new Date(),
        });
        console.error(
          `[email-dlq] message ${message.id} archived to failed_emails (to=${body.to}, subject=${body.subject})`
        );
        message.ack();
      } catch (err) {
        // If the D1 write fails, retry — Cloudflare will eventually drop the
        // message after max_retries, which is acceptable for the DLQ.
        console.error(
          `[email-dlq] failed to archive message ${message.id}:`,
          err
        );
        message.retry();
      }
    })
  );
}
