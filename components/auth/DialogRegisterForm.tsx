"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
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
import { signUpWithEmail } from "@/actions/auth"
import { emailRegisterSchema, type EmailRegisterInput } from "@/lib/validations/auth"
import { useAuthStore } from "@/stores/auth-store"
import { OAuthButtons } from "./OAuthButtons"
import { toast } from "sonner"

export function DialogRegisterForm() {
  const { close, openVerifyEmail } = useAuthStore()

  const form = useForm<EmailRegisterInput>({
    resolver: zodResolver(emailRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { execute, status } = useAction(signUpWithEmail, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.email) {
        if (result.data.emailConfirmationRequired) {
          toast.success("Compte créé !", {
            description: "Vérifiez votre email pour le code de confirmation.",
          })
          openVerifyEmail(result.data.email)
        } else {
          toast.success("Compte créé !", {
            description: "Bienvenue sur DBS Store.",
          })
          close()
          window.location.reload()
        }
      } else if (result.data?.error) {
        toast.error("Erreur", {
          description: result.data.error,
        })
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => execute(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirmez votre mot de passe"
                    autoComplete="new-password"
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
                <span>Création en cours...</span>
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>
      </Form>

      <OAuthButtons />
    </div>
  )
}
