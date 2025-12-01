"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
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
import { sendOTP } from "@/actions/auth"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
    },
  })

  const { execute, status } = useAction(sendOTP, {
    onSuccess: (result) => {
      if (result.data?.success && result.data.phone) {
        toast.success("Code envoyé !", {
          description: "Vérifiez votre téléphone pour le code de vérification.",
        })
        router.push(`/verify-otp?phone=${encodeURIComponent(result.data.phone)}`)
      } else if (result.data?.error) {
        toast.error("Erreur", {
          description: result.data.error,
        })
      }
    },
    onError: (error) => {
      toast.error("Erreur", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    },
  })

  const isLoading = status === "executing"

  const onSubmit = (data: LoginInput) => {
    execute(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <span>Envoi en cours...</span>
            </>
          ) : (
            "Recevoir le code"
          )}
        </Button>
      </form>
    </Form>
  )
}
