import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "./send";
import type { EmailMessage } from "./types";

export async function enqueueEmail(msg: EmailMessage): Promise<void> {
  let env: CloudflareEnv | undefined;
  try {
    ({ env } = await getCloudflareContext<CloudflareEnv>());
  } catch {
    // No Cloudflare context (e.g. Node dev) — fall through to sync send
    await sendEmail(msg);
    return;
  }

  if (!env?.EMAIL_QUEUE) {
    // Workers context but no binding — sync send is the only option
    await sendEmail(msg);
    return;
  }

  // Let queue.send errors propagate. Cloudflare Queues is at-least-once;
  // a thrown error does not guarantee the message was not enqueued, so a
  // sync fallback here would risk duplicate emails. The caller (Better Auth)
  // will surface the failure to the user, who can retry.
  await env.EMAIL_QUEUE.send(msg);
}
