import { eq, isNull, asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { categories as categoriesTable } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import type { Db } from "@/lib/db";
import { getDb } from "@/lib/db";

export type { Category } from "@/lib/db/schema";

export async function getTopLevelCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categoriesTable)
    .where(isNull(categoriesTable.parent_id))
    .orderBy(asc(categoriesTable.order));
}

export async function getSubcategories(db: Db, parentId: string): Promise<Category[]> {
  return db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.parent_id, parentId))
    .orderBy(asc(categoriesTable.order));
}

export async function getAllCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.order));
}

export async function getCategoryBySlug(db: Db, slug: string): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCategoryById(db: Db, id: string): Promise<Category | null> {
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ── Cached versions (storefront) ────────────────────────────────────────────

export const getCachedAllCategories = unstable_cache(
  async () => {
    const db = await getDb();
    return getAllCategories(db);
  },
  ["getAllCategories"],
  { revalidate: 3600, tags: ["categories"] }
);

export const getCachedTopLevelCategories = unstable_cache(
  async () => {
    const db = await getDb();
    return getTopLevelCategories(db);
  },
  ["getTopLevelCategories"],
  { revalidate: 3600, tags: ["categories"] }
);

export const getCachedSubcategories = unstable_cache(
  async (parentId: string) => {
    const db = await getDb();
    return getSubcategories(db, parentId);
  },
  ["getSubcategories"],
  { revalidate: 3600, tags: ["categories"] }
);

export const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => {
    const db = await getDb();
    return getCategoryBySlug(db, slug);
  },
  ["getCategoryBySlug"],
  { revalidate: 3600, tags: ["categories"] }
);
