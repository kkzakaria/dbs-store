"use client"

import * as React from "react"
import { ArrowLeftIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DialogLoginForm } from "./DialogLoginForm"
import { DialogRegisterForm } from "./DialogRegisterForm"
import { DialogVerifyEmailForm } from "./DialogVerifyEmailForm"
import { DialogForgotPasswordForm } from "./DialogForgotPasswordForm"
import { DialogResetSentView } from "./DialogResetSentView"
import { useAuthStore } from "@/stores/auth-store"

export function AuthDialog() {
  const { isOpen, view, email, close, setView } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  const handleBackToLogin = () => {
    setView("login")
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const isVerifyEmailView = view === "verify-email" && email
  const isForgotPasswordView = view === "forgot-password"
  const isResetSentView = view === "reset-sent"

  // Special views (not tabbed)
  if (isVerifyEmailView || isForgotPasswordView || isResetSentView) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {isVerifyEmailView && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={handleBackToLogin}
                  >
                    <ArrowLeftIcon className="size-4" />
                    <span className="sr-only">Retour</span>
                  </Button>
                  <div>
                    <DialogTitle>Vérification de l&apos;email</DialogTitle>
                    <DialogDescription>
                      Entrez le code reçu par email
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <DialogVerifyEmailForm />
            </>
          )}

          {isForgotPasswordView && <DialogForgotPasswordForm />}

          {isResetSentView && <DialogResetSentView />}
        </DialogContent>
      </Dialog>
    )
  }

  // Default tabbed view (login/register)
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle>Bienvenue sur DBS Store</DialogTitle>
          <DialogDescription>
            Connectez-vous ou créez un compte pour continuer
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={view === "register" ? "register" : "login"}
          onValueChange={(value) => setView(value as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-6">
            <DialogLoginForm />
          </TabsContent>
          <TabsContent value="register" className="mt-6">
            <DialogRegisterForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
