// Custom Cloudflare Worker entry that wraps the OpenNext-generated worker
// to add a `queue()` handler for the EMAIL_QUEUE consumer.
//
// Integration coverage: see `bun run preview` + Cloudflare Queues dashboard.
// Unit tests for the queue logic live in `tests/lib/email/`.

import type { MessageBatch } from "@cloudflare/workers-types";
// The OpenNext-generated worker file does not exist before `bun run build:worker`,
// so TypeScript cannot resolve it during `next build`. Suppressing here is the
// pragmatic option; explicit named imports below still ensure the bundler will
// fail loudly at build time if OpenNext renames a symbol.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - generated file, no types; missing pre-build
import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - generated file, no types
} from "../.open-next/worker.js";
import { handleEmailQueue } from "../lib/email/consumer";
import { handleEmailDlq } from "../lib/email/dlq-consumer";

// Re-export Durable Object classes that OpenNext expects to be exported
// from the worker entry. Explicit re-exports (rather than `export *`)
// ensure the build fails loudly if OpenNext renames a symbol.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };

export default {
  fetch: openNextWorker.fetch,
  async queue(
    batch: MessageBatch<unknown>,
    env: CloudflareEnv
  ): Promise<void> {
    if (batch.queue === "dbs-store-emails-dlq") {
      await handleEmailDlq(batch, env);
      return;
    }
    await handleEmailQueue(batch, env);
  },
};
