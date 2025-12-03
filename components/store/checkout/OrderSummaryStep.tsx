"use client"

import * as React from "react"
import Image from "next/image"
import { ArrowLeft, CreditCard, MapPin, Truck, Pencil, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { formatPhoneForDisplay } from "@/lib/validations/auth"
import type { Address, ShippingZone, CartItem } from "@/types"

interface OrderSummaryStepProps {
  cartItems: CartItem[]
  selectedAddress: Address
  selectedShippingZone: ShippingZone
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  promoCode: string | null
  freeShipping: boolean
  onBack: () => void
  onEditAddress: () => void
  onEditShipping: () => void
  onPlaceOrder: () => void
  isPlacingOrder?: boolean
}

export function OrderSummaryStep({
  cartItems,
  selectedAddress,
  selectedShippingZone,
  subtotal,
  discount,
  shippingFee,
  total,
  promoCode,
  freeShipping,
  onBack,
  onEditAddress,
  onEditShipping,
  onPlaceOrder,
  isPlacingOrder = false,
}: OrderSummaryStepProps) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Récapitulatif de la commande</h2>
        <p className="text-sm text-muted-foreground">
          Vérifiez les détails avant de confirmer
        </p>
      </div>

      {/* Delivery Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Adresse de livraison
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEditAddress}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Button>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium">{selectedAddress.full_name}</p>
          <p className="text-muted-foreground">
            {formatPhoneForDisplay(selectedAddress.phone)}
          </p>
          <p className="text-muted-foreground mt-1">
            {selectedAddress.address_line}
          </p>
          <p className="text-muted-foreground">
            {selectedAddress.city}
            {selectedAddress.commune && `, ${selectedAddress.commune}`}
          </p>
          {selectedAddress.landmark && (
            <p className="text-muted-foreground text-xs italic mt-1">
              Repère: {selectedAddress.landmark}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shipping Method */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Mode de livraison
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEditShipping}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Button>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedShippingZone.name}</p>
              {selectedShippingZone.estimated_days && (
                <p className="text-muted-foreground">
                  Livraison en {selectedShippingZone.estimated_days}
                </p>
              )}
            </div>
            <div className="text-right">
              {freeShipping ? (
                <Badge variant="secondary" className="text-green-600">
                  Gratuit
                </Badge>
              ) : (
                <p className="font-medium">{formatPrice(shippingFee)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Articles ({totalItems})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex gap-4">
                {/* Product image */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      Img
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.product.price)} × {item.quantity}
                  </p>
                </div>

                {/* Line total */}
                <p className="font-medium shrink-0">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Totals */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {/* Promo discount */}
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>
                Réduction {promoCode && <span className="text-xs">({promoCode})</span>}
              </span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span>
              {freeShipping ? (
                <span className="text-green-600">Gratuite</span>
              ) : (
                formatPrice(shippingFee)
              )}
            </span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex flex-col gap-4 pt-4">
        <Button
          onClick={onPlaceOrder}
          disabled={isPlacingOrder}
          size="lg"
          className="w-full"
        >
          {isPlacingOrder ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Procéder au paiement
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPlacingOrder}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    </div>
  )
}
