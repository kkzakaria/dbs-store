import Link from "next/link"
import { redirect } from "next/navigation"
import { VerifyOTPForm } from "@/components/auth/VerifyOTPForm"
import { maskPhone } from "@/lib/validations/auth"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Vérification | DBS Store",
  description: "Entrez le code de vérification envoyé à votre téléphone",
}

interface PageProps {
  searchParams: Promise<{ phone?: string }>
}

export default async function VerifyOtpPage({ searchParams }: PageProps) {
  const params = await searchParams
  const phone = params.phone

  if (!phone) {
    redirect("/login")
  }

  const maskedPhone = maskPhone(phone)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Vérification</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Entrez le code à 6 chiffres envoyé au
        </p>
        <p className="text-sm font-medium mt-1">{maskedPhone}</p>
      </div>

      <VerifyOTPForm phone={phone} />

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
