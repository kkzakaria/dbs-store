"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateDiscount } from "./PriceDisplay"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "sonner"
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

interface ProductCardProps {
  product: Product
  className?: string
  priority?: boolean
}

export function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  // Get primary image or first image
  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0]
  const imageUrl = primaryImage?.url || "/images/placeholder-product.png"

  // Check if product has discount
  const hasDiscount =
    product.compare_price && product.compare_price > product.price
  const discountPercentage = hasDiscount
    ? calculateDiscount(product.price, product.compare_price!)
    : 0

  // Check stock status
  const stockQuantity = product.stock_quantity ?? 0
  const isOutOfStock = stockQuantity <= 0
  const isLowStock =
    stockQuantity > 0 &&
    stockQuantity <= (product.low_stock_threshold || 5)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error("Produit en rupture de stock")
      return
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imageUrl,
      slug: product.slug,
      stock_quantity: stockQuantity,
    })

    toast.success(`${product.name} ajouté au panier`)
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toast.info("Fonctionnalité bientôt disponible")
  }

  // Format price in XOF
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-CI", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className={cn("w-full py-0", className)}>
      <Link href={`/products/${product.slug}`} className="block">
        <CardContent className="p-3">
          {/* Product Image */}
          <div className="relative mb-3">
            <div className="bg-muted rounded-xl h-[280px] relative overflow-hidden">
              <Image
                src={imageUrl}
                alt={primaryImage?.alt || product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-transform duration-300 group-hover:scale-105",
                  isOutOfStock && "opacity-50 grayscale"
                )}
                priority={priority}
              />

              {/* Badges */}
              <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                {hasDiscount && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    -{discountPercentage}%
                  </Badge>
                )}
                {product.is_featured && !hasDiscount && (
                  <Badge className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5">
                    Vedette
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Rupture
                  </Badge>
                )}
                {isLowStock && !isOutOfStock && (
                  <Badge variant="outline" className="bg-background text-xs px-1.5 py-0.5">
                    Stock limité
                  </Badge>
                )}
              </div>

              {/* Wishlist Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7"
                onClick={handleAddToWishlist}
                aria-label="Ajouter aux favoris"
              >
                <Heart className="w-4 h-4 text-foreground hover:text-red-500 transition-colors" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-2">
            {product.category && (
              <p className="text-[10px] text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <h3 className="text-sm font-medium leading-tight line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-base font-bold">{formatPrice(product.price)}</p>
              {hasDiscount && product.compare_price && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compare_price)}
                </p>
              )}
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              size="sm"
              className="h-7 px-2 text-xs"
            >
              {isOutOfStock ? "Indisponible" : "Acheter"}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
