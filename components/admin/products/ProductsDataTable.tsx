"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { getProductColumns } from "./columns"
import { deleteProduct, toggleProductStatus } from "@/actions/admin/products"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"

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

interface ProductsDataTableProps {
  products: Product[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
}

export function ProductsDataTable({
  products,
  pageCount,
  currentPage,
  pageSize,
  search = "",
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
      updateUrlParams({
        search: searchFilter?.value as string | undefined,
        page: 1,
      })
    },
    [updateUrlParams]
  )

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
        <Button asChild>
          <Link href="/admin/products/new">
            Nouveau produit
          </Link>
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        toolbar={{
          searchKey: "name",
          searchPlaceholder: "Rechercher par nom...",
        }}
        manualPagination
        pageCount={pageCount}
        initialPagination={{
          pageIndex: currentPage - 1,
          pageSize,
        }}
        initialColumnFilters={search ? [{ id: "name", value: search }] : []}
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
