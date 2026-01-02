"use client"

import { useState, useTransition, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProductCard } from "./ProductCard"
import { ProductGridSkeleton } from "@/components/shared/Loading"
import { NoSearchResults } from "@/components/shared/EmptyState"
import { getProducts } from "@/actions/products"
import type { Tables } from "@/types/database.types"

type Product = Tables<"products"> & {
  category?: { id: string; name: string; slug: string } | null
  images?: Array<{
    id: string
    url: string
    alt: string | null
    position: number | null
    is_primary: boolean | null
  }> | null
}

interface ProductGridProps {
  initialProducts: Product[]
  initialTotal: number
  filters?: {
    categorySlug?: string
    brand?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
    search?: string
  }
  className?: string
}

const PRODUCTS_PER_PAGE = 12

export function ProductGrid({
  initialProducts,
  initialTotal,
  filters = {},
  className,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const hasMore = products.length < total

  const loadMore = useCallback(() => {
    startTransition(async () => {
      const nextPage = page + 1

      const result = await getProducts({
        ...filters,
        page: nextPage,
        limit: PRODUCTS_PER_PAGE,
        sort: (filters.sort as any) || "newest",
      })

      const data = result?.data
      if (data?.products) {
        setProducts((prev) => [...prev, ...data.products])
        setTotal(data.total)
        setPage(nextPage)
      }
    })
  }, [page, filters])

  if (products.length === 0) {
    return (
      <NoSearchResults
        query={filters.search || "ces critères"}
        className="py-12"
      />
    )
  }

  return (

    <div className={cn("space-y-12 md:space-y-16", className)}>
      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:gap-8">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={isPending}
            className="h-14 px-10 rounded-full border-border hover:bg-secondary text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                Afficher plus de produits
              </>
            )}
          </Button>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && products.length > PRODUCTS_PER_PAGE && (
        <p className="text-center text-sm text-muted-foreground">
          Vous avez vu tous les {total} produits
        </p>
      )}
    </div>
  )
}

// Server-side initial loader component
export function ProductGridLoader() {
  return <ProductGridSkeleton count={12} />
}
