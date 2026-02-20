import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getCachedSession } from "@/lib/session";
import { orders } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/db/schema";

const statusLabel: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusVariant: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

export default async function CommandesPage() {
  // Layout already redirects unauthenticated users — session is always set here.
  // getCachedSession() deduplicates the auth call already made by the layout.
  const session = await getCachedSession();
  const db = getDb();
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.user_id, session!.user.id))
    .orderBy(desc(orders.created_at));

  if (userOrders.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Mes commandes</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Vous n&apos;avez pas encore passé de commande.{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Découvrir nos produits
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Mes commandes</h2>
      <ul className="mt-4 divide-y rounded-xl border">
        {userOrders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/compte/commandes/${order.id}`}
              className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.created_at.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={statusVariant[order.status]}>
                  {statusLabel[order.status]}
                </Badge>
                <span className="text-sm font-semibold tabular-nums">
                  {order.total.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
