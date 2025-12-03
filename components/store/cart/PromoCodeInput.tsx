"use client"

import * as React from "react"
import { Loader2, Tag, X, Check, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/store/products/PriceDisplay"
import { validatePromoCode, type PromoValidationResult } from "@/actions/promotions"
import type { Promotion } from "@/types"

interface PromoCodeInputProps {
  cartTotal: number
  onPromoApplied?: (result: PromoValidationResult) => void
  className?: string
}

export function PromoCodeInput({
  cartTotal,
  onPromoApplied,
  className,
}: PromoCodeInputProps) {
  const [code, setCode] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = React.useState<{
    promo: Promotion
    discount: number
    freeShipping: boolean
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await validatePromoCode({
        code: code.trim(),
        cartTotal,
      })

      if (result?.data?.valid && result.data.promo) {
        setAppliedPromo({
          promo: result.data.promo,
          discount: result.data.discount || 0,
          freeShipping: result.data.freeShipping || false,
        })
        setError(null)
        onPromoApplied?.(result.data)
      } else {
        setError(result?.data?.error || "Code promo invalide")
        setAppliedPromo(null)
        onPromoApplied?.({ valid: false })
      }
    } catch {
      setError("Erreur lors de la validation du code")
      setAppliedPromo(null)
      onPromoApplied?.({ valid: false })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setCode("")
    setError(null)
    onPromoApplied?.({ valid: false })
  }

  // If promo is applied, show the applied state
  if (appliedPromo) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <Tag className="mr-1 h-3 w-3" />
                {appliedPromo.promo.code}
              </Badge>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {appliedPromo.freeShipping
                  ? "Livraison gratuite"
                  : appliedPromo.promo.type === "percentage"
                    ? `-${appliedPromo.promo.value}% de réduction`
                    : `-${formatPrice(appliedPromo.discount)}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-700 hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemovePromo}
            aria-label="Retirer le code promo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Code promo"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            className={cn(
              "pl-9",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={!code.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Appliquer"
          )}
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
