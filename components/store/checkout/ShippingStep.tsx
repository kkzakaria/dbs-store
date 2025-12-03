"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Truck, Clock, MapPin, Loader2, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import type { ShippingZone } from "@/types"

interface ShippingStepProps {
  selectedCity: string
  detectedZone: ShippingZone | null
  onBack: () => void
  onContinue: () => void
  freeShipping?: boolean
  isLoading?: boolean
}

export function ShippingStep({
  selectedCity,
  detectedZone,
  onBack,
  onContinue,
  freeShipping = false,
  isLoading = false,
}: ShippingStepProps) {
  // Cannot continue if no zone detected
  const canContinue = !!detectedZone

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!detectedZone) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Mode de livraison</h2>
          <p className="text-sm text-muted-foreground">
            Livraison à {selectedCity}
          </p>
        </div>

        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Désolé, nous ne livrons pas encore dans cette zone. Veuillez
            sélectionner une autre adresse.
          </AlertDescription>
        </Alert>

        <div className="flex justify-start pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Modifier l&apos;adresse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Mode de livraison</h2>
        <p className="text-sm text-muted-foreground">
          Basé sur votre adresse à <Badge variant="outline">{selectedCity}</Badge>
        </p>
      </div>

      {/* Free shipping notice */}
      {freeShipping && (
        <Alert className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
          <Truck className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Livraison gratuite !</span> Votre code
            promo inclut la livraison gratuite.
          </AlertDescription>
        </Alert>
      )}

      {/* Detected zone card */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            {/* Zone info */}
            <div className="space-y-3">
              {/* Name */}
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">{detectedZone.name}</span>
              </div>

              {/* Estimated days */}
              {detectedZone.estimated_days && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Livraison estimée : {detectedZone.estimated_days}</span>
                </div>
              )}

              {/* Cities covered */}
              {detectedZone.cities && detectedZone.cities.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Couvre : {detectedZone.cities.slice(0, 5).join(", ")}
                    {detectedZone.cities.length > 5 && " ..."}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              {freeShipping ? (
                <div className="space-y-1">
                  <p className="text-sm line-through text-muted-foreground">
                    {formatPrice(detectedZone.fee)}
                  </p>
                  <Badge className="bg-green-600 hover:bg-green-600">
                    Gratuit
                  </Badge>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(detectedZone.fee)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Frais de livraison
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-sm text-muted-foreground text-center">
        Les frais de livraison sont calculés automatiquement selon votre zone.
      </p>

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
