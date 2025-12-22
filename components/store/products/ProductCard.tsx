"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2, ShoppingCart, Eye, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateDiscount } from "./PriceDisplay"
import { useCartStore } from "@/stores/cart-store"
import { useWishlist, useIsInWishlist } from "@/hooks/use-wishlist"
import { useUser } from "@/hooks/use-user"
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
  has_variants?: boolean | null
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
  const { user } = useUser()
  const { toggleWishlist } = useWishlist()
  const isInWishlist = useIsInWishlist(product.id)
  const [isWishlistLoading, setIsWishlistLoading] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)

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

  // Products with variants need variant selection on product page
  const hasVariants = product.has_variants === true

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasVariants) {
      window.location.href = `/products/${product.slug}`
      return
    }

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

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error("Connectez-vous pour gérer vos favoris")
      return
    }

    if (isWishlistLoading) return

    setIsWishlistLoading(true)
    await toggleWishlist({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compare_price: product.compare_price,
      image: imageUrl,
      stock_quantity: stockQuantity,
    })
    setIsWishlistLoading(false)
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
    <article
      className={cn(
        "group relative w-full",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            "relative bg-card rounded-2xl overflow-hidden",
            "border border-border/50",
            "transition-all duration-500 ease-out",
            "hover:border-primary/30 hover:shadow-card-hover",
            "hover:-translate-y-1"
          )}
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-muted/30">
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            <Image
              src={imageUrl}
              alt={primaryImage?.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-700",
                isHovered && "scale-110",
                isOutOfStock && "opacity-50 grayscale",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Hover Overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0",
                "transition-opacity duration-300",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Quick View Button - Appears on hover */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "transition-all duration-300",
                isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  "bg-white/90 backdrop-blur-sm text-foreground",
                  "font-medium text-sm",
                  "transform transition-all duration-300",
                  isHovered ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
                )}
              >
                <Eye className="w-4 h-4" />
                <span>Voir le produit</span>
              </div>
            </div>

            {/* Badges - Top Left */}
            <div className="absolute left-2 top-2 flex flex-col gap-1.5 z-10">
              {hasDiscount && (
                <Badge
                  className={cn(
                    "px-2 py-1 text-xs font-bold",
                    "bg-gradient-to-r from-red-500 to-rose-500 text-white",
                    "border-0 shadow-sm"
                  )}
                >
                  -{discountPercentage}%
                </Badge>
              )}
              {product.is_featured && !hasDiscount && (
                <Badge
                  className={cn(
                    "px-2 py-1 text-xs font-medium",
                    "bg-gradient-primary text-white",
                    "border-0 shadow-sm",
                    "flex items-center gap-1"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  Vedette
                </Badge>
              )}
              {isOutOfStock && (
                <Badge
                  variant="secondary"
                  className="px-2 py-1 text-xs font-medium bg-muted/90 backdrop-blur-sm"
                >
                  Rupture
                </Badge>
              )}
              {isLowStock && !isOutOfStock && (
                <Badge
                  className={cn(
                    "px-2 py-1 text-xs font-medium",
                    "bg-amber-500/90 text-white border-0"
                  )}
                >
                  Stock limité
                </Badge>
              )}
            </div>

            {/* Wishlist Button - Top Right */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-2 right-2 z-10",
                "h-9 w-9 rounded-full",
                "bg-white/80 backdrop-blur-sm",
                "hover:bg-white hover:scale-110",
                "transition-all duration-300",
                "shadow-sm",
                isInWishlist && "text-rose-500 bg-rose-50 hover:bg-rose-100"
              )}
              onClick={handleToggleWishlist}
              disabled={isWishlistLoading}
              aria-label={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              {isWishlistLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isInWishlist
                      ? "fill-rose-500 text-rose-500 scale-110"
                      : "text-muted-foreground hover:text-rose-500"
                  )}
                />
              )}
            </Button>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Category */}
            {product.category && (
              <p className="text-[11px] text-primary/80 font-medium uppercase tracking-wider mb-1">
                {product.category.name}
              </p>
            )}

            {/* Product Name */}
            <h3
              className={cn(
                "font-semibold text-sm leading-snug line-clamp-2 mb-3",
                "text-foreground/90 group-hover:text-foreground",
                "transition-colors duration-300"
              )}
            >
              {product.name}
            </h3>

            {/* Price Section */}
            <div className="flex items-end justify-between gap-2 mb-3">
              <div className="flex flex-col">
                {hasVariants && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    À partir de
                  </span>
                )}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p
                    className={cn(
                      "text-lg font-bold",
                      hasDiscount ? "text-rose-600" : "text-foreground"
                    )}
                  >
                    {formatPrice(product.price)}
                  </p>
                  {hasDiscount && product.compare_price && !hasVariants && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compare_price)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock && !hasVariants}
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 w-10 p-0 rounded-xl shrink-0",
                  "border-border/50 hover:border-primary/50",
                  "hover:bg-primary/5 hover:text-primary",
                  "transition-all duration-300",
                  "active:scale-95"
                )}
                aria-label="Ajouter au panier"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/products/${product.slug}`
                }}
                size="sm"
                className={cn(
                  "flex-1 h-10 rounded-xl font-semibold text-sm",
                  "bg-gradient-primary hover:opacity-90",
                  "shadow-soft hover:shadow-glow-sm",
                  "transition-all duration-300",
                  "active:scale-[0.98]",
                  isOutOfStock && !hasVariants && "opacity-50 cursor-not-allowed"
                )}
                disabled={isOutOfStock && !hasVariants}
              >
                {isOutOfStock && !hasVariants ? "Indisponible" : "Acheter"}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
