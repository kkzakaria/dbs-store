"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Power, MapPin, Clock, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { deleteShippingZone, toggleShippingZoneStatus } from "@/actions/admin/settings"
import { formatPrice } from "@/lib/config"
import { toast } from "sonner"

type ShippingZone = {
  id: string
  name: string
  cities: string[]
  fee: number
  estimated_days: string | null
  is_active: boolean | null
}

interface ShippingZoneCardProps {
  zone: ShippingZone
  onEdit: (zone: ShippingZone) => void
}

export function ShippingZoneCard({ zone, onEdit }: ShippingZoneCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleShippingZoneStatus({ id: zone.id })

      if (result?.data?.success) {
        toast.success(zone.is_active ? "Zone désactivée" : "Zone activée")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors du changement de statut")
      }
    })
  }

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteShippingZone({ id: zone.id })

      if (result?.data?.success) {
        toast.success("Zone supprimée")
        setDeleteDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la suppression")
      }
    })
  }

  return (
    <>
      <Card className={!zone.is_active ? "opacity-60" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{zone.name}</CardTitle>
            </div>
            <Badge variant={zone.is_active ? "default" : "secondary"}>
              {zone.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <span className="font-bold text-lg text-foreground">
              {formatPrice(zone.fee)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cities */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Villes couvertes
            </div>
            <div className="flex flex-wrap gap-1">
              {zone.cities.map((city) => (
                <Badge key={city} variant="outline" className="text-xs">
                  {city}
                </Badge>
              ))}
            </div>
          </div>

          {/* Estimated Days */}
          {zone.estimated_days && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Délai:</span>
              <span>{zone.estimated_days}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(zone)}
              disabled={isPending}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={isPending}
            >
              <Power className="mr-1 h-4 w-4" />
              {zone.is_active ? "Désactiver" : "Activer"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer la zone"
        description={`Êtes-vous sûr de vouloir supprimer la zone "${zone.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        loading={isPending}
        variant="destructive"
      />
    </>
  )
}
