"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PriceDisplayProps {
  price: number
  comparePrice?: number | null
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showBadge?: boolean
}

/**
 * Format price in XOF (CFA Franc)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(
  price: number,
  comparePrice: number
): number {
  if (comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function PriceDisplay({
  price,
  comparePrice,
  className,
  size = "md",
  showBadge = true,
}: PriceDisplayProps) {
  const hasDiscount = comparePrice && comparePrice > price
  const discountPercentage = hasDiscount
    ? calculateDiscount(price, comparePrice)
    : 0

  const sizeClasses = {
    sm: {
      price: "text-sm font-semibold",
      compare: "text-xs",
      badge: "text-xs",
    },
    md: {
      price: "text-lg font-semibold",
      compare: "text-sm",
      badge: "text-xs",
    },

    lg: {
      price: "text-2xl font-bold",
      compare: "text-base",
      badge: "text-sm",
    },
    xl: {
      price: "text-4xl lg:text-5xl font-bold font-display",
      compare: "text-lg",
      badge: "text-base",
    },
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className={cn("text-primary", sizeClasses[size].price)}>
        {formatPrice(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through",
              sizeClasses[size].compare
            )}
          >
            {formatPrice(comparePrice)}
          </span>

          {showBadge && discountPercentage > 0 && (
            <Badge
              variant="destructive"
              className={cn("font-medium", sizeClasses[size].badge)}
            >
              -{discountPercentage}%
            </Badge>
          )}
        </>
      )}
    </div>
  )
}
