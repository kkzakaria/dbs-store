import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAddresses } from "@/actions/addresses"
import { getShippingZones } from "@/actions/checkout"
import { CheckoutClient } from "./checkout-client"

export const metadata = {
  title: "Checkout | DBS Store",
  description: "Finalisez votre commande",
}

interface CheckoutPageProps {
  searchParams: Promise<{
    promo?: string
  }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const supabase = await createClient()
  const params = await searchParams

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with return URL
    const redirectUrl = params.promo
      ? `/checkout?promo=${encodeURIComponent(params.promo)}`
      : "/checkout"
    redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  // Fetch addresses and shipping zones in parallel
  const [addressesResult, shippingResult] = await Promise.all([
    getAddresses(),
    getShippingZones(),
  ])

  return (
    <CheckoutClient
      addresses={addressesResult.addresses}
      shippingZones={shippingResult.zones}
      promoCode={params.promo || null}
    />
  )
}
