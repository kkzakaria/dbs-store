import { Suspense } from "react"
import { Metadata } from "next"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { getProducts, getBrands } from "@/actions/products"
import { getCategories } from "@/actions/categories"
import {
  ProductGrid,
  ProductGridLoader,
  ProductFilters,
  ProductFiltersSidebar,
} from "@/components/store/products"
import type { SortOption } from "@/lib/validations/product"

export const metadata: Metadata = {
  title: "Nos Produits | DBS Store",
  description:
    "Découvrez notre catalogue de produits électroniques premium: smartphones, ordinateurs, accessoires et audio.",
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    brand?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    search?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams

  // Parse search params
  const filters = {
    categorySlug: params.category || undefined,
    brand: params.brand || undefined,
    minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
    sort: (params.sort as SortOption) || "newest",
    search: params.search || undefined,
  }

  // Fetch initial data in parallel
  const [productsResult, categoriesResult, brandsResult] = await Promise.all([
    getProducts({
      ...filters,
      page: 1,
      limit: 12,
    }),
    getCategories(),
    getBrands(),
  ])

  const products = productsResult?.data?.products || []
  const total = productsResult?.data?.total || 0
  const categories = categoriesResult?.categories || []
  const brands = brandsResult?.brands || []


  return (
    <NuqsAdapter>
      <div className="bg-white dark:bg-background min-h-screen">
        <div className="container-google py-4 md:py-6">
          {/* Header */}
          <div className="relative mb-6 md:mb-8 p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-gradient-to-br from-sky-100/50 via-indigo-50/50 to-white dark:from-blue-900/20 dark:via-slate-900/10 dark:to-transparent border border-blue-100/50 dark:border-blue-900/20 overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight text-foreground mb-2">
                Nos Produits
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                Découvrez notre sélection exclusive d&apos;appareils électroniques premium.
              </p>
            </div>
            
          </div>
 
          <div className="flex flex-col gap-16 lg:flex-row">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
              <ProductFiltersSidebar categories={categories} brands={brands} />
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Mobile Filters + Sort */}
              <div className="mb-8 flex items-center justify-between gap-4">
                <ProductFilters categories={categories} brands={brands} />
              </div>

              {/* Products Grid */}
              <Suspense fallback={<ProductGridLoader />}>
                <ProductGrid
                  initialProducts={products}
                  initialTotal={total}
                  filters={filters}
                />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </NuqsAdapter>
  )
}
