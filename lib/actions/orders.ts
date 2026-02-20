"use server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { orders, order_items } from "@/lib/db/schema";
import type { PaymentMethod } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type CartItemInput = {
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

export type CheckoutFormData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  payment_method: PaymentMethod;
  items: CartItemInput[];
};

export async function createOrder(data: CheckoutFormData): Promise<{ orderId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/connexion");

  const { subtotal, shipping_fee, total } = buildOrder(data.items, data.payment_method);
  const orderId = randomUUID();
  const now = new Date();

  const db = getDb();
  await db.insert(orders).values({
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
  });

  await db.insert(order_items).values(
    data.items.map((item) => ({
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
  );

  return { orderId };
}
