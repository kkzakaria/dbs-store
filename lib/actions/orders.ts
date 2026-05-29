"use server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { inArray, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, order_items, products, product_variants } from "@/lib/db/schema";
import type { PaymentMethod } from "@/lib/db/schema";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import type { CartItemInput } from "@/lib/order-utils";

export type CheckoutFormData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  payment_method: Extract<PaymentMethod, "cod">;
  items: CartItemInput[];
};

// Exported for unit testing
export function validateVariantStock(
  variantItems: { variantId: string | null; quantity: number }[],
  variantMap: Map<string, { stock: number }>
): void {
  for (const item of variantItems) {
    if (!item.variantId) continue;
    const variant = variantMap.get(item.variantId);
    if (!variant) throw new Error(`VARIANT_NOT_FOUND:${item.variantId}`);
    if (variant.stock < item.quantity) throw new Error(`STOCK_INSUFFICIENT:${item.variantId}`);
  }
}

export async function createOrder(data: CheckoutFormData): Promise<{ orderId: string }> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion");
  if (!session.user.emailVerified) redirect("/email-non-verifie");

  if (!data.items || data.items.length === 0) throw new Error("EMPTY_CART");
  if (data.items.some((i) => i.quantity <= 0)) throw new Error("INVALID_QUANTITY");

  const db = await getDb();

  const itemsWithVariant = data.items.filter((i) => i.variantId != null);
  const variantIds = itemsWithVariant.map((i) => i.variantId!);
  const productIds = data.items.map((i) => i.productId);

  const [dbVariants, dbProducts] = await Promise.all([
    variantIds.length > 0
      ? db.select().from(product_variants).where(inArray(product_variants.id, variantIds))
      : Promise.resolve([]),
    db
      .select({ id: products.id, price: products.price, is_active: products.is_active })
      .from(products)
      .where(inArray(products.id, productIds)),
  ]);

  const variantMap = new Map(dbVariants.map((v) => [v.id, v]));
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.is_active) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
  }

  validateVariantStock(data.items, variantMap);

  const itemsWithPrices = data.items.map((item) => {
    const variant = item.variantId ? variantMap.get(item.variantId) : null;
    const product = productMap.get(item.productId)!;
    return { ...item, price: variant?.price_override ?? product.price };
  });

  const subtotal = itemsWithPrices.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0;
  const total = subtotal + shipping_fee;
  const orderId = randomUUID();
  const now = new Date();

  const stockDecrements = itemsWithVariant.map((item) =>
    db
      .update(product_variants)
      .set({ stock: sql`stock - ${item.quantity}` })
      .where(eq(product_variants.id, item.variantId!))
  );

  try {
    await db.batch([
      db.insert(orders).values({
        id: orderId,
        user_id: session.user.id,
        status: "pending",
        payment_method: data.payment_method,
        payment_status: "pending",
        shipping_name: data.name,
        shipping_phone: data.phone,
        shipping_city: data.city,
        shipping_address: data.address,
        shipping_notes: data.notes ?? null,
        subtotal,
        shipping_fee,
        total,
        created_at: now,
        updated_at: now,
      }),
      db.insert(order_items).values(
        itemsWithPrices.map((item) => ({
          id: randomUUID(),
          order_id: orderId,
          product_id: item.productId,
          variant_id: item.variantId ?? null,
          product_name: item.name,
          product_slug: item.slug,
          product_image: item.image,
          color_name: item.colorName ?? null,
          color_hex: item.colorHex ?? null,
          unit_price: item.price,
          quantity: item.quantity,
          line_total: item.price * item.quantity,
        }))
      ),
      ...stockDecrements,
    ]);
  } catch (err) {
    console.error("[createOrder] DB write failed", {
      userId: session.user.id,
      orderId,
      itemCount: data.items.length,
      error: err,
    });
    throw err;
  }

  return { orderId };
}
