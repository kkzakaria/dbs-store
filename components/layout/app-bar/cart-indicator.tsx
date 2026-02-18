import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

type CartIndicatorProps = {
  count: number;
};

export function CartIndicator({ count }: CartIndicatorProps) {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/panier" aria-label="Panier" className="relative">
        <ShoppingCart className="size-5" />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
