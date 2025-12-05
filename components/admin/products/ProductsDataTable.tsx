"use client"

import { useState, useCallback, useTransition, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RefreshCw, Check, X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { getProductColumns } from "./columns"
import { deleteProduct, toggleProductStatus } from "@/actions/admin/products"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"
import type { FilterableColumn } from "@/types/data-table"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: { id: string; name: string; slug: string } | null
  images?: Array<{
    id: string
    url: string
    alt: string | null
    position: number | null
    is_primary: boolean | null
  }> | null
}

type Category = {
  id: string
  name: string
  slug: string
}

interface ProductsDataTableProps {
  products: Product[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  categories?: Category[]
  statusFilter?: string
}

export function ProductsDataTable({
  products,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  categories = [],
  statusFilter,
}: ProductsDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

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
      router.push(`/admin/products?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  // Handle toggle active
  const handleToggleActive = useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleProductStatus({ id, field: "is_active" })
      if (result?.data?.success) {
        toast.success("Statut mis à jour")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }, [router])

  // Handle toggle featured
  const handleToggleFeatured = useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleProductStatus({ id, field: "is_featured" })
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
    setProductToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return

    startTransition(async () => {
      const result = await deleteProduct({ id: productToDelete })
      if (result?.data?.success) {
        toast.success("Produit supprimé")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la suppression")
      }
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    })
  }, [productToDelete, router])

  const columns = getProductColumns({
    onToggleActive: handleToggleActive,
    onToggleFeatured: handleToggleFeatured,
    onDelete: handleDelete,
  })

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      updateUrlParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
    },
    [updateUrlParams]
  )

  // Handle search via column filters
  const handleColumnFiltersChange = useCallback(
    (filters: { id: string; value: unknown }[]) => {
      const searchFilter = filters.find((f) => f.id === "name")
      const statusFilterValue = filters.find((f) => f.id === "is_active")
      const categoryFilter = filters.find((f) => f.id === "category")

      updateUrlParams({
        search: searchFilter?.value as string | undefined,
        status: Array.isArray(statusFilterValue?.value)
          ? (statusFilterValue.value as string[]).join(",")
          : undefined,
        category: Array.isArray(categoryFilter?.value)
          ? (categoryFilter.value as string[]).join(",")
          : undefined,
        page: 1,
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
        { label: "Actif", value: "true", icon: Check },
        { label: "Inactif", value: "false", icon: X },
      ],
    },
    {
      id: "is_featured",
      title: "Vedette",
      options: [
        { label: "En vedette", value: "true", icon: Star },
        { label: "Standard", value: "false" },
      ],
    },
    ...(categories.length > 0 ? [{
      id: "category",
      title: "Catégorie",
      options: categories.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    }] : []),
  ], [categories])

  // Build initial filters from URL
  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "name", value: search })
    }
    if (statusFilter) {
      filters.push({ id: "is_active", value: statusFilter.split(",") })
    }
    return filters
  }, [search, statusFilter])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Produits"
        description={`${products.length} produit(s) sur cette page`}
      >
        <Button variant="outline" size="icon" onClick={() => router.refresh()}>
          <RefreshCw className={isPending ? "animate-spin" : ""} />
          <span className="sr-only">Actualiser</span>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        toolbar={{
          searchKey: "name",
          searchPlaceholder: "Rechercher par nom...",
          onAdd: () => router.push("/admin/products/new"),
          addLabel: "Nouveau produit",
          filterableColumns,
        }}
        manualPagination
        pageCount={pageCount}
        initialPagination={{
          pageIndex: currentPage - 1,
          pageSize,
        }}
        initialColumnFilters={initialFilters}
        initialColumnVisibility={{ is_featured: false }}
        onPaginationChange={handlePaginationChange}
        onColumnFiltersChange={handleColumnFiltersChange}
        enableRowSelection
        isLoading={isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
        variant="destructive"
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
