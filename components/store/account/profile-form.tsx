"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateProfile } from "@/actions/auth"
import { profileSchema, type ProfileInput, formatPhoneForDisplay } from "@/lib/validations/auth"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface ProfileFormProps {
  user: {
    full_name: string | null
    email: string | null
    phone: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.full_name || "",
      email: user.email || "",
    },
  })

  const { execute, isExecuting } = useAction(updateProfile, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Profil mis à jour avec succès")
      } else if (result.data?.error) {
        toast.error(result.data.error)
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue")
    },
  })

  const onSubmit = (data: ProfileInput) => {
    execute(data)
  }

  const isDirty = form.formState.isDirty

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
                <Input placeholder="Votre nom complet" {...field} />
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
                  placeholder="votre@email.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Pour recevoir les notifications de commande (optionnel)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Téléphone</FormLabel>
          <Input
            value={user.phone ? formatPhoneForDisplay(user.phone) : ""}
            disabled
            className="bg-muted"
          />
          <FormDescription>
            Le numéro de téléphone ne peut pas être modifié
          </FormDescription>
        </FormItem>

        <Button type="submit" disabled={isExecuting || !isDirty}>
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Enregistrer
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
