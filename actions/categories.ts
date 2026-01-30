"use server"

import { createSafeActionClient } from "next-safe-action"
import { createClient } from "@/lib/supabase/server"
import { categorySlugSchema } from "@/lib/validations/product"

const action = createSafeActionClient()

// ===========================================
// Get All Categories
// ===========================================

export async function getCategories() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      slug,
      description,
      image_url,
      position,
      parent_id
    `
    )
    .eq("is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("Get categories error:", error)
    return { categories: [] }
  }

  return { categories: categories || [] }
}

// ===========================================
// Get Category by Slug
// ===========================================

export const getCategoryBySlug = action
  .schema(categorySlugSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { slug } = parsedInput

    const { data: category, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        description,
        image_url,
        position,
        parent_id
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Get category by slug error:", error)
      return { error: "Catégorie non trouvée" }
    }

    return { category }
  })

// ===========================================
// Get Categories with Product Count
// ===========================================

export async function getCategoriesWithProductCount() {
  const supabase = await createClient()

  // Single query: fetch categories with product count using Supabase's count
  const { data: categories, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      slug,
      description,
      image_url,
      position,
      parent_id,
      products(count)
    `
    )
    .eq("is_active", true)
    .eq("products.is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("Get categories with count error:", error)
    return { categories: [] }
  }

  const categoriesWithCount = categories?.map((cat) => ({
    ...cat,
    productCount: (cat.products as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return { categories: categoriesWithCount || [] }
}

// ===========================================
// Get Subcategories
// ===========================================

export async function getSubcategories(parentId: string) {
  const supabase = await createClient()

  const { data: subcategories, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      slug,
      description,
      image_url,
      position
    `
    )
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("position", { ascending: true })

  if (error) {
    console.error("Get subcategories error:", error)
    return { subcategories: [] }
  }

  return { subcategories: subcategories || [] }
}
