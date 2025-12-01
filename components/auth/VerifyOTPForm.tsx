"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
import { OTPInput } from "./OTPInput"
import { LoadingSpinner } from "@/components/shared/Loading"
import { verifyOTP, resendOTP } from "@/actions/auth"
import { toast } from "sonner"

interface VerifyOTPFormProps {
  phone: string
}

export function VerifyOTPForm({ phone }: VerifyOTPFormProps) {
  const router = useRouter()
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [countdown, setCountdown] = React.useState(0)

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const { execute: executeVerify, status: verifyStatus } = useAction(verifyOTP, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Connexion réussie !", {
          description: "Bienvenue sur DBS Store.",
        })
        router.push("/")
        router.refresh()
      } else if (result.data?.error) {
        setError(result.data.error)
        setCode("")
      }
    },
    onError: () => {
      setError("Une erreur est survenue. Veuillez réessayer.")
      setCode("")
    },
  })

  const { execute: executeResend, status: resendStatus } = useAction(resendOTP, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Code renvoyé !", {
          description: "Vérifiez votre téléphone.",
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

  const isVerifying = verifyStatus === "executing"
  const isResending = resendStatus === "executing"

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    setError("")

    // Auto-submit when code is complete
    if (newCode.length === 6) {
      executeVerify({ phone, token: newCode })
    }
  }

  const handleResend = () => {
    if (countdown > 0) return
    executeResend({ phone })
  }

  return (
    <div className="space-y-6">
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
            Vous n'avez pas reçu le code ?
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
