---
name: create-migration
description: Generate a new D1 migration SQL file with sequential numbering and Drizzle schema sync
disable-model-invocation: true
---

# Create D1 Migration

Generate a new Cloudflare D1 migration SQL file for this project.

## Steps

1. List existing migrations to determine the next sequence number:
   ```bash
   ls migrations/
   ```

2. Determine the next migration number (format: `NNNN_description.sql`). Increment the highest existing number by 1.

3. Ask the user what the migration should do if not already specified.

4. Generate the migration SQL file at `migrations/NNNN_description.sql` with:
   - A comment header describing the migration
   - The SQL statements (CREATE TABLE, ALTER TABLE, CREATE INDEX, etc.)
   - D1-compatible SQLite syntax only (no PostgreSQL-specific features)

5. If the migration adds or modifies tables, also update the Drizzle schema in `lib/db/schema.ts` to match.

6. Run `bun run db:generate` to verify Drizzle picks up the changes.

7. Print next steps:
   - `bun run db:migrate:local` to apply locally
   - `bun run db:migrate:remote` to apply in production

## Conventions

- Use snake_case for table and column names
- Always include `created_at` and `updated_at` timestamps on new tables
- Use INTEGER for booleans (0/1) — SQLite convention
- Foreign keys must reference existing tables
- Add indexes for columns used in WHERE/JOIN clauses
