import { cache, Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { getProducts, getBrands } from "@/actions/products"
import { getCategoryBySlug, getCategories } from "@/actions/categories"

// Cache getCategoryBySlug to deduplicate between generateMetadata and page render
const getCachedCategory = cache(async (slug: string) => {
  return getCategoryBySlug({ slug })
})
import {
  ProductGrid,
  ProductGridLoader,
  ProductFilters,
  ProductFiltersSidebar,
} from "@/components/store/products"
import type { SortOption } from "@/lib/validations/product"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    brand?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getCachedCategory(slug)

  if (!result?.data?.category) {
    return {
      title: "Catégorie non trouvée | DBS Store",
    }
  }

  const category = result.data.category

  return {
    title: `${category.name} | DBS Store`,
    description:
      category.description ||
      `Découvrez notre sélection de ${category.name.toLowerCase()} sur DBS Store`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params
  const search = await searchParams

  // Get category
  const categoryResult = await getCachedCategory(slug)

  if (!categoryResult?.data?.category) {
    notFound()
  }

  const category = categoryResult.data.category

  // Parse search params
  const filters = {
    categorySlug: slug,
    brand: search.brand || undefined,
    minPrice: search.minPrice ? parseInt(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? parseInt(search.maxPrice) : undefined,
    sort: (search.sort as SortOption) || "newest",
  }

  // Fetch data in parallel
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
      <div className="container py-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Accueil
          </Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            Produits
          </Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="relative mb-6 p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-gradient-to-br from-violet-100/50 via-fuchsia-50/30 to-white dark:from-purple-900/20 dark:via-blue-950/10 dark:to-transparent border border-purple-100/50 dark:border-purple-900/20 overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{category.name}</h1>
            {category.description && (
              <p className="mt-2 text-muted-foreground text-base leading-relaxed max-w-2xl">{category.description}</p>
            )}
          </div>

        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <ProductFiltersSidebar categories={categories} brands={brands} />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filters + Sort */}
            <div className="mb-6 flex items-center justify-between gap-4">
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
    </NuqsAdapter>
  )
}
