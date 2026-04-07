CREATE TABLE IF NOT EXISTS "failed_emails" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "error" TEXT,
  "failed_at" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_failed_emails_failed_at"
  ON "failed_emails" ("failed_at");
