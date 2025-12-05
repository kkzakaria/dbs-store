"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createPromotion, updatePromotion } from "@/actions/admin/promotions"
import { adminPromotionSchema, type AdminPromotionInput } from "@/lib/validations/admin"
import { toast } from "sonner"

type Promotion = {
  id: string
  code: string
  name: string
  description: string | null
  type: "percentage" | "fixed_amount" | "free_shipping"
  value: number
  min_purchase: number | null
  max_discount: number | null
  max_uses: number | null
  max_uses_per_user: number | null
  starts_at: string
  ends_at: string
  is_active: boolean | null
}

interface PromotionFormProps {
  promotion?: Promotion
  isEditing?: boolean
}

export function PromotionForm({ promotion, isEditing = false }: PromotionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Format dates for input
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16)
  }

  const form = useForm<AdminPromotionInput>({
    resolver: zodResolver(adminPromotionSchema),
    defaultValues: {
      code: promotion?.code || "",
      name: promotion?.name || "",
      description: promotion?.description || "",
      type: promotion?.type || "percentage",
      value: promotion?.value || 0,
      min_purchase: promotion?.min_purchase ?? 0,
      max_discount: promotion?.max_discount ?? undefined,
      max_uses: promotion?.max_uses ?? undefined,
      max_uses_per_user: promotion?.max_uses_per_user ?? 1,
      starts_at: formatDateForInput(promotion?.starts_at) || formatDateForInput(new Date().toISOString()),
      ends_at: formatDateForInput(promotion?.ends_at) || "",
      is_active: promotion?.is_active ?? true,
    },
  })

  const watchType = form.watch("type")

  const onSubmit = (data: AdminPromotionInput) => {
    startTransition(async () => {
      const result = isEditing && promotion
        ? await updatePromotion({ ...data, id: promotion.id })
        : await createPromotion(data)

      if (result?.data?.success) {
        toast.success(isEditing ? "Promotion mise à jour" : "Promotion créée")
        router.push("/admin/promotions")
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Une erreur est survenue")
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Configurez le code et les détails de la promotion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code promo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SUMMER2024"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                      />
                    </FormControl>
                    <FormDescription>
                      Le code que les clients utiliseront
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Soldes d'été" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description de la promotion..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        La promotion sera utilisable si active et dans la période valide
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Discount Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Réduction</CardTitle>
              <CardDescription>
                Configurez le type et la valeur de la réduction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de réduction *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        <SelectItem value="fixed_amount">Montant fixe (FCFA)</SelectItem>
                        <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType !== "free_shipping" && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valeur * {watchType === "percentage" ? "(%)" : "(FCFA)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={watchType === "percentage" ? 100 : undefined}
                          {...field}
                          value={typeof field.value === "number" ? field.value : 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="min_purchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achat minimum (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Montant minimum du panier pour appliquer la promo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === "percentage" && (
                <FormField
                  control={form.control}
                  name="max_discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Réduction maximum (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Illimité"
                          {...field}
                          value={typeof field.value === "number" ? field.value : ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Plafond de la réduction en pourcentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Usage Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Limites d'utilisation</CardTitle>
              <CardDescription>
                Configurez le nombre d'utilisations autorisées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="max_uses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre max d'utilisations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Illimité"
                        {...field}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre total d'utilisations possibles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_uses_per_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utilisations par client</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Illimité"
                        {...field}
                        value={typeof field.value === "number" ? field.value : ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre de fois qu'un client peut utiliser ce code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle>Période de validité</CardTitle>
              <CardDescription>
                Définissez quand la promotion est active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Mettre à jour" : "Créer la promotion"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
