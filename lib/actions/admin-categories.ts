"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { getSubcategories } from "@/lib/data/categories";

export type CategoryFormData = {
  name: string;
  slug: string;
  icon: string;
  image: string | null;
  parent_id: string | null;
  order: number;
};

function validate(data: CategoryFormData): string | null {
  if (!data.name?.trim()) return "Le nom est requis";
  if (!data.slug?.trim()) return "Le slug est requis";
  if (!data.icon?.trim()) return "L'icône est requise";
  return null;
}

export async function createCategory(
  data: CategoryFormData
): Promise<{ error?: string }> {
  await requireOrgMember();
  const error = validate(data);
  if (error) return { error };

  const db = await getDb();

  try {
    await db.insert(categories).values({
      id: data.slug.trim(),
      slug: data.slug.trim(),
      name: data.name.trim(),
      icon: data.icon.trim(),
      image: data.image || null,
      parent_id: data.parent_id || null,
      order: data.order,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("[createCategory]", err);
    return { error: "Erreur lors de la création (slug déjà utilisé ?)" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}

export async function updateCategory(
  id: string,
  data: CategoryFormData
): Promise<{ error?: string }> {
  await requireOrgMember();
  const error = validate(data);
  if (error) return { error };

  if (data.parent_id === id) {
    return { error: "Une catégorie ne peut pas être son propre parent" };
  }

  const db = await getDb();

  try {
    await db
      .update(categories)
      .set({
        slug: data.slug.trim(),
        name: data.name.trim(),
        icon: data.icon.trim(),
        image: data.image || null,
        parent_id: data.parent_id || null,
        order: data.order,
      })
      .where(eq(categories.id, id));
  } catch (err) {
    console.error("[updateCategory]", err);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}

export async function deleteCategory(
  id: string
): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = await getDb();

  // Check for children
  const children = await getSubcategories(db, id);
  if (children.length > 0) {
    return { error: "Supprimez d'abord les sous-catégories" };
  }

  // Check for products using this category
  const productUsingCategory = await db
    .select()
    .from(products)
    .where(or(eq(products.category_id, id), eq(products.subcategory_id, id)))
    .limit(1);

  if (productUsingCategory.length > 0) {
    return { error: "Des produits utilisent cette catégorie" };
  }

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (err) {
    console.error("[deleteCategory]", err);
    return { error: "Erreur lors de la suppression" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}
