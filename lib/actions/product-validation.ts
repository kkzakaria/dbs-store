export type ProductFormData = {
  name: string;
  slug: string;
  category_id: string;
  subcategory_id?: string;
  price: number;
  old_price?: number;
  brand: string;
  stock: number;
  badge?: import("@/lib/db/schema").ProductBadge | null;
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
