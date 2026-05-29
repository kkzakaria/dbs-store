import type { CartItem } from "@/lib/cart";
import type { PaymentMethod } from "@/lib/db/schema";

// CartItemInput is structurally identical to CartItem — use the same type to avoid drift
export type CartItemInput = CartItem;

export function buildOrder(items: CartItemInput[], paymentMethod: PaymentMethod) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0; // Livraison gratuite phase initiale
  return { subtotal, shipping_fee, total: subtotal + shipping_fee, paymentMethod };
}

export function validateVariantStock(
  variantItems: { variantId: string | null; productId: string; quantity: number }[],
  variantMap: Map<string, { stock: number; product_id: string }>
): void {
  for (const item of variantItems) {
    if (!item.variantId) continue;
    const variant = variantMap.get(item.variantId);
    if (!variant) throw new Error(`VARIANT_NOT_FOUND:${item.variantId}`);
    if (variant.product_id !== item.productId) throw new Error(`VARIANT_PRODUCT_MISMATCH:${item.variantId}`);
    if (variant.stock < item.quantity) throw new Error(`STOCK_INSUFFICIENT:${item.variantId}`);
  }
}
