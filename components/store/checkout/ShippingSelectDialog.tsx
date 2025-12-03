"use client"

import * as React from "react"
import {
  Truck,
  Clock,
  MapPin,
  Store as StoreIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import type { DeliveryMethod } from "./ShippingStep"
import type { ShippingZone, Store } from "@/types"

interface ShippingSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCity: string
  detectedZone: ShippingZone | null
  deliveryMethod: DeliveryMethod
  stores: Store[]
  selectedStore: Store | null
  onSelectMethod: (method: DeliveryMethod) => void
  onSelectStore: (store: Store) => void
  freeShipping?: boolean
  onConfirm: () => void
}

export function ShippingSelectDialog({
  open,
  onOpenChange,
  selectedCity,
  detectedZone,
  deliveryMethod,
  stores,
  selectedStore,
  onSelectMethod,
  onSelectStore,
  freeShipping = false,
  onConfirm,
}: ShippingSelectDialogProps) {
  const canConfirm =
    (deliveryMethod === "pickup" && selectedStore) ||
    (deliveryMethod === "delivery" && !!detectedZone)

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mode de livraison</DialogTitle>
          <DialogDescription>
            Choisissez comment recevoir votre commande
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Option 1: Store Pickup */}
          <div
            className={cn(
              "rounded-lg border transition-all",
              deliveryMethod === "pickup"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/50"
            )}
          >
            {/* Main clickable area */}
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
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  deliveryMethod === "pickup"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {deliveryMethod === "pickup" && <Check className="h-2.5 w-2.5" />}
              </div>

              {/* Icon */}
              <StoreIcon className="h-4 w-4 text-primary shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">Retrait en magasin</span>
                  <Badge variant="secondary" className="text-green-600 text-xs shrink-0">
                    Gratuit
                  </Badge>
                </div>
              </div>
            </div>

            {/* Store selector (inside the card when pickup is selected) */}
            {deliveryMethod === "pickup" && (
              <div className="px-3 pb-3 pt-0 space-y-2">
                {stores.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <span className="truncate text-xs">
                          {selectedStore?.name || "Choisir un magasin"}
                        </span>
                        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
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
                            <p className="font-medium text-sm">{store.name}</p>
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
                ) : selectedStore && (
                  <p className="font-medium text-sm">{selectedStore.name}</p>
                )}

                {/* Selected store details */}
                {selectedStore && (
                  <div className="p-2 rounded-md bg-muted/50 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {selectedStore.address}, {selectedStore.commune}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{selectedStore.hours}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              deliveryMethod === "delivery"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/50",
              !detectedZone && "opacity-60"
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                deliveryMethod === "delivery"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {deliveryMethod === "delivery" && <Check className="h-2.5 w-2.5" />}
            </div>

            {/* Icon */}
            <Truck className="h-4 w-4 text-primary shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">Livraison à domicile</span>
                {detectedZone && (
                  <div className="shrink-0">
                    {freeShipping ? (
                      <Badge variant="secondary" className="text-green-600 text-xs">
                        Gratuit
                      </Badge>
                    ) : (
                      <span className="font-semibold text-sm">
                        {formatPrice(detectedZone.fee)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {detectedZone ? (
                <p className="text-xs text-muted-foreground">
                  {detectedZone.name} - {detectedZone.estimated_days}
                </p>
              ) : (
                <p className="text-xs text-destructive">
                  Non disponible à {selectedCity}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1"
          >
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
