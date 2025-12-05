"use client"

import { useState, useEffect } from "react"
import { Plus, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShippingZoneCard } from "./ShippingZoneCard"
import { ShippingZoneForm } from "./ShippingZoneForm"
import { useAdminHeader } from "@/components/admin/layout/AdminHeaderContext"

type ShippingZone = {
  id: string
  name: string
  cities: string[]
  fee: number
  estimated_days: string | null
  is_active: boolean | null
}

interface ShippingZonesManagerProps {
  zones: ShippingZone[]
}

export function ShippingZonesManager({ zones }: ShippingZonesManagerProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [zoneToEdit, setZoneToEdit] = useState<ShippingZone | null>(null)
  const { setCustomTitle } = useAdminHeader()

  // Set custom title
  useEffect(() => {
    setCustomTitle(`Paramètres - Zones de livraison (${zones.length})`)
    return () => setCustomTitle(null)
  }, [zones.length, setCustomTitle])

  const handleEdit = (zone: ShippingZone) => {
    setZoneToEdit(zone)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setZoneToEdit(null)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setZoneToEdit(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Zones de livraison</h2>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle zone
        </Button>
      </div>

      {/* Zones Grid */}
      {zones.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <ShippingZoneCard key={zone.id} zone={zone} onEdit={handleEdit} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune zone de livraison</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Créez votre première zone de livraison pour définir vos tarifs
          </p>
          <Button className="mt-4" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une zone
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <ShippingZoneForm
        open={formOpen}
        onOpenChange={handleFormClose}
        zone={zoneToEdit}
      />
    </div>
  )
}
