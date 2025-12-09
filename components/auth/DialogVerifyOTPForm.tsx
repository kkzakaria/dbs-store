"use client"

import * as React from "react"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
import { OTPInput } from "./OTPInput"
import { LoadingSpinner } from "@/components/shared/Loading"
import { upsertUserProfile, resendOTP } from "@/actions/auth"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

export function DialogVerifyOTPForm() {
  const { phone, reset } = useAuthStore()
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

  // Server action to upsert user profile after successful verification
  const { execute: executeUpsert } = useAction(upsertUserProfile, {
    onSuccess: () => {
      // Profile upserted, continue with redirect
    },
    onError: (err) => {
      console.error("Upsert error:", err)
      // Don't block login on upsert error
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

  const isResending = resendStatus === "executing"

  const handleVerifyOTP = async (token: string) => {
    if (!phone) return

    setIsVerifying(true)
    setError("")

    try {
      // Use browser client to verify OTP - this properly sets cookies
      const supabase = createClient()
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      })

      if (verifyError) {
        console.error("Verify OTP error:", verifyError)
        // Handle specific error messages
        if (verifyError.message?.includes("expired") || verifyError.message?.includes("invalid")) {
          setError("Code invalide ou expiré. Veuillez réessayer.")
        } else if (verifyError.message?.includes("unexpected")) {
          setError("Erreur de connexion au serveur. Veuillez réessayer.")
        } else {
          setError(verifyError.message || "Code invalide ou expiré. Veuillez réessayer.")
        }
        setCode("")
        setIsVerifying(false)
        return
      }

      if (data.user) {
        // Upsert user profile in background (don't wait)
        executeUpsert({ phone })

        toast.success("Connexion réussie !", {
          description: "Bienvenue sur DBS Store.",
        })

        // Close the dialog and reset state
        reset()

        // Use window.location for a full page reload to ensure cookies are properly sent
        // This avoids race conditions between router.push() and middleware redirects
        window.location.href = "/"
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
      setCode("")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    setError("")

    // Auto-submit when code is complete
    if (newCode.length === 6) {
      handleVerifyOTP(newCode)
    }
  }

  const handleResend = () => {
    if (countdown > 0 || !phone) return
    executeResend({ phone })
  }

  if (!phone) {
    return null
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
