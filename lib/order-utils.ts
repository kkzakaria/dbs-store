import type { CartItem } from "@/lib/cart";
import type { PaymentMethod } from "@/lib/db/schema";

// CartItemInput is structurally identical to CartItem — use the same type to avoid drift
export type CartItemInput = CartItem;

export function buildOrder(items: CartItemInput[], paymentMethod: PaymentMethod) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0; // Livraison gratuite phase initiale
  return { subtotal, shipping_fee, total: subtotal + shipping_fee, paymentMethod };
}
