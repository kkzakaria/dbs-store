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
  Phone,
  ChevronDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { formatPhoneForDisplay } from "@/lib/validations/auth"
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
  const [storesOpen, setStoresOpen] = React.useState(false)

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
      <div className="grid gap-4">
        {/* Option 1: Store Pickup */}
        <Card
          className={cn(
            "transition-all",
            deliveryMethod === "pickup" &&
              "border-primary bg-primary/5 ring-1 ring-primary"
          )}
        >
          <CardContent className="pt-6">
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
              className="flex items-start gap-4 cursor-pointer"
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  deliveryMethod === "pickup"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {deliveryMethod === "pickup" && <Check className="h-3 w-3" />}
              </div>

              {/* Pickup info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Retrait en magasin</span>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    Gratuit
                  </Badge>
                </div>

                {/* Selected store info */}
                {selectedStore && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {selectedStore.name}
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        {selectedStore.address}, {selectedStore.commune},{" "}
                        {selectedStore.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{selectedStore.hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{formatPhoneForDisplay(selectedStore.phone)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Store selector (only show when pickup is selected and multiple stores exist) */}
            {deliveryMethod === "pickup" && stores.length > 1 && (
              <Collapsible
                open={storesOpen}
                onOpenChange={setStoresOpen}
                className="mt-4 ml-9"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                  >
                    Changer de magasin
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        storesOpen && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelectStore(store)
                        setStoresOpen(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onSelectStore(store)
                          setStoresOpen(false)
                        }
                      }}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedStore?.id === store.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{store.name}</span>
                        {selectedStore?.id === store.id && (
                          <Badge variant="secondary" className="text-xs">
                            Sélectionné
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {store.commune}, {store.city}
                      </p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Option 2: Home Delivery */}
        <Card
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
            "cursor-pointer transition-all hover:border-primary/50",
            deliveryMethod === "delivery" &&
              "border-primary bg-primary/5 ring-1 ring-primary"
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {/* Selection indicator */}
              <div
                className={cn(
                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  deliveryMethod === "delivery"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {deliveryMethod === "delivery" && <Check className="h-3 w-3" />}
              </div>

              {/* Delivery info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Livraison à domicile</span>
                  </div>
                  {detectedZone && (
                    <div className="text-right">
                      {freeShipping ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">
                            {formatPrice(detectedZone.fee)}
                          </span>
                          <Badge variant="secondary" className="text-green-600">
                            Gratuit
                          </Badge>
                        </div>
                      ) : (
                        <span className="font-semibold text-lg">
                          {formatPrice(detectedZone.fee)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {detectedZone ? (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Zone : {detectedZone.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Livraison à {selectedCity}</span>
                    </div>
                    {detectedZone.estimated_days && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Délai : {detectedZone.estimated_days}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive" className="py-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Désolé, nous ne livrons pas encore à {selectedCity}. Vous
                      pouvez choisir le retrait en magasin.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
