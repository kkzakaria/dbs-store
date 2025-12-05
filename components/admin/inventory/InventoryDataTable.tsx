"use client"

import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, PackageX } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { getInventoryColumns } from "./columns"
import { StockEditDialog } from "./StockEditDialog"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"
import type { FilterableColumn, FilterOption } from "@/types/data-table"

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
      const statusFilter = filters.find((f) => f.id === "status")

      // Map status filter values to lowStock/outOfStock params
      const statusValues = (statusFilter?.value as string[]) || []
      const hasLowStock = statusValues.includes("low_stock")
      const hasOutOfStock = statusValues.includes("out_of_stock")

      startTransition(() => {
        updateUrlParams({
          search: searchFilter?.value as string | undefined,
          category: Array.isArray(categoryFilter?.value)
            ? (categoryFilter.value as string[])[0]
            : undefined,
          lowStock: hasLowStock || undefined,
          outOfStock: hasOutOfStock || undefined,
          page: 1,
        })
      })
    },
    [updateUrlParams]
  )

  // Build status filter options with counts
  const statusOptions: FilterOption[] = useMemo(() => [
    {
      label: `Stock bas (${lowStockCount})`,
      value: "low_stock",
      icon: AlertTriangle,
    },
    {
      label: `Epuises (${outOfStockCount})`,
      value: "out_of_stock",
      icon: PackageX,
    },
  ], [lowStockCount, outOfStockCount])

  // Build filterable columns
  const filterableColumns: FilterableColumn[] = useMemo(() => [
    {
      id: "status",
      title: "Statut",
      options: statusOptions,
    },
    ...(categories.length > 0 ? [{
      id: "category",
      title: "Categorie",
      options: categories.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    }] : []),
  ], [categories, statusOptions])

  // Build initial filters from URL (including status filters)
  const lowStockFilter = searchParams.get("lowStock") === "true"
  const outOfStockFilter = searchParams.get("outOfStock") === "true"

  const initialFilters = useMemo(() => {
    const filters: { id: string; value: unknown }[] = []
    if (search) {
      filters.push({ id: "name", value: search })
    }
    // Map URL params to status filter values
    const statusValues: string[] = []
    if (lowStockFilter) statusValues.push("low_stock")
    if (outOfStockFilter) statusValues.push("out_of_stock")
    if (statusValues.length > 0) {
      filters.push({ id: "status", value: statusValues })
    }
    return filters
  }, [search, lowStockFilter, outOfStockFilter])

  return (
    <div className="space-y-4">
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
