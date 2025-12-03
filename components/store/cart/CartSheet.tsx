"use client"

import * as React from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyCart } from "@/components/shared/EmptyState"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { CartItem } from "./CartItem"
import { useCartStore, useCartHydration } from "@/stores/cart-store"

export function CartSheet() {
  const isOpen = useCartStore((state) => state.isOpen)
  const closeCart = useCartStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const getSubtotal = useCartStore((state) => state.getSubtotal)

  // Hydrate cart store on mount
  useCartHydration()

  const totalItems = getTotalItems()
  const subtotal = getSubtotal()
  const hasItems = items.length > 0

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="space-y-2.5">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShoppingBag className="h-5 w-5" />
              Votre Panier
              {totalItems > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalItems} {totalItems === 1 ? "article" : "articles"}
                </Badge>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Gérez les articles de votre panier
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {hasItems ? (
          <>
            {/* Cart Items - Scrollable */}
            <ScrollArea className="flex-1">
              <div className="space-y-3 pl-2 pr-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-lg border bg-card p-3"
                  >
                    <CartItem
                      item={item}
                      variant="sheet"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Footer with Subtotal & Actions */}
            <SheetFooter className="flex-col gap-4 sm:flex-col">
              {/* Subtotal */}
              <div className="flex items-center justify-between w-full">
                <span className="text-base font-medium">Sous-total</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Frais de livraison calculés à l&apos;étape suivante
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full">
                <Button asChild size="lg" className="w-full">
                  <Link href="/checkout" onClick={() => closeCart()}>
                    Commander
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Link href="/cart" onClick={() => closeCart()}>
                    Voir le panier
                  </Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyCart className="py-8" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
