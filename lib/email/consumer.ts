import type { MessageBatch } from "@cloudflare/workers-types";

export async function handleEmailQueue(
  _batch: MessageBatch<unknown>,
  _env: CloudflareEnv
): Promise<void> {
  // Stubbed for spike — real implementation in a later task
}
