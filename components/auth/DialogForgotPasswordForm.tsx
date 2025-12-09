"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingSpinner } from "@/components/shared/Loading"
import { requestPasswordReset } from "@/actions/auth"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

export function DialogForgotPasswordForm() {
  const { email, setView, openResetSent } = useAuthStore()

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: email || "",
    },
  })

  const { execute, status } = useAction(requestPasswordReset, {
    onSuccess: (result) => {
      if (result.data?.success) {
        const submittedEmail = form.getValues("email")
        openResetSent(submittedEmail)
      }
    },
    onError: () => {
      toast.error("Erreur", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    },
  })

  const isLoading = status === "executing"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setView("login")}
        >
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <h3 className="font-semibold">Mot de passe oublié</h3>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => execute(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
