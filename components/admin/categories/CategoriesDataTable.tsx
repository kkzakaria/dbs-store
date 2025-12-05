"use client"

import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, X } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { getCategoryColumns } from "./columns"
import { CategoryFormDialog } from "./CategoryFormDialog"
import { deleteCategory, toggleCategoryStatus } from "@/actions/admin/categories"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"
import type { FilterableColumn } from "@/types/data-table"

type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  parent?: { id: string; name: string; slug: string } | null
  _count?: Array<{ count: number }> | null
}

interface CategoriesDataTableProps {
  categories: Category[]
  allCategories: Array<{ id: string; name: string; parent_id: string | null }>
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  totalCount?: number
}

export function CategoriesDataTable({
  categories,
  allCategories,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  totalCount,
}: CategoriesDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const { setCustomTitle } = useAdminHeader()

  // Set custom title with category count
  useEffect(() => {
    if (totalCount !== undefined) {
      setCustomTitle(`Categories (${totalCount})`)
    }
    return () => setCustomTitle(null)
  }, [totalCount, setCustomTitle])

  // Update URL with new params
  const updateUrlParams = useCallback(
    (params: Record<string, string | number | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === 1) {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })
      router.push(`/admin/categories?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  // Handle edit
  const handleEdit = useCallback((category: Category) => {
    setCategoryToEdit(category)
    setFormDialogOpen(true)
  }, [])

  // Handle toggle active
  const handleToggleActive = useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleCategoryStatus({ id })
      if (result?.data?.success) {
        toast.success("Statut mis à jour")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }, [router])

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    setCategoryToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!categoryToDelete) return

    startTransition(async () => {
      const result = await deleteCategory({ id: categoryToDelete })
      if (result?.data?.success) {
        toast.success("Categorie supprimee")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la suppression")
      }
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    })
  }, [categoryToDelete, router])

  // Handle form dialog close
  const handleFormClose = useCallback((open: boolean) => {
    setFormDialogOpen(open)
    if (!open) {
      setCategoryToEdit(null)
    }
  }, [])

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  const columns = getCategoryColumns({
    onEdit: handleEdit,
    onToggleActive: handleToggleActive,
    onDelete: handleDelete,
  })

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      startTransition(() => {
        updateUrlParams({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        })
      })
    },
    [updateUrlParams]
  )

  // Handle search via column filters
  const handleColumnFiltersChange = useCallback(
    (filters: { id: string; value: unknown }[]) => {
      const searchFilter = filters.find((f) => f.id === "name")
      const statusFilterValue = filters.find((f) => f.id === "is_active")

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          status: Array.isArray(statusFilterValue?.value)
            ? (statusFilterValue.value as string[]).join(",")
            : undefined,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Build filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(() => [
    {
      id: "is_active",
      title: "Statut",
      options: [
        { label: "Active", value: "true", icon: Check },
        { label: "Inactive", value: "false", icon: X },
      ],
    },
  ], [])

  // Build initial filters from URL
  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "name", value: search })
    }
    return filters
  }, [search])

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={categories}
        toolbar={{
          searchKey: "name",
          searchPlaceholder: "Rechercher par nom...",
          onRefresh: () => router.refresh(),
          isRefreshing: isPending,
          onAdd: () => {
            setCategoryToEdit(null)
            setFormDialogOpen(true)
          },
          addLabel: "Nouvelle categorie",
          filterableColumns,
        }}
        manualPagination
        pageCount={pageCount}
        initialPagination={{
          pageIndex: currentPage - 1,
          pageSize,
        }}
        initialColumnFilters={initialFilters}
        onPaginationChange={handlePaginationChange}
        onColumnFiltersChange={handleColumnFiltersChange}
        enableRowSelection
        isLoading={isPending}
      />

      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={handleFormClose}
        category={categoryToEdit}
        categories={allCategories}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer la categorie"
        description="Etes-vous sur de vouloir supprimer cette categorie ? Cette action est irreversible."
        variant="destructive"
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
