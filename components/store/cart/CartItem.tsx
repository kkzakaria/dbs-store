"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import type { CartItem as CartItemType } from "@/types"
import { useCartStore } from "@/stores/cart-store"

interface CartItemProps {
  item: CartItemType
  variant?: "sheet" | "page"
  className?: string
}

export function CartItem({ item, variant = "sheet", className }: CartItemProps) {
  const { product, quantity } = item
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const closeCart = useCartStore((state) => state.closeCart)

  const isLowStock = product.stock_quantity <= 5 && product.stock_quantity > 0
  const isOverStock = quantity > product.stock_quantity
  const lineTotal = product.price * quantity

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(product.id)
    } else {
      updateQuantity(product.id, newQuantity)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      handleQuantityChange(value)
    }
  }

  const isPageVariant = variant === "page"

  return (
    <div
      className={cn(
        "flex gap-3",
        isPageVariant && "gap-4 py-6",
        className
      )}
    >
      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        onClick={() => closeCart()}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-muted",
          isPageVariant ? "h-24 w-24" : "h-20 w-20"
        )}
      >
        <Image
          src={product.image || "/images/placeholder-product.png"}
          alt={product.name}
          fill
          className="object-cover"
          sizes={isPageVariant ? "96px" : "80px"}
        />
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-2">
          <div className="space-y-1">
            <Link
              href={`/products/${product.slug}`}
              onClick={() => closeCart()}
              className={cn(
                "font-medium hover:text-primary transition-colors line-clamp-2",
                isPageVariant ? "text-base" : "text-sm"
              )}
            >
              {product.name}
            </Link>
            <p className={cn(
              "text-muted-foreground",
              isPageVariant ? "text-sm" : "text-xs"
            )}>
              {formatPrice(product.price)} / unité
            </p>
          </div>

          {/* Remove Button - Sheet variant */}
          {!isPageVariant && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(product.id)}
              aria-label="Supprimer l'article"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Stock Warning */}
        {(isOverStock || isLowStock) && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverStock ? "text-destructive" : "text-amber-600"
          )}>
            <AlertTriangle className="h-3 w-3" />
            <span>
              {isOverStock
                ? `Seulement ${product.stock_quantity} en stock`
                : `Plus que ${product.stock_quantity} en stock`}
            </span>
          </div>
        )}

        {/* Quantity Controls & Total */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "shrink-0",
                isPageVariant ? "h-9 w-9" : "h-7 w-7"
              )}
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Diminuer la quantité"
            >
              <Minus className={isPageVariant ? "h-4 w-4" : "h-3 w-3"} />
            </Button>
            <Input
              type="number"
              min="1"
              max={product.stock_quantity}
              value={quantity}
              onChange={handleInputChange}
              className={cn(
                "text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                isPageVariant ? "h-9 w-14" : "h-7 w-12 text-sm"
              )}
              aria-label="Quantité"
            />
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "shrink-0",
                isPageVariant ? "h-9 w-9" : "h-7 w-7"
              )}
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock_quantity}
              aria-label="Augmenter la quantité"
            >
              <Plus className={isPageVariant ? "h-4 w-4" : "h-3 w-3"} />
            </Button>
          </div>

          {/* Line Total */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-primary",
              isPageVariant ? "text-base" : "text-sm"
            )}>
              {formatPrice(lineTotal)}
            </span>

            {/* Remove Button - Page variant */}
            {isPageVariant && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(product.id)}
                aria-label="Supprimer l'article"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
