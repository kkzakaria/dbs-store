"use server"

import { createSafeActionClient } from "next-safe-action"
import { createClient } from "@/lib/supabase/server"
import {
  productFiltersSchema,
  searchQuerySchema,
  productSlugSchema,
  relatedProductsSchema,
  type ProductFilters,
} from "@/lib/validations/product"

const action = createSafeActionClient()

// ===========================================
// Get Products with Filters
// ===========================================

export const getProducts = action
  .schema(productFiltersSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const {
      categorySlug,
      brand,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
      featured,
      search,
    } = parsedInput

    // Start building query
    let query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt, position, is_primary)
      `,
        { count: "exact" }
      )
      .eq("is_active", true)

    // Filter by category
    if (categorySlug) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single()

      if (category) {
        query = query.eq("category_id", category.id)
      }
    }

    // Filter by brand
    if (brand) {
      query = query.eq("brand", brand)
    }

    // Filter by price range
    if (minPrice !== undefined) {
      query = query.gte("price", minPrice)
    }
    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice)
    }

    // Filter by featured
    if (featured !== undefined) {
      query = query.eq("is_featured", featured)
    }

    // Full-text search
    if (search && search.trim()) {
      query = query.textSearch("name", search.trim(), {
        type: "websearch",
        config: "french",
      })
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true })
        break
      case "price_desc":
        query = query.order("price", { ascending: false })
        break
      case "name_asc":
        query = query.order("name", { ascending: true })
        break
      case "name_desc":
        query = query.order("name", { ascending: false })
        break
      case "popular":
        // For now, use featured + recent as proxy for popularity
        query = query
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
        break
      case "newest":
      default:
        query = query.order("created_at", { ascending: false })
        break
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: products, error, count } = await query

    if (error) {
      console.error("Get products error:", error)
      return { error: "Erreur lors de la récupération des produits" }
    }

    // Sort images by position within each product
    const productsWithSortedImages = products?.map((product) => ({
      ...product,
      images: product.images?.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      ),
    }))

    return {
      products: productsWithSortedImages || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })

// ===========================================
// Get Product by Slug
// ===========================================

export const getProductBySlug = action
  .schema(productSlugSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { slug } = parsedInput

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug, description),
        images:product_images(id, url, alt, position, is_primary)
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Get product by slug error:", error)
      return { error: "Produit non trouvé" }
    }

    // Sort images by position
    if (product?.images) {
      product.images.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      )
    }

    return { product }
  })

// ===========================================
// Get Featured Products
// ===========================================

export const getFeaturedProducts = action
  .schema(productFiltersSchema.pick({ limit: true }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { limit = 8 } = parsedInput

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt, position, is_primary)
      `
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Get featured products error:", error)
      return { error: "Erreur lors de la récupération des produits vedettes" }
    }

    // Sort images by position within each product
    const productsWithSortedImages = products?.map((product) => ({
      ...product,
      images: product.images?.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      ),
    }))

    return { products: productsWithSortedImages || [] }
  })

// ===========================================
// Search Products
// ===========================================

export const searchProducts = action
  .schema(searchQuerySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { query, limit } = parsedInput

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        price,
        compare_price,
        brand,
        images:product_images(url, alt, is_primary)
      `
      )
      .eq("is_active", true)
      .textSearch("name", query, {
        type: "websearch",
        config: "french",
      })
      .limit(limit)

    if (error) {
      console.error("Search products error:", error)
      return { error: "Erreur lors de la recherche" }
    }

    // Get primary image for each product
    const productsWithImage = products?.map((product) => {
      const primaryImage = product.images?.find(
        (img) => img.is_primary === true
      )
      return {
        ...product,
        image: primaryImage || product.images?.[0] || null,
      }
    })

    return { products: productsWithImage || [] }
  })

// ===========================================
// Get Related Products
// ===========================================

export const getRelatedProducts = action
  .schema(relatedProductsSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { productId, categoryId, limit } = parsedInput

    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt, position, is_primary)
      `
      )
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .neq("id", productId)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Get related products error:", error)
      return { error: "Erreur lors de la récupération des produits similaires" }
    }

    // Sort images by position within each product
    const productsWithSortedImages = products?.map((product) => ({
      ...product,
      images: product.images?.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      ),
    }))

    return { products: productsWithSortedImages || [] }
  })

// ===========================================
// Get All Brands
// ===========================================

export async function getBrands() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null)

  if (error) {
    console.error("Get brands error:", error)
    return { brands: [] }
  }

  // Get unique brands
  const brands = [...new Set(data?.map((p) => p.brand).filter((b): b is string => b !== null))]
  return { brands: brands.sort() }
}

// ===========================================
// Get Price Range
// ===========================================

export async function getPriceRange() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("price")
    .eq("is_active", true)

  if (error) {
    console.error("Get price range error:", error)
    return { min: 0, max: 0 }
  }

  const prices = data?.map((p) => p.price) || []
  return {
    min: Math.min(...prices, 0),
    max: Math.max(...prices, 0),
  }
}
