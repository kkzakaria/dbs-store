"use server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, order_items, products } from "@/lib/db/schema";
import type { PaymentMethod } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { CartItemInput } from "@/lib/order-utils";

export type CheckoutFormData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  // Narrowed to "cod" — other payment methods are not yet implemented
  payment_method: Extract<PaymentMethod, "cod">;
  items: CartItemInput[];
};

export async function createOrder(data: CheckoutFormData): Promise<{ orderId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion");
  if (!session.user.emailVerified) redirect("/email-non-verifie");

  // Validate input before touching the DB
  if (!data.items || data.items.length === 0) {
    throw new Error("EMPTY_CART");
  }
  if (data.items.some((i) => i.quantity <= 0)) {
    throw new Error("INVALID_QUANTITY");
  }

  // Fetch authoritative prices from DB — never trust client-supplied prices
  const db = getDb();
  const productIds = data.items.map((i) => i.productId);
  const dbProducts = await db
    .select({ id: products.id, price: products.price, is_active: products.is_active })
    .from(products)
    .where(inArray(products.id, productIds));

  const priceMap = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = priceMap.get(item.productId);
    if (!product || !product.is_active) {
      throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
    }
  }

  // Use DB prices for all financial calculations
  const itemsWithDbPrices = data.items.map((item) => ({
    ...item,
    price: priceMap.get(item.productId)!.price,
  }));

  const subtotal = itemsWithDbPrices.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping_fee = 0; // Livraison gratuite phase initiale
  const total = subtotal + shipping_fee;

  const orderId = randomUUID();
  const now = new Date();

  try {
    // better-sqlite3 is synchronous — transaction callback must NOT be async
    db.transaction((tx) => {
      tx.insert(orders).values({
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
      }).run();

      tx.insert(order_items).values(
        itemsWithDbPrices.map((item) => ({
          id: randomUUID(),
          order_id: orderId,
          product_id: item.productId,
          product_name: item.name,
          product_slug: item.slug,
          product_image: item.image,
          unit_price: item.price,
          quantity: item.quantity,
          line_total: item.price * item.quantity,
        }))
      ).run();
    });
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
