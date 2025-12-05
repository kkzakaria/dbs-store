"use client"

import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, PackageX, Package } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { getInventoryColumns } from "./columns"
import { StockEditDialog } from "./StockEditDialog"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import type { FilterableColumn } from "@/types/data-table"

type InventoryProduct = {
  id: string
  name: string
  slug: string
  sku: string | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  stock_type: string | null
  is_active: boolean | null
  category?: { id: string; name: string } | null
  images?: Array<{ url: string; is_primary: boolean | null }> | null
}

type Category = {
  id: string
  name: string
}

interface InventoryDataTableProps {
  products: InventoryProduct[]
  categories: Category[]
  pageCount: number
  currentPage: number
  pageSize: number
  search?: string
  totalCount?: number
  lowStockCount?: number
  outOfStockCount?: number
}

export function InventoryDataTable({
  products,
  categories,
  pageCount,
  currentPage,
  pageSize,
  search = "",
  totalCount,
  lowStockCount = 0,
  outOfStockCount = 0,
}: InventoryDataTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<InventoryProduct | null>(null)
  const { setCustomTitle } = useAdminHeader()

  // Set custom title
  useEffect(() => {
    if (totalCount !== undefined) {
      setCustomTitle(`Inventaire (${totalCount} produits)`)
    }
    return () => setCustomTitle(null)
  }, [totalCount, setCustomTitle])

  // Update URL with new params
  const updateUrlParams = useCallback(
    (params: Record<string, string | number | boolean | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === 1 || value === false) {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })
      router.push(`/admin/inventory?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  // Handle edit stock
  const handleEditStock = useCallback((product: InventoryProduct) => {
    setProductToEdit(product)
    setStockDialogOpen(true)
  }, [])

  const columns = getInventoryColumns({
    onEditStock: handleEditStock,
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
      const categoryFilter = filters.find((f) => f.id === "category")

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          category: Array.isArray(categoryFilter?.value)
            ? (categoryFilter.value as string[])[0]
            : undefined,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Build filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(() => [
    ...(categories.length > 0 ? [{
      id: "category",
      title: "Categorie",
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
    return filters
  }, [search])

  // Quick filter buttons
  const lowStockFilter = searchParams.get("lowStock") === "true"
  const outOfStockFilter = searchParams.get("outOfStock") === "true"

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="flex gap-2">
        <button
          onClick={() => updateUrlParams({ lowStock: !lowStockFilter, outOfStock: undefined, page: 1 })}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            lowStockFilter
              ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20"
              : "hover:bg-muted"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Stock bas ({lowStockCount})
        </button>
        <button
          onClick={() => updateUrlParams({ outOfStock: !outOfStockFilter, lowStock: undefined, page: 1 })}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            outOfStockFilter
              ? "border-destructive bg-destructive/10 text-destructive"
              : "hover:bg-muted"
          }`}
        >
          <PackageX className="h-4 w-4" />
          Epuises ({outOfStockCount})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        toolbar={{
          searchKey: "name",
          searchPlaceholder: "Rechercher par nom ou SKU...",
          onRefresh: () => router.refresh(),
          isRefreshing: isPending,
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
        isLoading={isPending}
      />

      <StockEditDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={productToEdit}
      />
    </div>
  )
}
