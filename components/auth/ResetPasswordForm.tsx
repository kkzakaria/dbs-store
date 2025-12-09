"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { updatePassword } from "@/actions/auth"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth"
import { toast } from "sonner"

export function ResetPasswordForm() {
  const router = useRouter()

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const { execute, status } = useAction(updatePassword, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Mot de passe mis à jour !", {
          description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
        })
        router.push("/")
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => execute(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nouveau mot de passe</FormLabel>
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

        <div className="text-xs text-muted-foreground">
          Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Mise à jour...</span>
            </>
          ) : (
            "Mettre à jour le mot de passe"
          )}
        </Button>
      </form>
    </Form>
  )
}
