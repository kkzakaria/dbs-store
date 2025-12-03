"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Truck, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShippingZoneCard } from "./ShippingZoneCard"
import type { ShippingZone } from "@/types"

interface ShippingStepProps {
  shippingZones: ShippingZone[]
  selectedCity: string
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
  onBack: () => void
  onContinue: () => void
  freeShipping?: boolean
  isLoading?: boolean
}

export function ShippingStep({
  shippingZones,
  selectedCity,
  selectedZoneId,
  onSelectZone,
  onBack,
  onContinue,
  freeShipping = false,
  isLoading = false,
}: ShippingStepProps) {
  // Find recommended zone based on selected city
  const recommendedZone = React.useMemo(() => {
    return shippingZones.find((zone) => zone.cities?.includes(selectedCity))
  }, [shippingZones, selectedCity])

  // Auto-select recommended zone on first load
  React.useEffect(() => {
    if (!selectedZoneId && recommendedZone) {
      onSelectZone(recommendedZone.id)
    }
  }, [recommendedZone, selectedZoneId, onSelectZone])

  const canContinue = !!selectedZoneId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Mode de livraison</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez votre mode de livraison
        </p>
      </div>

      {/* Free shipping notice */}
      {freeShipping && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-950/50 dark:text-green-400">
          <Truck className="h-5 w-5" />
          <div>
            <p className="font-medium">Livraison gratuite</p>
            <p className="text-sm opacity-90">
              Votre code promo inclut la livraison gratuite
            </p>
          </div>
        </div>
      )}

      {/* Shipping zones list */}
      <div className="grid gap-3">
        {shippingZones.map((zone) => {
          const isRecommended = recommendedZone?.id === zone.id

          return (
            <ShippingZoneCard
              key={zone.id}
              zone={zone}
              isSelected={selectedZoneId === zone.id}
              isRecommended={isRecommended}
              onSelect={() => onSelectZone(zone.id)}
              freeShipping={freeShipping}
              disabled={isLoading}
            />
          )
        })}
      </div>

      {/* Selected city info */}
      {selectedCity && (
        <p className="text-sm text-muted-foreground">
          Livraison à <Badge variant="outline">{selectedCity}</Badge>
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button
          onClick={onContinue}
          disabled={!canContinue || isLoading}
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Continuer
        </Button>
      </div>
    </div>
  )
}
