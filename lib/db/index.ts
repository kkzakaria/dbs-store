// lib/db/index.ts
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

let devDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (process.env.NODE_ENV === "development" && !process.env.USE_D1) {
    if (!devDb) {
      const Database = (await import("better-sqlite3")).default;
      const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
      const sqliteDb = new Database("./dev.db");
      sqliteDb.pragma("journal_mode = WAL");
      const db = drizzleSqlite(sqliteDb, { schema });
      // Polyfill D1's batch() for dev: runs statements sequentially.
      // WARNING: Unlike D1's batch(), this is NOT atomic — if a statement
      // in the middle fails, earlier statements are already committed.
      // Test atomic scenarios against D1 via `bun run preview`.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).batch = async (queries: any[]) => {
        const results = [];
        for (const q of queries) results.push(await q);
        return results;
      };
      devDb = db as unknown as Db;
    }
    return devDb;
  }
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext<CloudflareEnv>();
  return drizzle(env.DB, { schema });
}
