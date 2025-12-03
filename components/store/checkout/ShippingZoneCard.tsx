"use client"

import { Truck, Clock, MapPin, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import type { ShippingZone } from "@/types"

interface ShippingZoneCardProps {
  zone: ShippingZone
  isSelected?: boolean
  isRecommended?: boolean
  onSelect?: () => void
  freeShipping?: boolean
  disabled?: boolean
}

export function ShippingZoneCard({
  zone,
  isSelected = false,
  isRecommended = false,
  onSelect,
  freeShipping = false,
  disabled = false,
}: ShippingZoneCardProps) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={!disabled && onSelect ? onSelect : undefined}
      onKeyDown={(e) => {
        if (!disabled && onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "relative rounded-lg border p-4 transition-all",
        onSelect && !disabled && "cursor-pointer hover:border-primary/50",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <Badge className="absolute -top-2 right-4 gap-1">
          <Sparkles className="h-3 w-3" />
          Recommandé
        </Badge>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Selection indicator */}
        <div className="flex items-start gap-3">
          {onSelect && (
            <div
              className={cn(
                "mt-1 h-4 w-4 rounded-full border-2 transition-colors shrink-0",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && (
                <div className="absolute inset-1 rounded-full bg-primary-foreground" />
              )}
            </div>
          )}

          {/* Zone info */}
          <div className="space-y-2">
            {/* Name */}
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{zone.name}</span>
            </div>

            {/* Estimated days */}
            {zone.estimated_days && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Livraison en {zone.estimated_days}</span>
              </div>
            )}

            {/* Cities preview */}
            {zone.cities && zone.cities.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  {zone.cities.slice(0, 5).join(", ")}
                  {zone.cities.length > 5 && (
                    <span className="text-xs"> +{zone.cities.length - 5}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          {freeShipping ? (
            <div className="space-y-1">
              <p className="text-sm line-through text-muted-foreground">
                {formatPrice(zone.fee)}
              </p>
              <Badge variant="secondary" className="text-green-600">
                Gratuit
              </Badge>
            </div>
          ) : (
            <p className="font-semibold text-lg">{formatPrice(zone.fee)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
