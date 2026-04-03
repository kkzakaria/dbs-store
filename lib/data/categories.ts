import { eq, isNull, asc } from "drizzle-orm";
import { categories as categoriesTable } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

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
