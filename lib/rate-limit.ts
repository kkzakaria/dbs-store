import { getKv } from "@/lib/kv";

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const kv = await getKv();
  if (!kv) return true; // No KV available (dev mode) — allow

  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= maxAttempts) return false;

  await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return true;
}
