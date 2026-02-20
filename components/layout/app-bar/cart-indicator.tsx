"use client";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart";

type Props = { onClick: () => void };

export function CartIndicator({ onClick }: Props) {
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  return (
    <Button variant="ghost" size="icon" onClick={onClick} aria-label="Panier" className="relative">
      <ShoppingCart className="size-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Button>
  );
}
