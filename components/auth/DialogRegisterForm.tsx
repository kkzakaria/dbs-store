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
import { PhoneInput } from "./PhoneInput"
import { LoadingSpinner } from "@/components/shared/Loading"
import { signUp } from "@/actions/auth"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

export function DialogRegisterForm() {
  const { openVerifyOTP } = useAuthStore()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  })

  const { execute, status } = useAction(signUp, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.phone) {
        toast.success("Compte créé !", {
          description: "Vérifiez votre téléphone pour le code de vérification.",
        })
        openVerifyOTP(result.data.phone)
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

  const onSubmit = (data: RegisterInput) => {
    execute(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input
                  placeholder="Jean Dupont"
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={isLoading}
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
  )
}
