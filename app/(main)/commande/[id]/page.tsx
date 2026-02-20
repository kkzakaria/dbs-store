import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orders, order_items } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Props = { params: Promise<{ id: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) notFound();

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order || order.user_id !== session.user.id) notFound();

  const items = await db.select().from(order_items).where(eq(order_items.order_id, id));

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle className="mx-auto size-16 text-green-500" />
      <h1 className="mt-6 text-2xl font-bold">Commande confirmée !</h1>
      <p className="mt-2 text-muted-foreground">
        Merci pour votre commande. Nous vous contacterons au{" "}
        <strong>{order.shipping_phone}</strong> pour organiser la livraison.
      </p>
      <div className="mt-8 rounded-xl border bg-card p-6 text-left">
        <h2 className="font-semibold">
          Récapitulatif — Commande #{id.slice(0, 8).toUpperCase()}
        </h2>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span>{item.line_total.toLocaleString("fr-FR")} FCFA</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4 font-bold">
          <span>Total</span>
          <span>{order.total.toLocaleString("fr-FR")} FCFA</span>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/compte/commandes">Voir mes commandes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Continuer les achats</Link>
        </Button>
      </div>
    </div>
  );
}
