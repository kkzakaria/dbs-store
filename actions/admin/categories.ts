"use server"

import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import {
  adminCategoryFiltersSchema,
  adminCategorySchema,
  isAdminRole,
  generateSlug,
} from "@/lib/validations/admin"
import { z } from "zod"

const action = createSafeActionClient()

// ===========================================
// Get Admin Categories (with filters and pagination)
// ===========================================

export const getAdminCategories = action
  .schema(adminCategoryFiltersSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    const { page, limit, search, isActive, parentId } = parsedInput

    try {
      let query = supabaseAdmin
        .from("categories")
        .select(
          `
          *,
          parent:categories!parent_id(id, name, slug),
          _count:products(count)
        `,
          { count: "exact" }
        )

      // Apply filters
      if (search && search.trim()) {
        query = query.ilike("name", `%${search}%`)
      }

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive)
      }

      if (parentId !== undefined) {
        if (parentId === null) {
          query = query.is("parent_id", null)
        } else {
          query = query.eq("parent_id", parentId)
        }
      }

      // Sorting
      query = query.order("position", { ascending: true }).order("name", { ascending: true })

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: categories, error, count } = await query

      if (error) throw error

      return {
        categories: categories || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error("Get admin categories error:", error)
      return { error: "Erreur lors de la recuperation des categories" }
    }
  })

// ===========================================
// Get Single Category (Admin)
// ===========================================

export const getAdminCategory = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { data: category, error } = await supabaseAdmin
        .from("categories")
        .select(
          `
          *,
          parent:categories!parent_id(id, name, slug)
        `
        )
        .eq("id", parsedInput.id)
        .single()

      if (error) throw error

      return { category }
    } catch (error) {
      console.error("Get admin category error:", error)
      return { error: "Categorie non trouvee" }
    }
  })

// ===========================================
// Create Category
// ===========================================

export const createCategory = action
  .schema(adminCategorySchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      // Generate slug if not provided
      const slug = parsedInput.slug || generateSlug(parsedInput.name)

      // Check if slug already exists
      const { data: existingCategory } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .single()

      if (existingCategory) {
        return { error: "Une categorie avec ce slug existe deja" }
      }

      // Get max position for ordering
      const { data: maxPositionResult } = await supabaseAdmin
        .from("categories")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .single()

      const nextPosition = (maxPositionResult?.position ?? -1) + 1

      // Create category
      const { data: category, error } = await supabaseAdmin
        .from("categories")
        .insert({
          name: parsedInput.name,
          slug,
          description: parsedInput.description || null,
          image_url: parsedInput.image_url || null,
          parent_id: parsedInput.parent_id || null,
          position: parsedInput.position || nextPosition,
          is_active: parsedInput.is_active,
        })
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/categories")
      revalidatePath("/categories")

      return { success: true, category }
    } catch (error) {
      console.error("Create category error:", error)
      return { error: "Erreur lors de la creation de la categorie" }
    }
  })

// ===========================================
// Update Category
// ===========================================

export const updateCategory = action
  .schema(adminCategorySchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      const { id, ...updateData } = parsedInput

      // Generate slug if not provided
      const slug = updateData.slug || generateSlug(updateData.name)

      // Check if slug already exists for another category
      const { data: existingCategory } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .single()

      if (existingCategory) {
        return { error: "Une categorie avec ce slug existe deja" }
      }

      // Prevent setting parent to self
      if (updateData.parent_id === id) {
        return { error: "Une categorie ne peut pas etre son propre parent" }
      }

      // Update category
      const { data: category, error } = await supabaseAdmin
        .from("categories")
        .update({
          name: updateData.name,
          slug,
          description: updateData.description || null,
          image_url: updateData.image_url || null,
          parent_id: updateData.parent_id || null,
          position: updateData.position,
          is_active: updateData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      revalidatePath("/admin/categories")
      revalidatePath("/categories")
      revalidatePath(`/categories/${slug}`)

      return { success: true, category }
    } catch (error) {
      console.error("Update category error:", error)
      return { error: "Erreur lors de la mise a jour de la categorie" }
    }
  })

// ===========================================
// Delete Category (Soft Delete)
// ===========================================

export const deleteCategory = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      // Check if category has products
      const { count: productCount } = await supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", parsedInput.id)

      if (productCount && productCount > 0) {
        return { error: `Impossible de supprimer: ${productCount} produit(s) utilise(nt) cette categorie` }
      }

      // Check if category has subcategories
      const { count: subcategoryCount } = await supabaseAdmin
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", parsedInput.id)

      if (subcategoryCount && subcategoryCount > 0) {
        return { error: `Impossible de supprimer: ${subcategoryCount} sous-categorie(s) existe(nt)` }
      }

      // Soft delete
      const { error } = await supabaseAdmin
        .from("categories")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", parsedInput.id)

      if (error) throw error

      revalidatePath("/admin/categories")
      revalidatePath("/categories")

      return { success: true }
    } catch (error) {
      console.error("Delete category error:", error)
      return { error: "Erreur lors de la suppression de la categorie" }
    }
  })

// ===========================================
// Toggle Category Status
// ===========================================

export const toggleCategoryStatus = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser()
    if (!user || !isAdminRole(user.role)) {
      return { error: "Acces non autorise" }
    }

    try {
      // Get current value
      const { data: category, error: fetchError } = await supabaseAdmin
        .from("categories")
        .select("is_active")
        .eq("id", parsedInput.id)
        .single()

      if (fetchError) throw fetchError

      // Toggle the value
      const { error } = await supabaseAdmin
        .from("categories")
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsedInput.id)

      if (error) throw error

      revalidatePath("/admin/categories")
      revalidatePath("/categories")

      return { success: true, newValue: !category.is_active }
    } catch (error) {
      console.error("Toggle category status error:", error)
      return { error: "Erreur lors de la modification du statut" }
    }
  })

// ===========================================
// Get All Categories (for select dropdown)
// ===========================================

export async function getAllCategories() {
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Acces non autorise" }
  }

  try {
    const { data: categories, error } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug, parent_id, is_active")
      .order("position", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error

    return { categories: categories || [] }
  } catch (error) {
    console.error("Get all categories error:", error)
    return { error: "Erreur lors de la recuperation des categories" }
  }
}
