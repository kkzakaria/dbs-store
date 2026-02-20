"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart";
import { createOrder } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

function formatPrice(p: number) {
  return p.toLocaleString("fr-FR");
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, total, count, clear } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (count() === 0) {
    router.replace("/");
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const { orderId } = await createOrder({
        name: fd.get("name") as string,
        phone: fd.get("phone") as string,
        city: fd.get("city") as string,
        address: fd.get("address") as string,
        notes: fd.get("notes") as string,
        payment_method: "cod",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          slug: i.slug,
          price: i.price,
          image: i.image,
          quantity: i.quantity,
        })),
      });
      clear();
      router.push(`/commande/${orderId}`);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 lg:grid-cols-[1fr_360px] lg:px-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <h1 className="text-2xl font-bold">Finaliser la commande</h1>
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold">Informations de livraison</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" required placeholder="Jean Kouassi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" required placeholder="+225 07 XX XX XX XX" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" name="city" required placeholder="Abidjan, Cocody" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Adresse complète</Label>
            <Input
              id="address"
              name="address"
              required
              placeholder="Rue des Jardins, Résidence Les Palmiers"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea id="notes" name="notes" placeholder="Indications supplémentaires..." />
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-base font-semibold">Mode de paiement</legend>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 has-[:checked]:border-primary">
            <input
              type="radio"
              name="payment"
              value="cod"
              defaultChecked
              className="accent-primary"
            />
            <div>
              <p className="font-medium">Paiement à la livraison</p>
              <p className="text-sm text-muted-foreground">Payez en espèces à la réception</p>
            </div>
          </label>
        </fieldset>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Traitement..." : "Confirmer la commande"}
        </Button>
      </form>

      {/* Récapitulatif commande */}
      <div className="space-y-4">
        <h2 className="font-semibold">Votre commande</h2>
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 p-3 text-sm">
              <span className="line-clamp-1 flex-1">{item.name}</span>
              <span className="text-muted-foreground">×{item.quantity}</span>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatPrice(total())} FCFA</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Livraison gratuite en Côte d&apos;Ivoire.
        </p>
      </div>
    </div>
  );
}
