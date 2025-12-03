"use client"

import * as React from "react"
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  Clock,
  MapPin,
  Loader2,
  Info,
  Store as StoreIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import type { ShippingZone, Store } from "@/types"

export type DeliveryMethod = "delivery" | "pickup"

interface ShippingStepProps {
  selectedCity: string
  detectedZone: ShippingZone | null
  deliveryMethod: DeliveryMethod
  stores: Store[]
  selectedStore: Store | null
  onSelectMethod: (method: DeliveryMethod) => void
  onSelectStore: (store: Store) => void
  onBack: () => void
  onContinue: () => void
  freeShipping?: boolean
  isLoading?: boolean
}

export function ShippingStep({
  selectedCity,
  detectedZone,
  deliveryMethod,
  stores,
  selectedStore,
  onSelectMethod,
  onSelectStore,
  onBack,
  onContinue,
  freeShipping = false,
  isLoading = false,
}: ShippingStepProps) {
  // Can continue if pickup selected with a store OR if delivery selected with valid zone
  const canContinue =
    (deliveryMethod === "pickup" && selectedStore) ||
    (deliveryMethod === "delivery" && !!detectedZone)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Mode de livraison</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez comment recevoir votre commande
        </p>
      </div>

      {/* Free shipping notice */}
      {freeShipping && deliveryMethod === "delivery" && (
        <Alert className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
          <Truck className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Livraison gratuite !</span> Votre code
            promo inclut la livraison gratuite.
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery options */}
      <div className="space-y-3">
        {/* Option 1: Store Pickup */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMethod("pickup")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onSelectMethod("pickup")
            }
          }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
            deliveryMethod === "pickup"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "hover:border-primary/50"
          )}
        >
          {/* Selection indicator */}
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              deliveryMethod === "pickup"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30"
            )}
          >
            {deliveryMethod === "pickup" && <Check className="h-3 w-3" />}
          </div>

          {/* Icon */}
          <StoreIcon className="h-5 w-5 text-primary shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Retrait en magasin</span>
              <Badge variant="secondary" className="text-green-600 shrink-0">
                Gratuit
              </Badge>
            </div>
            {selectedStore && (
              <p className="text-sm text-muted-foreground truncate">
                {selectedStore.name} - {selectedStore.commune}
              </p>
            )}
          </div>
        </div>

        {/* Store selector dropdown (only show when pickup is selected and multiple stores exist) */}
        {deliveryMethod === "pickup" && stores.length > 1 && (
          <div className="ml-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="truncate">
                    {selectedStore?.name || "Choisir un magasin"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                {stores.map((store) => (
                  <DropdownMenuItem
                    key={store.id}
                    onClick={() => onSelectStore(store)}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.commune} - {store.hours}
                      </p>
                    </div>
                    {selectedStore?.id === store.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Selected store details (compact) */}
        {deliveryMethod === "pickup" && selectedStore && (
          <div className="ml-8 p-3 rounded-md bg-muted/50 text-sm space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{selectedStore.address}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{selectedStore.hours}</span>
            </div>
          </div>
        )}

        {/* Option 2: Home Delivery */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMethod("delivery")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onSelectMethod("delivery")
            }
          }}
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
            deliveryMethod === "delivery"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "hover:border-primary/50"
          )}
        >
          {/* Selection indicator */}
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              deliveryMethod === "delivery"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30"
            )}
          >
            {deliveryMethod === "delivery" && <Check className="h-3 w-3" />}
          </div>

          {/* Icon */}
          <Truck className="h-5 w-5 text-primary shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Livraison à domicile</span>
              {detectedZone && (
                <div className="shrink-0">
                  {freeShipping ? (
                    <Badge variant="secondary" className="text-green-600">
                      Gratuit
                    </Badge>
                  ) : (
                    <span className="font-semibold">
                      {formatPrice(detectedZone.fee)}
                    </span>
                  )}
                </div>
              )}
            </div>
            {detectedZone ? (
              <p className="text-sm text-muted-foreground">
                {detectedZone.name} - {detectedZone.estimated_days}
              </p>
            ) : (
              <p className="text-sm text-destructive">
                Non disponible à {selectedCity}
              </p>
            )}
          </div>
        </div>

        {/* Delivery unavailable notice */}
        {deliveryMethod === "delivery" && !detectedZone && (
          <Alert variant="destructive" className="ml-8">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Désolé, nous ne livrons pas encore à {selectedCity}. Vous pouvez
              choisir le retrait en magasin.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={onContinue} disabled={!canContinue} size="lg">
          <ArrowRight className="mr-2 h-4 w-4" />
          Continuer
        </Button>
      </div>
    </div>
  )
}
