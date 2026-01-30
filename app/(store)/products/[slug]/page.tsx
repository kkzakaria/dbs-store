import { cache } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getProductBySlug, getRelatedProducts } from "@/actions/products"

// Cache getProductBySlug to deduplicate between generateMetadata and page render
const getCachedProduct = cache(async (slug: string) => {
  return getProductBySlug({ slug })
})
import {
  ProductSpecifications,
  ProductCard,
} from "@/components/store/products"
import { ProductDetailClient } from "./ProductDetailClient"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getCachedProduct(slug)

  if (!result?.data?.product) {
    return {
      title: "Produit non trouvé | DBS Store",
    }
  }

  const product = result.data.product

  return {
    title: `${product.name} | DBS Store`,
    description:
      product.description?.substring(0, 160) ||
      `Achetez ${product.name} au meilleur prix sur DBS Store`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0]?.url
        ? [{ url: product.images[0].url }]
        : undefined,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const result = await getCachedProduct(slug)

  if (!result?.data?.product) {
    notFound()
  }

  const product = result.data.product

  // Fetch related products
  const relatedResult = product.category
    ? await getRelatedProducts({
        productId: product.id,
        categoryId: product.category.id,
        limit: 4,
      })
    : null

  const relatedProducts = relatedResult?.data?.products || []


  return (
    <div className="bg-white dark:bg-background min-h-screen">
      <div className="container-google py-12 md:py-24">
        {/* Breadcrumb */}
        <nav className="mb-20 flex items-center text-sm font-medium text-muted-foreground/60">
          <Link href="/" className="hover:text-primary transition-google">
            Accueil
          </Link>
          <ChevronRight className="mx-3 h-3 w-3" />
          <Link href="/products" className="hover:text-primary transition-google">
            Boutique
          </Link>
          {product.category && (
            <>
              <ChevronRight className="mx-3 h-3 w-3" />
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:text-primary transition-google"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="mx-3 h-3 w-3" />
          <span className="text-foreground font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>
 
        {/* Product Details - Client component for variant interaction */}
        <ProductDetailClient product={product} />
 
        {/* Specifications */}
        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <section className="mt-32 pt-24 border-t border-border/10">
              <h2 className="mb-16 text-4xl font-display font-bold text-foreground">
                Caractéristiques techniques
              </h2>
              <ProductSpecifications
                specifications={product.specifications as Record<string, unknown>}
                columns={2}
              />
            </section>
          )}
 
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-32 pt-24 border-t border-border/10">
            <div className="flex items-center justify-between mb-16">
              <h2 className="text-4xl font-display font-bold text-foreground">
                Découvrez aussi
              </h2>
              <Link
                href="/products"
                className="text-primary font-bold hover:underline transition-google flex items-center gap-2"
              >
                Tout voir <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
