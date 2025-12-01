import Link from "next/link"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata = {
  title: "Créer un compte | DBS Store",
  description: "Rejoignez DBS Store et profitez de nos offres exclusives",
}

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Créer un compte
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Rejoignez DBS Store et profitez de nos offres
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
