"use client";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart";
import type { Product } from "@/lib/db/schema";

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.stock === 0;
  return (
    <Button
      size="lg"
      className="flex-1 gap-2"
      disabled={isOutOfStock}
      onClick={() =>
        addItem({
          productId: product.id,
          variantId: null,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0] ?? "/images/products/placeholder.svg",
          colorName: null,
          colorHex: null,
        })
      }
    >
      <ShoppingCart className="size-4" />
      {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
    </Button>
  );
}
