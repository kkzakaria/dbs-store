"use client";
import { memo } from "react";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/lib/cart";

function formatPrice(p: number) {
  return p.toLocaleString("fr-FR");
}

export const CartItemRow = memo(function CartItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex gap-3 py-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted/50">
        <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="64px" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">{item.name}</p>
        <p className="text-sm font-bold">{formatPrice(item.price)} FCFA</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-6"
            onClick={() => useCartStore.getState().setQuantity(item.productId, item.quantity - 1)}
            aria-label="Diminuer la quantité"
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-5 text-center text-sm">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="size-6"
            onClick={() => useCartStore.getState().setQuantity(item.productId, item.quantity + 1)}
            aria-label="Augmenter la quantité"
          >
            <Plus className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-6 text-muted-foreground hover:text-destructive"
            onClick={() => useCartStore.getState().removeItem(item.productId)}
            aria-label="Supprimer"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});
