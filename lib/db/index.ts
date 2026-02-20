// lib/db/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Pour D1 en production (Cloudflare Pages via @cloudflare/next-on-pages) :
//   import { getRequestContext } from '@cloudflare/next-on-pages';
//   import { drizzle } from 'drizzle-orm/d1';
//   const db = drizzle(getRequestContext().env.DB, { schema });
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[db] DATABASE_URL non défini — utilisation de ./dev.db (dev uniquement)");
  }
  try {
    return drizzle(new Database(url ?? "./dev.db"), { schema });
  } catch (err) {
    console.error(`[db] Impossible d'ouvrir la base SQLite "${url ?? "./dev.db"}":`, err);
    throw err;
  }
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb(): ReturnType<typeof createDb> {
  if (!_db) _db = createDb();
  return _db;
}

export type Db = ReturnType<typeof getDb>;
