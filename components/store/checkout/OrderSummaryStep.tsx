"use client"

import * as React from "react"
import Image from "next/image"
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Truck,
  Pencil,
  Loader2,
  Store as StoreIcon,
  Clock,
  Package,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { formatPhoneForDisplay } from "@/lib/validations/auth"
import type { DeliveryMethod } from "./ShippingStep"
import type { Address, ShippingZone, CartItem, Store } from "@/types"

interface OrderSummaryStepProps {
  cartItems: CartItem[]
  selectedAddress: Address
  selectedShippingZone: ShippingZone | null
  selectedStore: Store | null
  deliveryMethod: DeliveryMethod
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
  selectedStore,
  deliveryMethod,
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
  const isPickup = deliveryMethod === "pickup"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Récapitulatif de la commande</h2>
        <p className="text-sm text-muted-foreground">
          Vérifiez les détails avant de confirmer
        </p>
      </div>

      {/* Contact/Address */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {isPickup ? "Contact" : "Livraison"}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditAddress}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="text-sm space-y-0.5">
          <p className="font-medium">{selectedAddress.full_name}</p>
          <p className="text-muted-foreground">
            {formatPhoneForDisplay(selectedAddress.phone)}
          </p>
          {!isPickup && (
            <p className="text-muted-foreground">
              {selectedAddress.address_line}, {selectedAddress.city}
              {selectedAddress.commune && `, ${selectedAddress.commune}`}
            </p>
          )}
        </div>
      </div>

      {/* Delivery/Pickup Method */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isPickup ? (
              <StoreIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Truck className="h-4 w-4 text-muted-foreground" />
            )}
            {isPickup ? "Retrait" : "Livraison"}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditShipping}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="text-sm">
          {isPickup && selectedStore ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{selectedStore.name}</p>
                <Badge variant="secondary" className="text-green-600 text-xs">
                  Gratuit
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {selectedStore.address}, {selectedStore.commune}
              </p>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                <span>{selectedStore.hours}</span>
              </div>
            </div>
          ) : selectedShippingZone ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedShippingZone.name}</p>
                {selectedShippingZone.estimated_days && (
                  <p className="text-muted-foreground text-xs">
                    {selectedShippingZone.estimated_days}
                  </p>
                )}
              </div>
              {freeShipping ? (
                <Badge variant="secondary" className="text-green-600 text-xs">
                  Gratuit
                </Badge>
              ) : (
                <span className="font-medium">{formatPrice(shippingFee)}</span>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Zone non disponible</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center gap-2 text-sm font-medium mb-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          Articles ({totalItems})
        </div>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.product.id} className="flex gap-3">
              {/* Product image */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
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
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.product.price)} × {item.quantity}
                </p>
              </div>

              {/* Line total */}
              <p className="text-sm font-medium shrink-0">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Totals */}
      <div className="rounded-lg border p-3 space-y-2">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Promo discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>
              Réduction{" "}
              {promoCode && <span className="text-xs">({promoCode})</span>}
            </span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {isPickup ? "Retrait" : "Livraison"}
          </span>
          <span>
            {shippingFee === 0 ? (
              <span className="text-green-600">Gratuit</span>
            ) : (
              formatPrice(shippingFee)
            )}
          </span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary text-lg">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPlacingOrder}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button
          onClick={onPlaceOrder}
          disabled={isPlacingOrder}
          className="flex-1"
        >
          {isPlacingOrder ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Payer
        </Button>
      </div>
    </div>
  )
}
