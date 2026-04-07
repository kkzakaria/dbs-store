import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

type QueueLike<T> = { send(message: T): Promise<void> };

export async function enqueueEmail(msg: EmailMessage): Promise<void> {
  try {
    const { env } = await getCloudflareContext<CloudflareEnv>();
    const queue = (env as { EMAIL_QUEUE?: QueueLike<EmailMessage> })
      .EMAIL_QUEUE;
    if (queue) {
      await queue.send(msg);
      return;
    }
  } catch {
    // No Cloudflare context (e.g. Node dev) — fall through to sync send
  }
  await sendEmail(msg);
}
