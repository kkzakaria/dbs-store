"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

// Schema for wishlist operations
const wishlistItemSchema = z.object({
  productId: z.string().uuid(),
});

// Wishlist product type (simplified for frontend)
export type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  image: string;
  stock_quantity: number;
};

export type WishlistItem = {
  id: string;
  product: WishlistProduct;
  created_at: string | null;
};

/**
 * Get user's wishlist with product details
 */
export async function getWishlist(): Promise<{
  items: WishlistItem[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], error: null };
  }

  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      id,
      created_at,
      product:products(
        id,
        name,
        slug,
        price,
        compare_price,
        stock_quantity,
        images:product_images(url, is_primary)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get wishlist error:", error);
    return { items: [], error: "Erreur lors du chargement des favoris" };
  }

  interface WishlistQueryResult {
    id: string;
    created_at: string | null;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      compare_price: number | null;
      stock_quantity: number | null;
      images: {
        url: string;
        is_primary: boolean | null;
      }[] | null;
    } | null;
  }

  const items: WishlistItem[] =
    ((data as unknown as WishlistQueryResult[]) || [])
      .filter((item) => item.product !== null)
      .map((item) => {
        const p = item.product!;
        const images = p.images;
        const primaryImage = images?.find((img) => img.is_primary === true) ||
          images?.[0];
        return {
          id: item.id,
          created_at: item.created_at,
          product: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            compare_price: p.compare_price,
            stock_quantity: p.stock_quantity ?? 0,
            image: primaryImage?.url || "/images/placeholder-product.png",
          },
        };
      });

  return { items, error: null };
}

/**
 * Add product to wishlist
 */
export const addToWishlist = action
  .schema(wishlistItemSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Vous devez être connecté pour ajouter aux favoris" };
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", parsedInput.productId)
      .single();

    if (existing) {
      return { success: true, alreadyExists: true };
    }

    // Add to wishlist
    const { error } = await supabase.from("wishlist").insert({
      user_id: user.id,
      product_id: parsedInput.productId,
    });

    if (error) {
      console.error("Add to wishlist error:", error);
      return { error: "Erreur lors de l'ajout aux favoris" };
    }

    revalidatePath("/wishlist");
    return { success: true };
  });

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = action
  .schema(wishlistItemSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Vous devez être connecté" };
    }

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", parsedInput.productId);

    if (error) {
      console.error("Remove from wishlist error:", error);
      return { error: "Erreur lors de la suppression" };
    }

    revalidatePath("/wishlist");
    return { success: true };
  });

/**
 * Toggle product in wishlist (add if not exists, remove if exists)
 */
export const toggleWishlist = action
  .schema(wishlistItemSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Vous devez être connecté pour gérer vos favoris" };
    }

    // Check if exists
    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", parsedInput.productId)
      .single();

    if (existing) {
      // Remove
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error("Remove from wishlist error:", error);
        return { error: "Erreur lors de la suppression" };
      }

      revalidatePath("/wishlist");
      return { success: true, action: "removed" as const };
    } else {
      // Add
      const { error } = await supabase.from("wishlist").insert({
        user_id: user.id,
        product_id: parsedInput.productId,
      });

      if (error) {
        console.error("Add to wishlist error:", error);
        return { error: "Erreur lors de l'ajout aux favoris" };
      }

      revalidatePath("/wishlist");
      return { success: true, action: "added" as const };
    }
  });

/**
 * Check if a product is in user's wishlist
 */
export async function isProductInWishlist(productId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  return !!data;
}

/**
 * Get wishlist product IDs for quick lookup
 */
export async function getWishlistProductIds(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Get wishlist IDs error:", error);
    return [];
  }

  return data.map((item) => item.product_id);
}
