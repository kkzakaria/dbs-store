// lib/db/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Pour D1 en production : remplacer par drizzle-orm/d1 avec le binding
// getRequestContext().env.DB depuis @cloudflare/next-on-pages.
export function getDb() {
  const sqlite = new Database(process.env.DATABASE_URL ?? "./dev.db");
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof getDb>;
