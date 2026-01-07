"use server";

import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/actions/auth";
import {
  adminProductFiltersSchema,
  adminProductSchema,
  adminProductWithVariantsSchema,
  generateSlug,
  isAdminRole,
} from "@/lib/validations/admin";
import { z } from "zod";

const action = createSafeActionClient();

// ===========================================
// Get Admin Products (with filters and pagination)
// ===========================================

export const getAdminProducts = action
  .schema(adminProductFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    const {
      page,
      limit,
      search,
      categoryId,
      isActive,
      isFeatured,
      sort,
      order,
    } = parsedInput;

    try {
      let query = supabaseAdmin
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, slug),
          images:product_images(id, url, alt, position, is_primary)
        `,
          { count: "exact" },
        );

      // Apply filters
      if (search && search.trim()) {
        query = query.or(
          `name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`,
        );
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      if (isFeatured !== undefined) {
        query = query.eq("is_featured", isFeatured);
      }

      // Sorting
      query = query.order(sort, { ascending: order === "asc" });

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: products, error, count } = await query;

      if (error) throw error;

      // Sort images by position within each product
      const productsWithSortedImages = products?.map((product) => ({
        ...product,
        images: product.images?.sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0),
        ),
      }));

      return {
        products: productsWithSortedImages || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error("Get admin products error:", error);
      return { error: "Erreur lors de la recuperation des produits" };
    }
  });

// ===========================================
// Get Single Product (Admin)
// ===========================================

export const getAdminProduct = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, slug),
          images:product_images(id, url, alt, position, is_primary, variant_id),
          options:product_options(id, name, values, position),
          variants:product_variants(id, sku, price, compare_price, stock_quantity, low_stock_threshold, options, position, is_active)
        `,
        )
        .eq("id", parsedInput.id)
        .single();

      if (error) throw error;

      // Sort images by position
      if (product?.images) {
        product.images.sort(
          (a: { position: number | null }, b: { position: number | null }) =>
            (a.position ?? 0) - (b.position ?? 0),
        );
      }

      // Sort options by position
      if (product?.options) {
        product.options.sort(
          (a: { position: number | null }, b: { position: number | null }) =>
            (a.position ?? 0) - (b.position ?? 0),
        );
      }

      // Sort variants by position
      if (product?.variants) {
        product.variants.sort(
          (a: { position: number | null }, b: { position: number | null }) =>
            (a.position ?? 0) - (b.position ?? 0),
        );
      }

      return { product };
    } catch (error) {
      console.error("Get admin product error:", error);
      return { error: "Produit non trouve" };
    }
  });

// ===========================================
// Create Product
// ===========================================

export const createProduct = action
  .schema(adminProductSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      // Generate slug if not provided
      const slug = parsedInput.slug || generateSlug(parsedInput.name);

      // Check if slug already exists
      const { data: existingProduct } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingProduct) {
        return { error: "Un produit avec ce slug existe deja" };
      }

      // Create product
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .insert({
          name: parsedInput.name,
          slug,
          description: parsedInput.description || null,
          brand: parsedInput.brand || null,
          sku: parsedInput.sku || null,
          price: parsedInput.price,
          compare_price: parsedInput.compare_price || null,
          category_id: parsedInput.category_id || null,
          stock_quantity: parsedInput.stock_quantity,
          stock_type: parsedInput.stock_type,
          low_stock_threshold: parsedInput.low_stock_threshold,
          is_active: parsedInput.is_active,
          is_featured: parsedInput.is_featured,
          meta_title: parsedInput.meta_title || null,
          meta_description: parsedInput.meta_description || null,
          specifications: parsedInput.specifications || {},
        })
        .select()
        .single();

      if (error) throw error;

      revalidatePath("/admin/products");
      revalidatePath("/products");

      return { success: true, product };
    } catch (error) {
      console.error("Create product error:", error);
      return { error: "Erreur lors de la creation du produit" };
    }
  });

// ===========================================
// Update Product
// ===========================================

export const updateProduct = action
  .schema(adminProductSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      const { id, ...updateData } = parsedInput;

      // Generate slug if not provided
      const slug = updateData.slug || generateSlug(updateData.name);

      // Check if slug already exists for another product
      const { data: existingProduct } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .single();

      if (existingProduct) {
        return { error: "Un produit avec ce slug existe deja" };
      }

      // Update product
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .update({
          name: updateData.name,
          slug,
          description: updateData.description || null,
          brand: updateData.brand || null,
          sku: updateData.sku || null,
          price: updateData.price,
          compare_price: updateData.compare_price || null,
          category_id: updateData.category_id || null,
          stock_quantity: updateData.stock_quantity,
          stock_type: updateData.stock_type,
          low_stock_threshold: updateData.low_stock_threshold,
          is_active: updateData.is_active,
          is_featured: updateData.is_featured,
          meta_title: updateData.meta_title || null,
          meta_description: updateData.meta_description || null,
          specifications: updateData.specifications || {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath("/products");
      revalidatePath(`/products/${slug}`);

      return { success: true, product };
    } catch (error) {
      console.error("Update product error:", error);
      return { error: "Erreur lors de la mise a jour du produit" };
    }
  });

// ===========================================
// Delete Product (Soft Delete)
// ===========================================

export const deleteProduct = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabaseAdmin
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", parsedInput.id);

      if (error) throw error;

      revalidatePath("/admin/products");
      revalidatePath("/products");

      return { success: true };
    } catch (error) {
      console.error("Delete product error:", error);
      return { error: "Erreur lors de la suppression du produit" };
    }
  });

