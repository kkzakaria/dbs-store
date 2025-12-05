"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Package, CreditCard, Truck, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  updateOrderStatus,
  updatePaymentStatus,
  updateTrackingNumber,
} from "@/actions/admin/orders"
import { ORDER_STATUSES, PAYMENT_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/validations/admin"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"

type Order = Database["public"]["Tables"]["orders"]["Row"]

interface OrderStatusActionsProps {
  order: Order
}

export function OrderStatusActions({ order }: OrderStatusActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "")

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus({ id: order.id, status: status as never })
      if (result?.data?.success) {
        toast.success(`Statut mis à jour: ${ORDER_STATUS_LABELS[status]}`)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }

  const handlePaymentStatusChange = (status: string) => {
    startTransition(async () => {
      const result = await updatePaymentStatus({ id: order.id, paymentStatus: status as never })
      if (result?.data?.success) {
        toast.success(`Statut paiement mis à jour: ${PAYMENT_STATUS_LABELS[status]}`)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }

  const handleTrackingUpdate = () => {
    if (!trackingNumber.trim()) {
      toast.error("Veuillez entrer un numéro de suivi")
      return
    }

    startTransition(async () => {
      const result = await updateTrackingNumber({ id: order.id, trackingNumber: trackingNumber.trim() })
      if (result?.data?.success) {
        toast.success("Numéro de suivi mis à jour")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Status */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Statut commande
          </Label>
          <Select
            value={order.status ?? undefined}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Status */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Statut paiement
          </Label>
          <Select
            value={order.payment_status ?? undefined}
            onValueChange={handlePaymentStatusChange}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tracking Number */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Numéro de suivi
          </Label>
          <div className="flex gap-2">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ex: DHL123456789"
              disabled={isPending}
            />
            <Button
              size="icon"
              onClick={handleTrackingUpdate}
              disabled={isPending || !trackingNumber.trim()}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
