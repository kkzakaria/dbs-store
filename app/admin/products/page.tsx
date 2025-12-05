import { getAdminProducts } from "@/actions/admin/products"
import { getCategories } from "@/actions/categories"
import { ProductsDataTable } from "@/components/admin/products/ProductsDataTable"

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    category?: string
    status?: string
  }>
}

export const metadata = {
  title: "Produits | Administration DBS Store",
  description: "Gestion des produits",
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 10
  const search = params.search || ""
  const categoryId = params.category || undefined
  const status = params.status || undefined

  const [result, categoriesResult] = await Promise.all([
    getAdminProducts({
      page,
      limit,
      search: search || undefined,
      categoryId,
      sort: "created_at",
      order: "desc",
    }),
    getCategories(),
  ])

  // Handle error case
  if (!result.data) {
    const errorMessage = "error" in result ? String(result.error) : "Une erreur est survenue"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { products = [], totalPages = 1, total = 0 } = result.data
  const categories = categoriesResult?.categories || []

  return (
    <ProductsDataTable
      products={products}
      pageCount={totalPages}
      totalCount={total}
      currentPage={page}
      pageSize={limit}
      search={search}
      categories={categories}
      statusFilter={status}
    />
  )
}
