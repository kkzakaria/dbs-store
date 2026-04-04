// scripts/migrate-dev.ts
// Apply all D1 migrations to the local dev.db SQLite file
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const db = new Database("./dev.db");
db.pragma("journal_mode = WAL");

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  console.log(`Applying ${file}...`);
  db.exec(sql);
}

console.log(`✓ ${files.length} migration(s) applied to dev.db`);
db.close();
