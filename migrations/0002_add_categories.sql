CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "image" TEXT,
  "parent_id" TEXT REFERENCES "categories"("id"),
  "order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_unique" ON "categories" ("slug");
