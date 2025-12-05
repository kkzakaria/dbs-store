import { Suspense } from "react"
import { getInventory, getLowStockCount } from "@/actions/admin/inventory"
import { getCategories } from "@/actions/admin/products"
import { InventoryDataTable } from "@/components/admin/inventory/InventoryDataTable"
import { DataTableSkeleton } from "@/components/data-table"

interface InventoryPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    lowStock?: string
    outOfStock?: string
    category?: string
  }>
}

export default async function AdminInventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 20
  const search = params.search || ""
  const lowStock = params.lowStock === "true"
  const outOfStock = params.outOfStock === "true"
  const categoryId = params.category

  const [result, categoriesResult, stockCounts] = await Promise.all([
    getInventory({
      page,
      limit,
      search: search || undefined,
      lowStock,
      outOfStock,
      categoryId,
    }),
    getCategories(),
    getLowStockCount(),
  ])

  if (!result.data) {
    const errorMessage = "error" in result ? String(result.data) : "Erreur lors du chargement"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { products = [], totalPages = 1, total = 0 } = result.data
  const categories = categoriesResult?.categories || []
  const { lowStock: lowStockCount = 0, outOfStock: outOfStockCount = 0 } = stockCounts || {}

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}>
      <InventoryDataTable
        products={products}
        categories={categories}
        pageCount={totalPages}
        currentPage={page}
        pageSize={limit}
        search={search}
        totalCount={total}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
      />
    </Suspense>
  )
}
