"use client"

import * as React from "react"
import Image from "next/image"
import { ShieldCheck, Truck, Tag } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import type { CartItem } from "@/types"
import type { CheckoutStep } from "./CheckoutStepper"

interface CheckoutSummaryProps {
  cartItems: CartItem[]
  subtotal: number
  discount: number
  shippingFee: number | null // null = "À calculer"
  total: number
  promoCode: string | null
  freeShipping: boolean
  step: CheckoutStep
  className?: string
}

export function CheckoutSummary({
  cartItems,
  subtotal,
  discount,
  shippingFee,
  total,
  promoCode,
  freeShipping,
  step,
  className,
}: CheckoutSummaryProps) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Récapitulatif</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cart items (scrollable) */}
        <ScrollArea className="max-h-48">
          <div className="space-y-3 pr-4">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                {/* Product image */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      Img
                    </div>
                  )}
                  {/* Quantity badge */}
                  <Badge
                    variant="secondary"
                    className="absolute -right-2 -top-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {item.quantity}
                  </Badge>
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                {/* Line total */}
                <p className="text-sm font-medium shrink-0">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Sous-total ({totalItems} {totalItems === 1 ? "article" : "articles"})
            </span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {/* Promo code badge */}
          {promoCode && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Tag className="h-3.5 w-3.5" />
              <span>Code: {promoCode}</span>
            </div>
          )}

          {/* Discount */}
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Réduction</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}

          {/* Free shipping badge */}
          {freeShipping && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Truck className="h-3.5 w-3.5" />
              <span>Livraison gratuite incluse</span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-muted-foreground">
              {freeShipping ? (
                <span className="text-green-600 font-medium">Gratuite</span>
              ) : shippingFee !== null ? (
                formatPrice(shippingFee)
              ) : (
                <span className="text-xs">À calculer</span>
              )}
            </span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between font-medium">
          <span>Total</span>
          <span className="text-lg text-primary">{formatPrice(total)}</span>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>Livraison rapide</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
