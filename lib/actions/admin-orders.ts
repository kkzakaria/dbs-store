"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import type { OrderStatus } from "@/lib/db/schema";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/data/admin-orders";
import { requireOrgMember } from "@/lib/actions/admin-auth";

export async function updateOrderStatus(id: string, newStatus: OrderStatus): Promise<void> {
  await requireOrgMember();
  const db = await getDb();

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const allowed = ORDER_STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) throw new Error("INVALID_TRANSITION");

  const updateData: Partial<typeof orders.$inferInsert> = {
    status: newStatus,
    updated_at: new Date(),
  };

  // Paiement automatique à la livraison pour COD
  if (newStatus === "delivered" && order.payment_method === "cod") {
    updateData.payment_status = "paid";
  }

  await db.update(orders).set(updateData).where(eq(orders.id, id));

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${id}`);
}
