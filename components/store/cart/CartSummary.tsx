"use client"

import * as React from "react"
import Link from "next/link"
import { ShieldCheck, Truck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { PromoCodeInput } from "./PromoCodeInput"
import { useCartStore } from "@/stores/cart-store"
import type { PromoValidationResult } from "@/actions/promotions"

interface CartSummaryProps {
  className?: string
}

export function CartSummary({ className }: CartSummaryProps) {
  const items = useCartStore((state) => state.items)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const getTotalItems = useCartStore((state) => state.getTotalItems)

  const [appliedPromo, setAppliedPromo] = React.useState<PromoValidationResult | null>(null)

  const subtotal = getSubtotal()
  const totalItems = getTotalItems()
  const discount = appliedPromo?.valid ? (appliedPromo.discount || 0) : 0
  const freeShipping = appliedPromo?.valid && appliedPromo.freeShipping
  const total = subtotal - discount

  const handlePromoApplied = (result: PromoValidationResult) => {
    setAppliedPromo(result.valid ? result : null)
  }

  // Build checkout URL with promo code if applied
  const checkoutUrl = appliedPromo?.valid && appliedPromo.promo
    ? `/checkout?promo=${encodeURIComponent(appliedPromo.promo.code)}`
    : "/checkout"

  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Résumé de la commande</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Sous-total ({totalItems} {totalItems === 1 ? "article" : "articles"})
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Promo Code Input */}
        <PromoCodeInput
          cartTotal={subtotal}
          onPromoApplied={handlePromoApplied}
        />

        {/* Discount (if promo applied) */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>Réduction</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Free Shipping Badge */}
        {freeShipping && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Truck className="h-4 w-4" />
            <span>Livraison gratuite appliquée</span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Livraison</span>
          <span className="text-muted-foreground text-xs">
            {freeShipping ? (
              <span className="text-green-600 font-medium">Gratuite</span>
            ) : (
              "Calculée à l'étape suivante"
            )}
          </span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between font-medium">
          <span>Total estimé</span>
          <span className="text-lg text-primary">{formatPrice(total)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-4">
        <Button asChild size="lg" className="w-full">
          <Link href={checkoutUrl}>
            Passer la commande
          </Link>
        </Button>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>Livraison rapide</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
