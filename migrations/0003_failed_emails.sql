CREATE TABLE IF NOT EXISTS "failed_emails" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "to_domain" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "error" TEXT,
  "failed_at" INTEGER NOT NULL,
  "expires_at" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_failed_emails_failed_at"
  ON "failed_emails" ("failed_at");

CREATE INDEX IF NOT EXISTS "idx_failed_emails_expires_at"
  ON "failed_emails" ("expires_at");
