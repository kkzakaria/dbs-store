"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay, calculateDiscount } from "./PriceDisplay"
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

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-card-hover",
        className
      )}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
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
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="font-semibold">
                -{discountPercentage}%
              </Badge>
            )}
            {product.is_featured && !hasDiscount && (
              <Badge className="bg-accent text-accent-foreground font-semibold">
                Vedette
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="font-semibold">
                Rupture
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="outline" className="bg-background font-medium">
                Stock limité
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="icon-sm"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={handleAddToWishlist}
              aria-label="Ajouter aux favoris"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Add to Cart (hover) */}
          <div className="absolute inset-x-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="default"
              size="sm"
              className="w-full shadow-md"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isOutOfStock ? "Indisponible" : "Ajouter"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3">
          {/* Category */}
          {product.category && (
            <p className="mb-1 text-xs text-muted-foreground">
              {product.category.name}
            </p>
          )}

          {/* Name */}
          <h3 className="mb-1 line-clamp-2 text-sm font-medium leading-tight">
            {product.name}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="mb-2 text-xs text-muted-foreground">{product.brand}</p>
          )}

          {/* Price */}
          <PriceDisplay
            price={product.price}
            comparePrice={product.compare_price}
            size="sm"
            showBadge={false}
          />
        </CardContent>
      </Link>
    </Card>
  )
}
