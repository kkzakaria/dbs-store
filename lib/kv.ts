import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { KVNamespace } from "@cloudflare/workers-types";

export async function getKv(): Promise<KVNamespace | null> {
  if (process.env.NODE_ENV === "development" && !process.env.USE_D1) {
    return null;
  }
  try {
    const { env } = await getCloudflareContext<CloudflareEnv>();
    return env.KV_RATE_LIMIT ?? null;
  } catch {
    return null;
  }
}
