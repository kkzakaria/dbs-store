CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "is_active" INTEGER NOT NULL DEFAULT 1,
  "created_at" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_newsletter_subscribers_email"
  ON "newsletter_subscribers" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_newsletter_subscribers_token"
  ON "newsletter_subscribers" ("token");
