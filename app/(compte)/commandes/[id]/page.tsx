import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { orders, order_items } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

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

export default async function CommandeDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const [session, [order]] = await Promise.all([
      auth.api.getSession({ headers: await headers() }),
      getDb().select().from(orders).where(eq(orders.id, id)).limit(1),
    ]);

    if (!session?.user || !order || order.user_id !== session.user.id) notFound();

    const items = await getDb()
      .select()
      .from(order_items)
      .where(eq(order_items.order_id, id));

    return (
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Commande #{id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {order.created_at.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge variant={statusVariant[order.status]}>
            {statusLabel[order.status]}
          </Badge>
        </div>

        {/* Articles */}
        <div className="mt-6 rounded-xl border">
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-4 py-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted/50">
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-contain p-1"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/produits/${item.product_slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.product_name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.unit_price.toLocaleString("fr-FR")} FCFA × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {item.line_total.toLocaleString("fr-FR")} FCFA
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t px-4 py-4 font-bold">
            <span>Total</span>
            <span>{order.total.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        {/* Adresse de livraison */}
        <div className="mt-6 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Livraison</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.shipping_name}
            <br />
            {order.shipping_phone}
            <br />
            {order.shipping_address}, {order.shipping_city}
            {order.shipping_notes ? (
              <>
                <br />
                <span className="italic">{order.shipping_notes}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/compte/commandes">← Retour aux commandes</Link>
          </Button>
        </div>
      </div>
    );
  } catch (err) {
    if (
      err instanceof Error &&
      (err as { digest?: string }).digest?.startsWith("NEXT_")
    ) {
      throw err;
    }
    console.error("[compte/commandes] DB query failed", { orderId: id, error: err });
    notFound();
  }
}
