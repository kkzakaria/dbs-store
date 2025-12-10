"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingSpinner } from "@/components/shared/Loading"
import { signInWithEmail } from "@/actions/auth"
import { emailLoginSchema, type EmailLoginInput } from "@/lib/validations/auth"
import { useAuthStore } from "@/stores/auth-store"
import { OAuthButtons } from "./OAuthButtons"
import { toast } from "sonner"

export function DialogLoginForm() {
  const { close, setView, setEmail } = useAuthStore()
  const id = React.useId()

  const form = useForm<EmailLoginInput>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const { execute, status } = useAction(signInWithEmail, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Connexion réussie !", {
          description: "Bienvenue sur DBS Store.",
        })
        close()
        window.location.reload()
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

  const handleForgotPassword = () => {
    const email = form.getValues("email")
    setEmail(email || null)
    setView("forgot-password")
  }

  return (
    <div className="space-y-6">
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-remember`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`${id}-remember`}
                    className="text-sm font-normal text-muted-foreground cursor-pointer"
                  >
                    Se souvenir de moi
                  </Label>
                </div>
              )}
            />
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={handleForgotPassword}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Connexion...</span>
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </Form>

      <OAuthButtons />
    </div>
  )
}
