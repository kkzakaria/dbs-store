"use client"

import { useState } from "react"
import { Heart, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "sonner"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    slug: string
    image: string
    stock_quantity: number
  }
  isOutOfStock: boolean
}

export function AddToCartButton({ product, isOutOfStock }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(product.stock_quantity, prev + 1))
  }

  const handleAddToCart = () => {
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
    }, quantity)

    toast.success(`${product.name} ajouté au panier`)
  }

  const handleAddToWishlist = () => {
    toast.info("Fonctionnalité bientôt disponible")
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
          disabled={quantity <= 1 || isOutOfStock}
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
          disabled={quantity >= product.stock_quantity || isOutOfStock}
          aria-label="Augmenter la quantité"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
      >
        {isOutOfStock ? "Indisponible" : "Ajouter au panier"}
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
