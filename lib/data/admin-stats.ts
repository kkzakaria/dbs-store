import { sql, and, gte, eq, lte } from "drizzle-orm";
import { orders, products } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export type AdminStats = {
  ordersToday: number;
  revenueMonth: number;
  pendingOrders: number;
  lowStockProducts: number;
  ordersByDay: { date: string; count: number }[];
};

export async function getAdminStats(db: Db): Promise<AdminStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [ordersToday, revenueMonth, pendingOrders, lowStockProducts, recentOrders] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(gte(orders.created_at, todayStart))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ total: sql<number>`coalesce(sum(total), 0)` })
        .from(orders)
        .where(
          and(
            gte(orders.created_at, monthStart),
            sql`${orders.status} in ('confirmed', 'shipped', 'delivered')`
          )
        )
        .then((r) => r[0]?.total ?? 0),

      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, "pending"))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(lte(products.stock, 3), eq(products.is_active, true)))
        .then((r) => r[0]?.count ?? 0),

      db
        .select({ created_at: orders.created_at })
        .from(orders)
        .where(gte(orders.created_at, sevenDaysAgo)),
    ]);

  // Grouper les commandes par jour (7 derniers jours)
  const countByDay = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    countByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of recentOrders) {
    const key = row.created_at.toISOString().slice(0, 10);
    if (countByDay.has(key)) {
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }
  }

  const ordersByDay = Array.from(countByDay.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    ordersToday: Number(ordersToday),
    revenueMonth: Number(revenueMonth),
    pendingOrders: Number(pendingOrders),
    lowStockProducts: Number(lowStockProducts),
    ordersByDay,
  };
}
