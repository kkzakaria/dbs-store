"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyWishlist } from "@/components/shared/EmptyState"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { useWishlist } from "@/hooks/use-wishlist"
import { useUser } from "@/hooks/use-user"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "sonner"
import type { WishlistProduct } from "@/actions/wishlist"

function WishlistProductCard({
  product,
  onRemove,
}: {
  product: WishlistProduct
  onRemove: () => void
}) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartStore((state) => state.openCart)

  const isOutOfStock = product.stock_quantity <= 0
  const isLowStock =
    product.stock_quantity > 0 && product.stock_quantity <= 5
  const hasDiscount =
    product.compare_price && product.compare_price > product.price

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) {
      toast.error("Produit en rupture de stock")
      return
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
      stock_quantity: product.stock_quantity,
    })

    toast.success(`${product.name} ajouté au panier`, {
      action: {
        label: "Voir le panier",
        onClick: () => openCart(),
      },
    })
  }

  return (
    <Card className="group w-full py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
        <CardContent className="p-3">
          {/* Product Image */}
          <div className="relative mb-3">
            <div className="bg-muted rounded-xl h-[200px] md:h-[240px] relative overflow-hidden">
              <Image
                src={product.image || "/images/placeholder-product.png"}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-transform duration-300 group-hover:scale-105",
                  isOutOfStock && "opacity-50 grayscale"
                )}
              />

              {/* Badges */}
              <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                {hasDiscount && product.compare_price && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    -{Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}%
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Rupture
                  </Badge>
                )}
                {isLowStock && !isOutOfStock && (
                  <Badge variant="outline" className="bg-background text-xs px-1.5 py-0.5">
                    Stock limité
                  </Badge>
                )}
              </div>

              {/* Remove from Wishlist Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove()
                }}
                aria-label="Retirer des favoris"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-3">
            <h3 className="text-sm font-medium leading-tight line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-base font-bold text-primary">
                {formatPrice(product.price)}
              </p>
              {hasDiscount && product.compare_price && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compare_price)}
                </p>
              )}
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              size="sm"
              className="h-8"
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {isOutOfStock ? "Indisponible" : "Acheter"}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="w-full">
          <CardContent className="p-3">
            <Skeleton className="h-[200px] md:h-[240px] rounded-xl mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function WishlistPage() {
  const { user, isLoading: isUserLoading } = useUser()
  const { items, isLoading, isHydrated, removeFromWishlist } = useWishlist()

  // Show skeleton while loading
  if (isUserLoading || !isHydrated) {
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Mes Favoris</h1>
        </div>
        <WishlistSkeleton />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            Connectez-vous pour voir vos favoris
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Créez un compte ou connectez-vous pour sauvegarder vos produits préférés.
          </p>
          <Button asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
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
        <EmptyWishlist className="py-16" />
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">
          Mes Favoris
          <span className="ml-2 text-muted-foreground font-normal text-lg">
            ({items.length} {items.length === 1 ? "article" : "articles"})
          </span>
        </h1>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <WishlistSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product) => (
            <WishlistProductCard
              key={product.id}
              product={product}
              onRemove={() => removeFromWishlist(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
