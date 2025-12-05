import { Suspense } from "react"
import { getAdminCategories, getAllCategories } from "@/actions/admin/categories"
import { CategoriesDataTable } from "@/components/admin/categories/CategoriesDataTable"
import { DataTableSkeleton } from "@/components/data-table"

interface CategoriesPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
  }>
}

export default async function AdminCategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 50
  const search = params.search || ""

  const [result, allCategoriesResult] = await Promise.all([
    getAdminCategories({
      page,
      limit,
      search: search || undefined,
    }),
    getAllCategories(),
  ])

  if (!result.data) {
    const errorMessage = "error" in result ? String(result.data) : "Erreur lors du chargement"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { categories = [], totalPages = 1, total = 0 } = result.data
  const allCategories = allCategoriesResult?.categories || []

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
      <CategoriesDataTable
        categories={categories}
        allCategories={allCategories}
        pageCount={totalPages}
        currentPage={page}
        pageSize={limit}
        search={search}
        totalCount={total}
      />
    </Suspense>
  )
}
