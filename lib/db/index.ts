// lib/db/index.ts
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let devDb: any = null;

export async function getDb(): Promise<Db> {
  if (process.env.NODE_ENV === "development" && !process.env.USE_D1) {
    if (!devDb) {
      const Database = (await import("better-sqlite3")).default;
      const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
      devDb = drizzleSqlite(new Database("./dev.db"), { schema });
    }
    return devDb as Db;
  }
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext<CloudflareEnv>();
  return drizzle(env.DB, { schema });
}
