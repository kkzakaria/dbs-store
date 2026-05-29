"use client";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart";
import type { Product, ProductVariant } from "@/lib/db/schema";

type Props = {
  product: Product;
  variant: ProductVariant | null;
};

export function AddToCartButton({ product, variant }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const effectiveStock = variant !== null ? variant.stock : product.stock;
  const isOutOfStock = effectiveStock === 0;
  const effectivePrice = variant?.price_override ?? product.price;

  return (
    <Button
      size="lg"
      className="flex-1 gap-2"
      disabled={isOutOfStock}
      onClick={() =>
        addItem({
          productId: product.id,
          variantId: variant?.id ?? null,
          slug: product.slug,
          name: product.name,
          price: effectivePrice,
          image: product.images[0] ?? "/images/products/placeholder.svg",
          colorName: variant?.color_name ?? null,
          colorHex: variant?.color_hex ?? null,
        })
      }
    >
      <ShoppingCart className="size-4" />
      {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
    </Button>
  );
}
