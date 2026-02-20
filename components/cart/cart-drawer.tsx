"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/cart";
import { CartItemRow } from "./cart-item-row";

function formatPrice(p: number) {
  return p.toLocaleString("fr-FR");
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function CartDrawer({ open, onOpenChange }: Props) {
  const { items, total, count } = useCartStore();
  const itemCount = count();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Panier{itemCount > 0 ? ` (${itemCount})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingCart className="size-12 text-muted-foreground" />
            <p className="font-medium">Votre panier est vide</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez des produits pour commencer vos achats.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Continuer les achats
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y overflow-y-auto">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>
            <SheetFooter className="flex-col gap-3 pt-4">
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-bold">{formatPrice(total())} FCFA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Livraison et taxes calculées au moment du paiement.
              </p>
              <Button size="lg" asChild className="w-full">
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  Commander
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full">
                Continuer les achats
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
