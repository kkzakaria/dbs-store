"use server";

import { randomUUID } from "crypto";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { getSubcategories, getCategoryById } from "@/lib/data/categories";
import { CATEGORY_ICONS, type CategoryIcon } from "@/lib/data/category-icons";

export type CategoryFormData = {
  name: string;
  slug: string;
  icon: CategoryIcon;
  image: string | null;
  parent_id: string | null;
  order: number;
};

function validate(data: CategoryFormData): string | null {
  if (!data.name?.trim()) return "Le nom est requis";
  if (!data.slug?.trim()) return "Le slug est requis";
  if (!/^[a-z0-9-]+$/.test(data.slug.trim()))
    return "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets";
  if (!data.icon?.trim()) return "L'icône est requise";
  if (!CATEGORY_ICONS.includes(data.icon))
    return "Icône invalide";
  return null;
}

export async function createCategory(
  data: CategoryFormData
): Promise<{ error?: string }> {
  await requireOrgMember();
  const error = validate(data);
  if (error) return { error };

  const db = await getDb();

  if (data.parent_id) {
    const parent = await getCategoryById(db, data.parent_id);
    if (!parent) return { error: "La catégorie parente n'existe pas" };
  }

  try {
    await db.insert(categories).values({
      id: randomUUID(),
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
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE constraint")) {
      return { error: "Ce slug est déjà utilisé par une autre catégorie" };
    }
    return { error: "Erreur lors de la création" };
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

  if (data.parent_id) {
    const parent = await getCategoryById(db, data.parent_id);
    if (!parent) return { error: "La catégorie parente n'existe pas" };
  }

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
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE constraint")) {
      return { error: "Ce slug est déjà utilisé par une autre catégorie" };
    }
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

  try {
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

    await db.delete(categories).where(eq(categories.id, id));
  } catch (err) {
    console.error("[deleteCategory]", err);
    return { error: "Erreur lors de la suppression" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}
