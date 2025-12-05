"use client"

import { useState } from "react"
import { Heart, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "sonner"

interface ProductVariant {
  id: string
  sku: string
  price: number
  stock_quantity: number
  options: Record<string, string>
}

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    slug: string
    image: string
    stock_quantity: number
  }
  variant?: ProductVariant | null
  isOutOfStock: boolean
  requiresVariant?: boolean
}

export function AddToCartButton({
  product,
  variant,
  isOutOfStock,
  requiresVariant = false,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  // Use variant stock if available, otherwise product stock
  const effectiveStock = variant?.stock_quantity ?? product.stock_quantity

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(effectiveStock, prev + 1))
  }

  const handleAddToCart = () => {
    if (requiresVariant) {
      toast.error("Veuillez sélectionner une variante")
      return
    }

    if (isOutOfStock) {
      toast.error("Produit en rupture de stock")
      return
    }

    addItem(
      {
        id: product.id,
        name: product.name,
        price: variant?.price ?? product.price,
        image: product.image,
        slug: product.slug,
        stock_quantity: effectiveStock,
        variant_id: variant?.id ?? null,
        variant_options: variant?.options ?? null,
        variant_sku: variant?.sku ?? null,
      },
      quantity
    )

    // Build variant description for toast
    const variantDesc = variant?.options
      ? ` (${Object.values(variant.options).join(" / ")})`
      : ""
    toast.success(`${product.name}${variantDesc} ajouté au panier`)
  }

  const isDisabled = isOutOfStock || requiresVariant

  const handleAddToWishlist = () => {
    toast.info("Fonctionnalité bientôt disponible")
  }

  // Determine button text
  const getButtonText = () => {
    if (requiresVariant) return "Sélectionnez une option"
    if (isOutOfStock) return "Indisponible"
    return "Ajouter au panier"
  }

  return (
    <div className="flex items-center gap-4">
      {/* Quantity Selector */}
      <div className="flex items-center border border-input rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg"
          onClick={decreaseQuantity}
          disabled={quantity <= 1 || isDisabled}
          aria-label="Diminuer la quantité"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg"
          onClick={increaseQuantity}
          disabled={quantity >= effectiveStock || isDisabled}
          aria-label="Augmenter la quantité"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        onClick={handleAddToCart}
        disabled={isDisabled}
        className="flex-1 sm:flex-none"
      >
        {getButtonText()}
      </Button>

      {/* Wishlist Button */}
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-lg"
        onClick={handleAddToWishlist}
        aria-label="Ajouter aux favoris"
      >
        <Heart className="w-4 h-4" />
      </Button>
    </div>
  )
}
