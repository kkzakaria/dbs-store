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
  type DeliveryMethod,
} from "@/components/store/checkout"
import {
  getShippingZoneByCity,
  validatePromoForCheckout,
  getClosestStore,
} from "@/actions/checkout"
import type { Address, ShippingZone, CartItem, Store } from "@/types"

interface CheckoutClientProps {
  addresses: Address[]
  stores: Store[]
  promoCode: string | null
}

export function CheckoutClient({
  addresses: initialAddresses,
  stores,
  promoCode: initialPromoCode,
}: CheckoutClientProps) {
  const router = useRouter()

  // Cart state
  const items = useCartStore((state) => state.items)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const isHydrated = useCartStore((state) => state.isHydrated)

  // Checkout state
  const [step, setStep] = React.useState<CheckoutStep>("address")
  const [addresses, setAddresses] = React.useState<Address[]>(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = React.useState<
    string | null
  >(null)
  const [detectedZone, setDetectedZone] = React.useState<ShippingZone | null>(
    null
  )
  const [deliveryMethod, setDeliveryMethod] =
    React.useState<DeliveryMethod>("pickup")
  const [selectedStore, setSelectedStore] = React.useState<Store | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Promo state
  const [promoCode, setPromoCode] = React.useState<string | null>(
    initialPromoCode
  )
  const [discount, setDiscount] = React.useState(0)
  const [freeShipping, setFreeShipping] = React.useState(false)
  const [promoValidated, setPromoValidated] = React.useState(false)

  // Computed values
  const subtotal = getSubtotal()
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || null

  // Shipping fee: 0 for pickup, zone fee for delivery (unless free shipping promo)
  const shippingFee = React.useMemo(() => {
    if (deliveryMethod === "pickup") return 0
    if (freeShipping) return 0
    return detectedZone?.fee || 0
  }, [deliveryMethod, freeShipping, detectedZone])

  const total = subtotal - discount + (step !== "address" ? shippingFee : 0)

  // Completed steps
  const completedSteps = React.useMemo(() => {
    const completed = new Set<CheckoutStep>()
    if (selectedAddressId && step !== "address") {
      completed.add("address")
    }
    // Shipping is complete if pickup with store OR delivery with valid zone
    if (step === "summary") {
      if ((deliveryMethod === "pickup" && selectedStore) || detectedZone) {
        completed.add("shipping")
      }
    }
    return completed
  }, [selectedAddressId, detectedZone, deliveryMethod, selectedStore, step])

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

  // Auto-detect shipping zone and closest store when entering shipping step
  React.useEffect(() => {
    async function detectShippingAndStore() {
      if (!selectedAddress) return

      setIsLoading(true)

      // Fetch shipping zone for delivery
      const zoneResult = await getShippingZoneByCity(selectedAddress.city)
      setDetectedZone(zoneResult.zone)

      // Fetch closest store for pickup (based on commune/city)
      const storeResult = await getClosestStore(
        selectedAddress.commune || null,
        selectedAddress.city
      )
      if (storeResult.store && !selectedStore) {
        setSelectedStore(storeResult.store)
      }

      setIsLoading(false)
    }

    if (selectedAddressId && step === "shipping") {
      detectShippingAndStore()
    }
  }, [selectedAddressId, selectedAddress, step, selectedStore])

  // Step handlers
  const handleAddressContinue = () => {
    if (selectedAddressId) {
      setStep("shipping")
    }
  }

  const handleShippingContinue = () => {
    // Can continue if pickup selected with store OR if delivery with valid zone
    if ((deliveryMethod === "pickup" && selectedStore) || detectedZone) {
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

  // Handle address selection from dialog (used in summary step)
  const handleSelectAddressFromDialog = async (address: Address) => {
    setSelectedAddressId(address.id)

    // Re-detect shipping zone if city changed
    if (selectedAddress && selectedAddress.city !== address.city) {
      const zoneResult = await getShippingZoneByCity(address.city)
      setDetectedZone(zoneResult.zone)
    }
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
              deliveryMethod={deliveryMethod}
              stores={stores}
              selectedStore={selectedStore}
              onSelectMethod={setDeliveryMethod}
              onSelectStore={setSelectedStore}
              onBack={() => setStep("address")}
              onContinue={handleShippingContinue}
              freeShipping={freeShipping}
              isLoading={isLoading}
            />
          )}

          {step === "summary" && selectedAddress && (
            <OrderSummaryStep
              cartItems={cartItems}
              selectedAddress={selectedAddress}
              selectedShippingZone={
                deliveryMethod === "delivery" ? detectedZone : null
              }
              selectedStore={deliveryMethod === "pickup" ? selectedStore : null}
              deliveryMethod={deliveryMethod}
              subtotal={subtotal}
              discount={discount}
              shippingFee={shippingFee}
              total={total}
              promoCode={promoCode}
              freeShipping={freeShipping}
              onBack={() => setStep("shipping")}
              onPlaceOrder={handlePlaceOrder}
              addresses={addresses}
              stores={stores}
              onSelectAddress={handleSelectAddressFromDialog}
              onAddressesChange={setAddresses}
              onSelectDeliveryMethod={setDeliveryMethod}
              onSelectStore={setSelectedStore}
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
            freeShipping={deliveryMethod === "delivery" && freeShipping}
            step={step}
          />
        </div>
      </div>
    </div>
  )
}
