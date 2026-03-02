import { desc, eq } from "drizzle-orm";
import { orders, order_items } from "@/lib/db/schema";
import type { Order, OrderItem, OrderStatus } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ORDERS_PAGE_SIZE = 30;

export async function getAdminOrders(
  db: Db,
  filters: { status?: OrderStatus } = {},
  page = 1
): Promise<Order[]> {
  const offset = (page - 1) * ORDERS_PAGE_SIZE;
  let query = db
    .select()
    .from(orders)
    .orderBy(desc(orders.created_at))
    .limit(ORDERS_PAGE_SIZE)
    .offset(offset);

  if (filters.status) {
    query = query.where(eq(orders.status, filters.status)) as typeof query;
  }

  return query;
}

export async function getAdminOrderById(
  db: Db,
  id: string
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(order_items).where(eq(order_items.order_id, id));
  return { order, items };
}
