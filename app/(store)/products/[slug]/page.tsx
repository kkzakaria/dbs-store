import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Shield, Truck, RotateCcw } from "lucide-react"
import { getProductBySlug, getRelatedProducts } from "@/actions/products"
import {
  ProductGallery,
  ProductGalleryHorizontal,
  PriceDisplay,
  ProductSpecifications,
  ProductCard,
} from "@/components/store/products"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddToCartButton } from "./AddToCartButton"

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

  // Stock status
  const stockQuantity = product.stock_quantity ?? 0
  const isOutOfStock = stockQuantity <= 0
  const isLowStock =
    stockQuantity > 0 &&
    stockQuantity <= (product.low_stock_threshold || 5)

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

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery - Desktop: vertical thumbnails, Mobile: horizontal */}
        <div className="hidden md:block">
          <ProductGallery
            images={product.images || []}
            productName={product.name}
          />
        </div>
        <div className="md:hidden">
          <ProductGalleryHorizontal
            images={product.images || []}
            productName={product.name}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category Link */}
          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-muted-foreground hover:text-primary transition-colors text-sm inline-block"
            >
              {product.category.name}
            </Link>
          )}

          {/* Name */}
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {product.name}
          </h1>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <PriceDisplay
              price={product.price}
              comparePrice={product.compare_price}
              size="lg"
            />
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <Badge variant="destructive">Rupture de stock</Badge>
            ) : isLowStock ? (
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                Plus que {stockQuantity} en stock - Faites vite !
              </Badge>
            ) : (
              <Badge variant="outline" className="border-green-500 text-green-500">
                En stock
              </Badge>
            )}
            {product.brand && (
              <Badge variant="secondary">{product.brand}</Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-accent text-accent-foreground">Vedette</Badge>
            )}
          </div>

          <Separator />

          {/* Add to Cart */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              slug: product.slug,
              image: product.images?.[0]?.url || "/images/placeholder-product.png",
              stock_quantity: stockQuantity,
            }}
            isOutOfStock={isOutOfStock}
          />

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Truck className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Livraison rapide</p>
                <p className="text-muted-foreground text-xs">24-48h Abidjan</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Paiement sécurisé</p>
                <p className="text-muted-foreground text-xs">Mobile Money</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <RotateCcw className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Retour facile</p>
                <p className="text-muted-foreground text-xs">Sous 7 jours</p>
              </div>
            </div>
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-xs text-muted-foreground pt-2">
              Référence: {product.sku}
            </p>
          )}
        </div>
      </div>

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
