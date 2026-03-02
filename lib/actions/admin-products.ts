"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { products } from "@/lib/db/schema";
import type { ProductBadge } from "@/lib/db/schema";

export type ProductFormData = {
  name: string;
  slug: string;
  category_id: string;
  subcategory_id?: string;
  price: number;
  old_price?: number;
  brand: string;
  stock: number;
  badge?: ProductBadge | null;
  is_active?: boolean;
  description: string;
  images: string[];
  specs: Record<string, string>;
};

export type ValidationResult =
  | { success: true }
  | { success: false; error: string };

export function validateProductData(data: ProductFormData): ValidationResult {
  if (!data.name?.trim()) return { success: false, error: "Le nom est requis" };
  if (!data.slug?.trim()) return { success: false, error: "Le slug est requis" };
  if (!data.category_id) return { success: false, error: "La catégorie est requise" };
  if (!data.brand?.trim()) return { success: false, error: "La marque est requise" };
  if (!data.description?.trim()) return { success: false, error: "La description est requise" };
  if (data.price < 0) return { success: false, error: "Le prix ne peut pas être négatif" };
  if (data.stock < 0) return { success: false, error: "Le stock ne peut pas être négatif" };
  return { success: true };
}

async function requireOrgMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  if (!Array.isArray(orgs) || orgs.length === 0) throw new Error("UNAUTHORIZED");
  return session;
}

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

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  await requireOrgMember();
  const db = getDb();
  await db.update(products).set({ is_active: isActive }).where(eq(products.id, id));
  revalidatePath("/admin/produits");
}

export async function deleteProduct(id: string): Promise<void> {
  await requireOrgMember();
  const db = getDb();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/produits");
  revalidatePath("/");
}
