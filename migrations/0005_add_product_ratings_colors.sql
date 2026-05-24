-- Product card redesign (Soft Editorial): note moyenne, nombre d'avis, variantes de coloris
ALTER TABLE "products" ADD COLUMN "rating" REAL;
ALTER TABLE "products" ADD COLUMN "reviews" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "products" ADD COLUMN "colors" TEXT DEFAULT '[]' NOT NULL;
