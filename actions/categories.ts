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

  // Get categories
  const { data: categories, error: catError } = await supabase
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

  if (catError) {
    console.error("Get categories error:", catError)
    return { categories: [] }
  }

  // Get product counts per category
  const { data: counts, error: countError } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_active", true)

  if (countError) {
    console.error("Get product counts error:", countError)
    return { categories: categories || [] }
  }

  // Count products per category
  const countMap = new Map<string, number>()
  counts?.forEach((p) => {
    if (p.category_id) {
      countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1)
    }
  })

  // Merge categories with counts
  const categoriesWithCount = categories?.map((cat) => ({
    ...cat,
    productCount: countMap.get(cat.id) || 0,
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
