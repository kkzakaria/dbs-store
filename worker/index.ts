// Custom Cloudflare Worker entry that wraps the OpenNext-generated worker
// to add a `queue()` handler for the EMAIL_QUEUE consumer.
//
// The OpenNext build produces `.open-next/worker.js` which default-exports
// `{ fetch }`. We re-export it and add `queue` alongside.

import type { MessageBatch } from "@cloudflare/workers-types";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - generated file, no types; may not exist before first build
import openNextWorker from "../.open-next/worker.js";
import { handleEmailQueue } from "../lib/email/consumer";

export default {
  fetch: openNextWorker.fetch,
  async queue(batch: MessageBatch<unknown>, env: CloudflareEnv): Promise<void> {
    await handleEmailQueue(batch, env);
  },
};

// Re-export the DOQueueHandler / DOShardedTagCache durable objects that
// OpenNext expects to be exported from the worker entry.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - generated file, no types; may not exist before first build
export * from "../.open-next/worker.js";
