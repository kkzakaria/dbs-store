// scripts/migrate-dev.ts
// Apply D1 migrations incrementally to the local dev.db SQLite file
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const db = new Database("./dev.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS "__dev_migrations" (
    "name" TEXT PRIMARY KEY NOT NULL,
    "applied_at" INTEGER NOT NULL
  )
`);

const applied = new Set(
  db.prepare('SELECT name FROM "__dev_migrations"').all().map((row) => (row as { name: string }).name)
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  console.log(`Applying ${file}...`);
  db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO "__dev_migrations" (name, applied_at) VALUES (?, ?)').run(file, Date.now());
  })();
  count++;
}

if (count === 0) {
  console.log("✓ No new migrations to apply");
} else {
  console.log(`✓ ${count} migration(s) applied to dev.db`);
}
db.close();
