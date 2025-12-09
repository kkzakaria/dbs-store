"use client"

import { MailIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"

// Mask email for privacy display (e.g., "j***@example.com")
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email

  if (local.length <= 2) {
    return `${local}***@${domain}`
  }

  return `${local[0]}***@${domain}`
}

export function DialogResetSentView() {
  const { email, setView, close } = useAuthStore()

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <MailIcon className="size-6 text-primary" />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Vérifiez votre boîte mail</h3>
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec l&apos;adresse{" "}
          <span className="font-medium text-foreground">
            {email ? maskEmail(email) : "fournie"}
          </span>
          , vous recevrez un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full" onClick={() => setView("login")}>
          Retour à la connexion
        </Button>
        <Button variant="ghost" className="w-full" onClick={close}>
          Fermer
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Vous n&apos;avez pas reçu l&apos;email ? Vérifiez votre dossier spam ou{" "}
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => setView("forgot-password")}
        >
          réessayez avec une autre adresse
        </button>
      </p>
    </div>
  )
}
