import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"
import { OAuthButtons } from "@/components/auth/OAuthButtons"

export const metadata = {
  title: "Connexion | DBS Store",
  description: "Connectez-vous à votre compte DBS Store",
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Entrez votre numéro pour recevoir un code de vérification
        </p>
      </div>

      <LoginForm />

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
