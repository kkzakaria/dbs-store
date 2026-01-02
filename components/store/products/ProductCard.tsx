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
        "group relative w-full transition-google hover-google-rise",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block h-full">
        <div
          className={cn(
            "relative h-full bg-white dark:bg-card rounded-3xl overflow-hidden",
            "border border-border/40 shadow-google-sm",
            "transition-all duration-300"
          )}
        >
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-[#f8f9fa] dark:bg-muted/10 p-6">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary animate-pulse" />
            )}

            <Image
              src={imageUrl}
              alt={primaryImage?.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-contain p-4 transition-all duration-700",
                isHovered && "scale-105",
                isOutOfStock && "opacity-50 grayscale",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Badges - Top Left */}
            <div className="absolute left-4 top-4 flex flex-col gap-2 z-10">
              {hasDiscount && (
                <span className="px-2.5 py-1 text-[11px] font-bold bg-primary text-white rounded-full shadow-google-sm">
                  -{discountPercentage}%
                </span>
              )}
              {product.is_featured && !hasDiscount && (
                <span className="px-2.5 py-1 text-[11px] font-bold bg-secondary text-foreground rounded-full shadow-google-sm">
                  Vedette
                </span>
              )}
            </div>

            {/* Wishlist Button - Top Right */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-3 right-3 z-10",
                "h-10 w-10 rounded-full",
                "bg-white/80 dark:bg-black/20 backdrop-blur-md",
                "hover:bg-white dark:hover:bg-black/40",
                "transition-all duration-300",
                isInWishlist && "text-rose-500"
              )}
              onClick={handleToggleWishlist}
              disabled={isWishlistLoading}
            >
              {isWishlistLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isInWishlist ? "fill-rose-500 text-rose-500" : "text-foreground"
                  )}
                />
              )}
            </Button>
          </div>

          {/* Product Info */}
          <div className="p-6 flex flex-col flex-1">
            <div className="flex-1 min-h-[4rem]">
              <h3 className="font-display font-semibold text-base md:text-lg leading-tight text-foreground line-clamp-2 mb-2">
                {product.name}
              </h3>
              {product.category && (
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {product.category.name}
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="mt-4 flex flex-col">
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-lg font-bold",
                  hasDiscount ? "text-primary" : "text-foreground"
                )}>
                  {formatPrice(product.price)}
                </p>
                {hasDiscount && product.compare_price && (
                  <p className="text-sm text-muted-foreground line-through decoration-muted-foreground">
                    {formatPrice(product.compare_price)}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/products/${product.slug}`
                }}
                className="flex-1 rounded-full h-11 font-semibold text-sm bg-primary hover:bg-primary-hover text-white transition-google shadow-google-sm hover:shadow-google-md"
                disabled={isOutOfStock && !hasVariants}
              >
                {isOutOfStock && !hasVariants ? "Bientôt disponible" : "Acheter"}
              </Button>
              
              {!hasVariants && !isOutOfStock && (
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-border hover:bg-secondary transition-google shrink-0"
                  aria-label="Ajouter au panier"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
