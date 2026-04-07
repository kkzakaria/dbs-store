import type { MessageBatch } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { failed_emails } from "@/lib/db/schema";

// Retention: keep failed-email records for 90 days. After that they can be
// pruned by a cleanup job (not in scope for this PR).
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function extractDomain(to: unknown): string {
  if (typeof to !== "string") return "invalid";
  const at = to.indexOf("@");
  if (at < 0) return "invalid";
  return to.slice(at + 1) || "invalid";
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function safePreview(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 200);
  } catch {
    return "[unserializable payload]";
  }
}

export async function handleEmailDlq(
  batch: MessageBatch<unknown>,
  env: CloudflareEnv
): Promise<void> {
  const db = drizzle(env.DB);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RETENTION_MS);

  await Promise.allSettled(
    batch.messages.map(async (message) => {
      const body = (message.body ?? {}) as Record<string, unknown>;
      const isValidShape =
        typeof body.to === "string" &&
        typeof body.subject === "string" &&
        typeof body.html === "string";

      const errorMarker = isValidShape
        ? safeString(body._error, null as unknown as string) || null
        : `INVALID_PAYLOAD: ${safePreview(body)}`;

      try {
        await db.insert(failed_emails).values({
          id: message.id,
          to_domain: extractDomain(body.to),
          subject: safeString(body.subject, "(unknown)"),
          attempts: message.attempts,
          error: errorMarker,
          failed_at: now,
          expires_at: expiresAt,
        });
        console.error(
          `[email-dlq] message ${message.id} archived (domain=${extractDomain(body.to)}, valid=${isValidShape})`
        );
        message.ack();
      } catch (err) {
        // Cloudflare Queues is at-least-once — if the same DLQ message is
        // redelivered after we already archived it, the UNIQUE constraint on
        // failed_emails.id will fire. Treat that as an idempotent success.
        const errorText = err instanceof Error ? err.message : String(err);
        if (errorText.includes("UNIQUE constraint failed: failed_emails.id")) {
          console.error(
            `[email-dlq] message ${message.id} already archived; acking duplicate`
          );
          message.ack();
          return;
        }
        console.error(
          `[email-dlq] failed to archive message ${message.id}:`,
          err
        );
        message.retry();
      }
    })
  );
}
