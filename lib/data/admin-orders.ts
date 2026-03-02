import { desc, eq, and, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
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
): Promise<{ orders: Order[]; total: number }> {
  const offset = (page - 1) * ORDERS_PAGE_SIZE;

  const conditions: SQL[] = [];
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.created_at))
      .limit(ORDERS_PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause),
  ]);

  return {
    orders: rows,
    total: Number(countResult[0]?.count ?? 0),
  };
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
