"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { validateProductData } from "@/lib/actions/product-validation";
export type { ProductFormData, ValidationResult } from "@/lib/actions/product-validation";

export async function createProduct(data: ProductFormData): Promise<{ error?: string }> {
  await requireOrgMember();

  const validation = validateProductData(data);
  if (!validation.success) return { error: validation.error };

  const db = getDb();
  const id = randomUUID();
  const now = new Date();

  try {
    await db.insert(products).values({
      id,
      name: data.name.trim(),
      slug: data.slug.trim(),
      category_id: data.category_id,
      subcategory_id: data.subcategory_id ?? null,
      price: data.price,
      old_price: data.old_price ?? null,
      brand: data.brand.trim(),
      stock: data.stock,
      badge: data.badge ?? null,
      is_active: data.is_active ?? true,
      description: data.description.trim(),
      images: JSON.stringify(data.images),
      specs: JSON.stringify(data.specs),
      created_at: now,
    });
  } catch (err) {
    console.error("[createProduct]", err);
    return { error: "Erreur lors de la création du produit" };
  }

  revalidatePath("/admin/produits");
  revalidatePath("/");
  redirect("/admin/produits");
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<{ error?: string }> {
  await requireOrgMember();

  const validation = validateProductData(data);
  if (!validation.success) return { error: validation.error };

  const db = getDb();

  try {
    await db
      .update(products)
      .set({
        name: data.name.trim(),
        slug: data.slug.trim(),
        category_id: data.category_id,
        subcategory_id: data.subcategory_id ?? null,
        price: data.price,
        old_price: data.old_price ?? null,
        brand: data.brand.trim(),
        stock: data.stock,
        badge: data.badge ?? null,
        is_active: data.is_active ?? true,
        description: data.description.trim(),
        images: JSON.stringify(data.images),
        specs: JSON.stringify(data.specs),
      })
      .where(eq(products.id, id));
  } catch (err) {
    console.error("[updateProduct]", err);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/admin/produits");
  revalidatePath(`/produits/${data.slug}`);
  revalidatePath("/");
  redirect("/admin/produits");
}

export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = getDb();
  try {
    await db.update(products).set({ is_active: isActive }).where(eq(products.id, id));
    revalidatePath("/admin/produits");
    return {};
  } catch (err) {
    console.error("[toggleProductActive]", err);
    return { error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireOrgMember();
  const db = getDb();
  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/admin/produits");
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("[deleteProduct]", err);
    return { error: "Erreur lors de la suppression" };
  }
}
