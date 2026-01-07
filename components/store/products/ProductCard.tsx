"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2, ShoppingCart, Eye, Sparkles, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateDiscount } from "./PriceDisplay"
import { useCartStore } from "@/stores/cart-store"
import { useWishlist, useIsInWishlist } from "@/hooks/use-wishlist"
import { useUser } from "@/hooks/use-user"
import { toast } from "sonner"
import type { Tables } from "@/types/database.types"

export type Product = Tables<"products"> & {
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
        "group relative w-full h-full transition-all duration-500 ease-in-out",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col h-full bg-white dark:bg-card border border-border/40 rounded-2xl sm:rounded-[32px] overflow-hidden transition-all duration-300 hover:border-border/80">
        {/* Image Container with Floating Effect */}
        <div 
          className={cn(
            "relative aspect-square overflow-hidden bg-[#f8f9fa] dark:bg-muted/10 rounded-xl sm:rounded-[24px]",
            "transition-all duration-500 ease-out",
            isHovered && "shadow-google-md"
          )}
        >
          {/* Status Badges - Subtle Pills */}
          <div className="absolute left-3 top-3 sm:left-8 sm:top-8 flex flex-col gap-1.5 sm:gap-2 z-10">
            {hasDiscount && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold bg-[#e6f4ea] text-[#137333] dark:bg-green-500/20 dark:text-green-400 rounded-full uppercase tracking-wider">
                Offre
              </span>
            )}
            {product.is_featured && !hasDiscount && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-500/20 dark:text-blue-400 rounded-full uppercase tracking-wider">
                Nouveau
              </span>
            )}
          </div>
 
          {/* Wishlist Button - Minimalist Overlay */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 right-3 sm:top-8 sm:right-8 z-20",
              "h-8 w-8 sm:h-12 sm:w-12 rounded-full",
              "bg-white/60 dark:bg-black/20 backdrop-blur-md",
              "hover:bg-white dark:hover:bg-black/40 transition-all",
              "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
              isInWishlist && "opacity-100 text-rose-500"
            )}
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading}
          >
            {isWishlistLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Heart
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5",
                  isInWishlist ? "fill-rose-500 text-rose-500" : "text-foreground"
                )}
              />
            )}
          </Button>
 
          {/* Main Product Image */}
          <div className="relative w-full h-full p-4 sm:p-10">
            <Image
              src={imageUrl}
              alt={primaryImage?.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-contain transition-transform duration-700 ease-in-out",
                isHovered && "scale-105",
                isOutOfStock && "opacity-50 grayscale",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              priority={priority}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
 
        {/* Content Section - Clean & Typography Focused */}
        <div className="flex flex-col px-4 sm:px-8 pt-4 sm:pt-8 pb-4 sm:pb-8 flex-grow">
          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
            <h3 className="font-display font-medium text-sm sm:text-xl text-foreground line-clamp-2 transition-colors duration-300 leading-tight">
              {product.name}
            </h3>
            {product.category && (
              <p className="text-[9px] sm:text-[11px] text-muted-foreground uppercase tracking-widest leading-none">
                {product.category.name}
              </p>
            )}
          </div>
 
          <div className="mt-auto space-y-3 sm:space-y-4">
            {/* Price Row */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-3">
              <span className="text-base sm:text-lg font-medium text-foreground">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && product.compare_price && (
                <span className="text-[11px] sm:text-sm text-muted-foreground line-through opacity-60">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </div>
            
            {hasDiscount && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#e6f4ea] dark:bg-green-500/10 text-[#137333] dark:text-green-400 text-[9px] sm:text-[11px] font-bold">
                -{discountPercentage}%
              </div>
            )}
 
            {/* Minimalist Action Link */}
            <div className="pt-1 sm:pt-2">
              <span
                className={cn(
                  "inline-flex items-center text-[#1a73e8] dark:text-[#8ab4f8] font-bold text-xs sm:text-sm tracking-wide group-hover:underline",
                  isOutOfStock && "text-muted-foreground"
                )}
              >
                {isOutOfStock ? "Détails" : "Acheter"}
                <ChevronRight className="ml-1 size-3 sm:size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
