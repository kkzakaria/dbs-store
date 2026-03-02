import Link from "next/link";
import { getDb } from "@/lib/db";
import { getAdminOrders, ORDERS_PAGE_SIZE } from "@/lib/data/admin-orders";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/db/schema";

type Props = { searchParams: Promise<{ status?: OrderStatus; page?: string }> };

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export default async function AdminCommandesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const db = getDb();
  const { orders: ordersList, total } = await getAdminOrders(db, { status: sp.status }, page);
  const totalPages = Math.ceil(total / ORDERS_PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Commandes</h1>

      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/commandes"
          className={`rounded-full px-3 py-1 text-sm ${
            !sp.status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Toutes
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/commandes?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm ${
              sp.status === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Client</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-center font-medium">Paiement</th>
              <th className="px-4 py-3 text-center font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {ordersList.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {order.id.slice(0, 8)}&hellip;
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.shipping_name}</p>
                  <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {new Intl.NumberFormat("fr-FR").format(order.total)} F
                </td>
                <td className="px-4 py-3 text-center uppercase text-xs text-muted-foreground">
                  {order.payment_method}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={STATUS_VARIANT[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {order.created_at.toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="text-xs text-primary underline"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ordersList.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucune commande trouvée.
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/commandes?${sp.status ? `status=${sp.status}&` : ""}page=${p}`}
              className={`rounded px-3 py-1 text-sm ${
                p === page ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
