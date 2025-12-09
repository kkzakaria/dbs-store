import { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export const metadata: Metadata = {
  title: "Nouveau mot de passe | DBS Store",
  description: "Créez un nouveau mot de passe pour votre compte",
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Créez un nouveau mot de passe pour votre compte
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  )
}
