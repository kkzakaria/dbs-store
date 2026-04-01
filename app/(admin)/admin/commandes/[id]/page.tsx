import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/lib/db";
import { getAdminOrderById } from "@/lib/data/admin-orders";
import { OrderStatusWidget } from "@/components/admin/order-status-widget";
import { formatFCFA } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const db = await getDb();
  const result = await getAdminOrderById(db, id);
  if (!result) notFound();

  const { order, items } = result;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/commandes" className="text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="inline size-4" /> Commandes
        </Link>
        <h1 className="text-xl font-bold">
          Commande <span className="font-mono">{order.id.slice(0, 8)}&hellip;</span>
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Livraison */}
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-semibold">Livraison</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nom</dt>
              <dd>{order.shipping_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd>{order.shipping_phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ville</dt>
              <dd>{order.shipping_city}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Adresse</dt>
              <dd className="text-right">{order.shipping_address}</dd>
            </div>
            {order.shipping_notes ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="text-right">{order.shipping_notes}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Statut */}
        <div className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-semibold">Statut</h2>
          <OrderStatusWidget orderId={order.id} currentStatus={order.status} />
          <div className="mt-3 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paiement</span>
              <span className="uppercase">{order.payment_method} — {order.payment_status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="mt-6 rounded-lg border bg-background">
        <h2 className="border-b px-4 py-3 font-semibold">Articles</h2>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × {formatFCFA(item.unit_price)}
                </p>
              </div>
              <p className="font-medium tabular-nums">
                {formatFCFA(item.line_total)}
              </p>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="border-t px-4 py-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Sous-total</span>
            <span>{formatFCFA(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Livraison</span>
            <span>{order.shipping_fee === 0 ? "Gratuite" : formatFCFA(order.shipping_fee)}</span>
          </div>
          <div className="mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatFCFA(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
