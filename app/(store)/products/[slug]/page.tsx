import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getProductBySlug, getRelatedProducts } from "@/actions/products"
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
  const result = await getProductBySlug({ slug })

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
  const result = await getProductBySlug({ slug })

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
    <div className="container py-6 lg:py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Accueil
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href="/products" className="hover:text-foreground transition-colors">
          Produits
        </Link>
        {product.category && (
          <>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Product Details - Client component for variant interaction */}
      <ProductDetailClient product={product} />

      {/* Specifications */}
      {product.specifications &&
        Object.keys(product.specifications).length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-semibold">Caractéristiques</h2>
            <ProductSpecifications
              specifications={product.specifications as Record<string, unknown>}
              columns={2}
            />
          </section>
        )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-semibold">Produits similaires</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {relatedProducts.map((relatedProduct: any) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
