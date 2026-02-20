import type { PaymentMethod } from "@/lib/db/schema";

export type CartItemInput = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
};

export function buildOrder(items: CartItemInput[], paymentMethod: PaymentMethod) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0; // Livraison gratuite phase initiale
  return { subtotal, shipping_fee, total: subtotal + shipping_fee, paymentMethod };
}
