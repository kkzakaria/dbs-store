"use client"

import * as React from "react"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
import { OTPInput } from "./OTPInput"
import { LoadingSpinner } from "@/components/shared/Loading"
import { verifyEmailOtp, resendEmailOtp } from "@/actions/auth"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

// Mask email for privacy display (e.g., "j***@example.com")
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email

  if (local.length <= 2) {
    return `${local}***@${domain}`
  }

  return `${local[0]}***@${domain}`
}

export function DialogVerifyEmailForm() {
  const { email, reset } = useAuthStore()
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [countdown, setCountdown] = React.useState(0)
  const [isVerifying, setIsVerifying] = React.useState(false)

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const { execute: executeVerify } = useAction(verifyEmailOtp, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Email vérifié !", {
          description: "Bienvenue sur DBS Store.",
        })
        reset()
        window.location.href = "/"
      } else if (result.data?.error) {
        setError(result.data.error)
        setCode("")
        setIsVerifying(false)
      }
    },
    onError: () => {
      setError("Une erreur est survenue. Veuillez réessayer.")
      setCode("")
      setIsVerifying(false)
    },
  })

  const { execute: executeResend, status: resendStatus } = useAction(resendEmailOtp, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Code renvoyé !", {
          description: "Vérifiez votre boîte email.",
        })
        setCountdown(60)
        setError("")
      } else if (result.data?.error) {
        toast.error("Erreur", {
          description: result.data.error,
        })
      }
    },
    onError: () => {
      toast.error("Erreur", {
        description: "Impossible de renvoyer le code.",
      })
    },
  })

  const isResending = resendStatus === "executing"

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    setError("")

    // Auto-submit when code is complete
    if (newCode.length === 6 && email) {
      setIsVerifying(true)
      executeVerify({ email, token: newCode })
    }
  }

  const handleResend = () => {
    if (countdown > 0 || !email) return
    executeResend({ email })
  }

  if (!email) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-muted-foreground">
        Un code de vérification a été envoyé à{" "}
        <span className="font-medium text-foreground">{maskEmail(email)}</span>
      </div>

      <OTPInput
        value={code}
        onChange={handleCodeChange}
        error={error}
        disabled={isVerifying}
        autoFocus
      />

      <div className="flex flex-col items-center gap-4">
        {isVerifying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span>Vérification en cours...</span>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Vous n&apos;avez pas reçu le code ?
          </p>
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
          >
            {isResending ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Envoi en cours...</span>
              </>
            ) : countdown > 0 ? (
              `Renvoyer dans ${countdown}s`
            ) : (
              "Renvoyer le code"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
