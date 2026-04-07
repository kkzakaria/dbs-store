import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

export async function enqueueEmail(msg: EmailMessage): Promise<void> {
  let env: CloudflareEnv | undefined;
  try {
    ({ env } = await getCloudflareContext<CloudflareEnv>());
  } catch {
    // No Cloudflare context (e.g. Node dev) — fall through to sync send
  }

  if (env?.EMAIL_QUEUE) {
    try {
      await env.EMAIL_QUEUE.send(msg);
      return;
    } catch (err) {
      console.error(
        "[email-queue] enqueue failed, falling back to sync send:",
        err
      );
      // Intentional fall-through: degraded mode is better than dropping the email
    }
  }

  await sendEmail(msg);
}
