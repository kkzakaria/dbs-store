-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL,
  "image" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "activeOrganizationId" TEXT
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TEXT,
  "refreshTokenExpiresAt" TEXT,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logo" TEXT,
  "createdAt" TEXT NOT NULL,
  "metadata" TEXT
);

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "inviterId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

-- Better Auth indexes
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member" ("organizationId");
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member" ("userId");
CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation" ("organizationId");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" ("email");

-- App tables (from drizzle migrations)
CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "subcategory_id" TEXT,
  "price" INTEGER NOT NULL,
  "old_price" INTEGER,
  "brand" TEXT NOT NULL,
  "images" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "specs" TEXT NOT NULL,
  "stock" INTEGER DEFAULT 0 NOT NULL,
  "badge" TEXT,
  "is_active" INTEGER DEFAULT 1 NOT NULL,
  "created_at" INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_unique" ON "products" ("slug");

CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending' NOT NULL,
  "payment_method" TEXT NOT NULL,
  "payment_status" TEXT DEFAULT 'pending' NOT NULL,
  "shipping_name" TEXT NOT NULL,
  "shipping_phone" TEXT NOT NULL,
  "shipping_city" TEXT NOT NULL,
  "shipping_address" TEXT NOT NULL,
  "shipping_notes" TEXT,
  "subtotal" INTEGER NOT NULL,
  "shipping_fee" INTEGER DEFAULT 0 NOT NULL,
  "total" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "order_id" TEXT NOT NULL REFERENCES "orders"("id"),
  "product_id" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "product_slug" TEXT NOT NULL,
  "product_image" TEXT NOT NULL,
  "unit_price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "line_total" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "hero_slides" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "badge" TEXT,
  "image_url" TEXT NOT NULL,
  "text_align" TEXT DEFAULT 'center' NOT NULL,
  "overlay_color" TEXT DEFAULT '#000000' NOT NULL,
  "overlay_opacity" INTEGER DEFAULT 40 NOT NULL,
  "cta_primary_label" TEXT,
  "cta_primary_href" TEXT,
  "cta_secondary_label" TEXT,
  "cta_secondary_href" TEXT,
  "is_active" INTEGER DEFAULT 1 NOT NULL,
  "sort_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);