// ===========================================
// Toggle Product Status
// ===========================================

export const toggleProductStatus = action
  .schema(
    z.object({
      id: z.string().uuid(),
      field: z.enum(["is_active", "is_featured"]),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      // Get current value
      const { data: product, error: fetchError } = await supabaseAdmin
        .from("products")
        .select("is_active, is_featured")
        .eq("id", parsedInput.id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the value
      const currentValue = parsedInput.field === "is_active"
        ? product.is_active
        : product.is_featured;
      const { error } = await supabaseAdmin
        .from("products")
        .update({
          [parsedInput.field]: !currentValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id);

      if (error) throw error;

      revalidatePath("/admin/products");
      revalidatePath("/products");

      return { success: true, newValue: !currentValue };
    } catch (error) {
      console.error("Toggle product status error:", error);
      return { error: "Erreur lors de la modification du statut" };
    }
  });

// ===========================================
// Get Categories (for product form)
// ===========================================

export async function getCategories() {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return { error: "Acces non autorise" };
  }

  try {
    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return { categories: categories || [] };
  } catch (error) {
    console.error("Get categories error:", error);
    return { error: "Erreur lors de la recuperation des categories" };
  }
}

// ===========================================
// Create Product with Variants
// ===========================================

export const createProductWithVariants = action
  .schema(adminProductWithVariantsSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      const { has_variants, options, variants, ...productData } = parsedInput;

      // Generate slug if not provided
      const slug = productData.slug || generateSlug(productData.name);

      // Check if slug already exists
      const { data: existingProduct } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingProduct) {
        return { error: "Un produit avec ce slug existe deja" };
      }

      // Calculate price and stock from variants if has_variants
      let finalPrice = productData.price;
      let finalStock = productData.stock_quantity;

      if (has_variants && variants && variants.length > 0) {
        // Price = min variant price
        finalPrice = Math.min(...variants.map((v) => v.price));
        // Stock = sum of all variant stock
        finalStock = variants.reduce(
          (sum, v) => sum + (v.stock_quantity || 0),
          0,
        );
      }

      // Create product
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .insert({
          name: productData.name,
          slug,
          description: productData.description || null,
          brand: productData.brand || null,
          sku: has_variants ? null : (productData.sku || null),
          price: finalPrice,
          compare_price: productData.compare_price || null,
          category_id: productData.category_id || null,
          stock_quantity: finalStock,
          stock_type: productData.stock_type,
          low_stock_threshold: productData.low_stock_threshold,
          is_active: productData.is_active,
          is_featured: productData.is_featured,
          meta_title: productData.meta_title || null,
          meta_description: productData.meta_description || null,
          specifications: productData.specifications || {},
          has_variants,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create options if has_variants
      if (has_variants && options && options.length > 0) {
        const optionsToInsert = options.map((opt, index) => ({
          product_id: product.id,
          name: opt.name,
          values: opt.values,
          position: opt.position ?? index,
        }));

        const { error: optionsError } = await supabaseAdmin
          .from("product_options")
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // Create variants if has_variants
      if (has_variants && variants && variants.length > 0) {
        const variantsToInsert = variants.map((v, index) => ({
          product_id: product.id,
          sku: v.sku,
          price: v.price,
          compare_price: v.compare_price || null,
          stock_quantity: v.stock_quantity || 0,
          low_stock_threshold: v.low_stock_threshold || 5,
          options: v.options,
          position: v.position ?? index,
          is_active: v.is_active ?? true,
        }));

        const { error: variantsError } = await supabaseAdmin
          .from("product_variants")
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      revalidatePath("/admin/products");
      revalidatePath("/products");

      return { success: true, product };
    } catch (error) {
      console.error("Create product with variants error:", error);
      return { error: "Erreur lors de la creation du produit" };
    }
  });

// ===========================================
// Update Product with Variants
// ===========================================

export const updateProductWithVariants = action
  .schema(adminProductWithVariantsSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      const { id, has_variants, options, variants, ...productData } =
        parsedInput;

      // Generate slug if not provided
      const slug = productData.slug || generateSlug(productData.name);

      // Check if slug already exists for another product
      const { data: existingProduct } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .single();

      if (existingProduct) {
        return { error: "Un produit avec ce slug existe deja" };
      }

      // Calculate price and stock from variants if has_variants
      let finalPrice = productData.price;
      let finalStock = productData.stock_quantity;

      if (has_variants && variants && variants.length > 0) {
        finalPrice = Math.min(...variants.map((v) => v.price));
        finalStock = variants.reduce(
          (sum, v) => sum + (v.stock_quantity || 0),
          0,
        );
      }

      // Update product
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .update({
          name: productData.name,
          slug,
          description: productData.description || null,
          brand: productData.brand || null,
          sku: has_variants ? null : (productData.sku || null),
          price: finalPrice,
          compare_price: productData.compare_price || null,
          category_id: productData.category_id || null,
          stock_quantity: finalStock,
          stock_type: productData.stock_type,
          low_stock_threshold: productData.low_stock_threshold,
          is_active: productData.is_active,
          is_featured: productData.is_featured,
          meta_title: productData.meta_title || null,
          meta_description: productData.meta_description || null,
          specifications: productData.specifications || {},
          has_variants,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (productError) throw productError;

      // Handle options: delete all and re-insert
      await supabaseAdmin
        .from("product_options")
        .delete()
        .eq("product_id", id);

      if (has_variants && options && options.length > 0) {
        const optionsToInsert = options.map((opt, index) => ({
          product_id: id,
          name: opt.name,
          values: opt.values,
          position: opt.position ?? index,
        }));

        const { error: optionsError } = await supabaseAdmin
          .from("product_options")
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // Handle variants: upsert existing, insert new, delete removed
      const { data: existingVariants } = await supabaseAdmin
        .from("product_variants")
        .select("id")
        .eq("product_id", id);

      const existingVariantIds = new Set(
        existingVariants?.map((v) => v.id) || [],
      );
      const newVariantIds = new Set(
        variants?.filter((v) => v.id).map((v) => v.id) || [],
      );

      // Delete variants that are no longer present
      const variantsToDelete = [...existingVariantIds].filter((vid) =>
        !newVariantIds.has(vid)
      );
      if (variantsToDelete.length > 0) {
        await supabaseAdmin
          .from("product_variants")
          .delete()
          .in("id", variantsToDelete);
      }

      // Upsert variants
      if (has_variants && variants && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (v.id && existingVariantIds.has(v.id)) {
            // Update existing variant
            await supabaseAdmin
              .from("product_variants")
              .update({
                sku: v.sku,
                price: v.price,
                compare_price: v.compare_price || null,
                stock_quantity: v.stock_quantity || 0,
                low_stock_threshold: v.low_stock_threshold || 5,
                options: v.options,
                position: v.position ?? i,
                is_active: v.is_active ?? true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", v.id);
          } else {
            // Insert new variant
            await supabaseAdmin
              .from("product_variants")
              .insert({
                product_id: id,
                sku: v.sku,
                price: v.price,
                compare_price: v.compare_price || null,
                stock_quantity: v.stock_quantity || 0,
                low_stock_threshold: v.low_stock_threshold || 5,
                options: v.options,
                position: v.position ?? i,
                is_active: v.is_active ?? true,
              });
          }
        }
      } else {
        // If no variants, delete all existing variants
        await supabaseAdmin
          .from("product_variants")
          .delete()
          .eq("product_id", id);
      }

      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      revalidatePath("/products");
      revalidatePath(`/products/${slug}`);

      return { success: true, product };
    } catch (error) {
      console.error("Update product with variants error:", error);
      return { error: "Erreur lors de la mise a jour du produit" };
    }
  });

// ===========================================
// Update Variant Stock (Quick update)
// ===========================================

export const updateVariantStock = action
  .schema(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.coerce.number().min(0),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      // Update variant stock
      const { data: variant, error: variantError } = await supabaseAdmin
        .from("product_variants")
        .update({
          stock_quantity: parsedInput.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.variantId)
        .select("product_id")
        .single();

      if (variantError) throw variantError;

      // Recalculate product total stock
      const { data: variants } = await supabaseAdmin
        .from("product_variants")
        .select("stock_quantity")
        .eq("product_id", variant.product_id);

      const totalStock = variants?.reduce((sum, v) =>
        sum + (v.stock_quantity || 0), 0) || 0;

      await supabaseAdmin
        .from("products")
        .update({
          stock_quantity: totalStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", variant.product_id);

      revalidatePath("/admin/products");
      revalidatePath("/admin/inventory");

      return { success: true };
    } catch (error) {
      console.error("Update variant stock error:", error);
      return { error: "Erreur lors de la mise a jour du stock" };
    }
  });

// ===========================================
// Assign Image to Variant
// ===========================================

export const assignImageToVariant = action
  .schema(
    z.object({
      imageId: z.string().uuid(),
      variantId: z.string().uuid().nullable(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" };
    }

    try {
      const { error } = await supabaseAdmin
        .from("product_images")
        .update({ variant_id: parsedInput.variantId })
        .eq("id", parsedInput.imageId);

      if (error) throw error;

      revalidatePath("/admin/products");

      return { success: true };
    } catch (error) {
      console.error("Assign image to variant error:", error);
      return { error: "Erreur lors de l'assignation de l'image" };
    }
  });
