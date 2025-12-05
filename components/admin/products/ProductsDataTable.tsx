"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/shared/DataTable"
import { DataTableToolbar } from "@/components/admin/shared/DataTableToolbar"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { getProductColumns } from "./columns"
import { deleteProduct, toggleProductStatus } from "@/actions/admin/products"
import { toast } from "sonner"
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"
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
  const [searchValue, setSearchValue] = useState(search)

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

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      // Debounced update
      const timer = setTimeout(() => {
        updateUrlParams({ search: value, page: 1 })
      }, 300)
      return () => clearTimeout(timer)
    },
    [updateUrlParams]
  )

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      updateUrlParams({ page: page + 1 })
    },
    [updateUrlParams]
  )

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateUrlParams({ limit: size, page: 1 })
    },
    [updateUrlParams]
  )

  // Handle toggle active
  const handleToggleActive = useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleProductStatus({ id, field: "is_active" })
      if (result?.data?.success) {
        toast.success("Statut mis a jour")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise a jour")
      }
    })
  }, [router])

  // Handle toggle featured
  const handleToggleFeatured = useCallback((id: string) => {
    startTransition(async () => {
      const result = await toggleProductStatus({ id, field: "is_featured" })
      if (result?.data?.success) {
        toast.success("Statut mis a jour")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise a jour")
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
        toast.success("Produit supprime")
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

  // Create a dummy table for the toolbar
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

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
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </PageHeader>

      <DataTableToolbar
        table={table}
        searchPlaceholder="Rechercher par nom, SKU ou marque..."
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
      />

      <DataTable
        columns={columns}
        data={products}
        manualPagination
        pageCount={pageCount}
        pageIndex={currentPage - 1}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer le produit"
        description="Etes-vous sur de vouloir supprimer ce produit ? Cette action est irreversible."
        variant="destructive"
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
