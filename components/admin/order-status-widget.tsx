"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/lib/actions/admin-orders";
import type { OrderStatus } from "@/lib/db/schema";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/data/admin-orders";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Confirmer",
  confirmed: "Marquer expédiée",
  shipped: "Marquer livrée",
};

interface OrderStatusWidgetProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusWidget({ orderId, currentStatus }: OrderStatusWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(currentStatus);

  const transitions = ORDER_STATUS_TRANSITIONS[status];

  async function handleTransition(next: OrderStatus) {
    setLoading(true);
    setError(null);
    try {
      await updateOrderStatus(orderId, next);
      setStatus(next);
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Statut :</span>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {STATUS_LABELS[status]}
        </span>
      </div>

      {transitions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {transitions.map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === "cancelled" ? "destructive" : "default"}
              onClick={() => handleTransition(next)}
              disabled={loading}
            >
              {next === "cancelled" ? "Annuler" : NEXT_LABEL[status] ?? STATUS_LABELS[next]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">État final — aucune transition possible.</p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
