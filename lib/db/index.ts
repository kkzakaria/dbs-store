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
      // Polyfill D1's batch() for dev: wraps statements in a SQLite transaction.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).batch = async (queries: any[]) => {
        sqliteDb.exec("BEGIN");
        try {
          const results = [];
          for (const q of queries) results.push(await q);
          sqliteDb.exec("COMMIT");
          return results;
        } catch (error) {
          sqliteDb.exec("ROLLBACK");
          throw error;
        }
      };
      devDb = db as unknown as Db;
    }
    return devDb;
  }
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext<CloudflareEnv>();
  return drizzle(env.DB, { schema });
}
