import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAddresses } from "@/actions/addresses"
import { getStores } from "@/actions/checkout"
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

  // Fetch user addresses and stores in parallel
  const [{ addresses }, { stores }] = await Promise.all([
    getAddresses(),
    getStores(),
  ])

  return (
    <CheckoutClient
      addresses={addresses}
      stores={stores}
      promoCode={params.promo || null}
    />
  )
}
