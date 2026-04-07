// Type declaration for the OpenNext-generated worker bundle.
// The actual file (`.open-next/worker.js`) is created by `bun run build:worker`
// and does not exist before the first build.

declare module "../.open-next/worker.js" {
  type CfFetchHandler = (
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext
  ) => Promise<Response> | Response;

  const worker: { fetch: CfFetchHandler };
  export default worker;

  // Durable Object classes that OpenNext expects to be re-exported from the
  // worker entry. Typed as `unknown` because we only forward them to the
  // runtime — we never instantiate them ourselves.
  export const DOQueueHandler: unknown;
  export const DOShardedTagCache: unknown;
  export const BucketCachePurge: unknown;
}
