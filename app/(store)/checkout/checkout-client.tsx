"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useCartStore } from "@/stores/cart-store"
import {
  CheckoutStepper,
  AddressStep,
  ShippingStep,
  CheckoutSummary,
  OrderSummaryStep,
  type CheckoutStep,
} from "@/components/store/checkout"
import { getShippingZoneByCity, validatePromoForCheckout } from "@/actions/checkout"
import type { Address, ShippingZone, CartItem } from "@/types"

interface CheckoutClientProps {
  addresses: Address[]
  promoCode: string | null
}

export function CheckoutClient({
  addresses,
  promoCode: initialPromoCode,
}: CheckoutClientProps) {
  const router = useRouter()

  // Cart state
  const items = useCartStore((state) => state.items)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const isHydrated = useCartStore((state) => state.isHydrated)

  // Checkout state
  const [step, setStep] = React.useState<CheckoutStep>("address")
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(
    null
  )
  const [detectedZone, setDetectedZone] = React.useState<ShippingZone | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Promo state
  const [promoCode, setPromoCode] = React.useState<string | null>(initialPromoCode)
  const [discount, setDiscount] = React.useState(0)
  const [freeShipping, setFreeShipping] = React.useState(false)
  const [promoValidated, setPromoValidated] = React.useState(false)

  // Computed values
  const subtotal = getSubtotal()
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null
  const shippingFee = freeShipping || !detectedZone ? 0 : detectedZone.fee
  const total = subtotal - discount + (step !== "address" ? shippingFee : 0)

  // Completed steps
  const completedSteps = React.useMemo(() => {
    const completed = new Set<CheckoutStep>()
    if (selectedAddressId && step !== "address") {
      completed.add("address")
    }
    if (detectedZone && step === "summary") {
      completed.add("shipping")
    }
    return completed
  }, [selectedAddressId, detectedZone, step])

  // Redirect if cart is empty (after hydration)
  React.useEffect(() => {
    if (isHydrated && items.length === 0) {
      toast.error("Votre panier est vide")
      router.push("/cart")
    }
  }, [isHydrated, items.length, router])

  // Validate promo code on mount
  React.useEffect(() => {
    async function validatePromo() {
      if (!initialPromoCode || promoValidated) return

      const result = await validatePromoForCheckout({
        code: initialPromoCode,
        subtotal,
      })

      if (result.valid) {
        setDiscount(result.discount)
        setFreeShipping(result.freeShipping)
        setPromoCode(initialPromoCode)
      } else {
        // Invalid promo - clear it
        setPromoCode(null)
        if (result.error) {
          toast.error(result.error)
        }
      }
      setPromoValidated(true)
    }

    if (subtotal > 0) {
      validatePromo()
    }
  }, [initialPromoCode, subtotal, promoValidated])

  // Auto-detect shipping zone when entering shipping step
  React.useEffect(() => {
    async function detectShippingZone() {
      if (!selectedAddress?.city) return

      setIsLoading(true)
      const result = await getShippingZoneByCity(selectedAddress.city)
      setDetectedZone(result.zone)
      setIsLoading(false)
    }

    if (selectedAddressId && step === "shipping") {
      detectShippingZone()
    }
  }, [selectedAddressId, selectedAddress?.city, step])

  // Step handlers
  const handleAddressContinue = () => {
    if (selectedAddressId) {
      setStep("shipping")
    }
  }

  const handleShippingContinue = () => {
    if (detectedZone) {
      setStep("summary")
    }
  }

  const handleStepClick = (clickedStep: CheckoutStep) => {
    // Only allow going back to completed steps
    if (completedSteps.has(clickedStep)) {
      setStep(clickedStep)
    }
  }

  const handlePlaceOrder = () => {
    // TODO: Implement in Phase 7
    toast.info("Le paiement sera disponible dans la prochaine mise à jour")
  }

  // Don't render until hydrated
  if (!isHydrated) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-muted rounded-lg w-2/3 mx-auto" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 bg-muted rounded-lg" />
            <div className="h-80 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Empty cart check (additional safety)
  if (items.length === 0) {
    return null
  }

  // Convert cart items for components
  const cartItems: CartItem[] = items

  return (
    <div className="container py-8">
      {/* Stepper */}
      <div className="mb-8">
        <CheckoutStepper
          currentStep={step}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Steps content */}
        <div className="lg:col-span-2">
          {step === "address" && (
            <AddressStep
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
              onContinue={handleAddressContinue}
              isLoading={isLoading}
            />
          )}

          {step === "shipping" && selectedAddress && (
            <ShippingStep
              selectedCity={selectedAddress.city}
              detectedZone={detectedZone}
              onBack={() => setStep("address")}
              onContinue={handleShippingContinue}
              freeShipping={freeShipping}
              isLoading={isLoading}
            />
          )}

          {step === "summary" && selectedAddress && detectedZone && (
            <OrderSummaryStep
              cartItems={cartItems}
              selectedAddress={selectedAddress}
              selectedShippingZone={detectedZone}
              subtotal={subtotal}
              discount={discount}
              shippingFee={shippingFee}
              total={total}
              promoCode={promoCode}
              freeShipping={freeShipping}
              onBack={() => setStep("shipping")}
              onEditAddress={() => setStep("address")}
              onEditShipping={() => setStep("shipping")}
              onPlaceOrder={handlePlaceOrder}
            />
          )}
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <CheckoutSummary
            cartItems={cartItems}
            subtotal={subtotal}
            discount={discount}
            shippingFee={step === "address" ? null : shippingFee}
            total={total}
            promoCode={promoCode}
            freeShipping={freeShipping}
            step={step}
          />
        </div>
      </div>
    </div>
  )
}
