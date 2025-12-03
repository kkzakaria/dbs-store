"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EmptyCart } from "@/components/shared/EmptyState"
import { CartItem } from "@/components/store/cart/CartItem"
import { CartSummary } from "@/components/store/cart/CartSummary"
import { useCartStore, useCartHydration } from "@/stores/cart-store"

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const isHydrated = useCartHydration()

  const totalItems = getTotalItems()
  const hasItems = items.length > 0

  // Show skeleton while hydrating
  if (!isHydrated) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasItems) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="-ml-4">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuer vos achats
            </Link>
          </Button>
        </div>
        <EmptyCart className="py-16" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Back Link */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continuer vos achats
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">
          Votre Panier
          <span className="ml-2 text-muted-foreground font-normal text-lg">
            ({totalItems} {totalItems === 1 ? "article" : "articles"})
          </span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={clearCart}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Vider le panier
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card">
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.product.id} className="px-4 md:px-6">
                  <CartItem item={item} variant="page" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <CartSummary />
        </div>
      </div>
    </div>
  )
}
