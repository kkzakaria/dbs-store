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
import { DialogVerifyOTPForm } from "./DialogVerifyOTPForm"
import { useAuthStore } from "@/stores/auth-store"
import { formatPhoneForDisplay } from "@/lib/validations/auth"

export function AuthDialog() {
  const { isOpen, view, phone, close, setView } = useAuthStore()
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

  const isOTPView = view === "verify-otp" && phone

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isOTPView ? (
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
                  <DialogTitle>Vérification</DialogTitle>
                  <DialogDescription>
                    Entrez le code envoyé au {formatPhoneForDisplay(phone!)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <DialogVerifyOTPForm />
          </>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
