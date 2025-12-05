"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createShippingZone, updateShippingZone } from "@/actions/admin/settings"
import { adminShippingZoneSchema, type AdminShippingZoneInput } from "@/lib/validations/admin"
import { toast } from "sonner"
import { useState } from "react"

type ShippingZone = {
  id: string
  name: string
  cities: string[]
  fee: number
  estimated_days: string | null
  is_active: boolean | null
}

interface ShippingZoneFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone?: ShippingZone | null
}

export function ShippingZoneForm({ open, onOpenChange, zone }: ShippingZoneFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [cityInput, setCityInput] = useState("")
  const isEditing = !!zone

  const form = useForm<AdminShippingZoneInput>({
    resolver: zodResolver(adminShippingZoneSchema),
    defaultValues: {
      name: zone?.name || "",
      cities: zone?.cities || [],
      fee: zone?.fee || 0,
      estimated_days: zone?.estimated_days || "",
      is_active: zone?.is_active ?? true,
    },
  })

  // Reset form when zone changes
  const handleOpenChange = (open: boolean) => {
    if (open && zone) {
      form.reset({
        name: zone.name,
        cities: zone.cities,
        fee: zone.fee,
        estimated_days: zone.estimated_days || "",
        is_active: zone.is_active ?? true,
      })
    } else if (open && !zone) {
      form.reset({
        name: "",
        cities: [],
        fee: 0,
        estimated_days: "",
        is_active: true,
      })
    }
    setCityInput("")
    onOpenChange(open)
  }

  const onSubmit = (data: AdminShippingZoneInput) => {
    startTransition(async () => {
      const result = isEditing && zone
        ? await updateShippingZone({ ...data, id: zone.id })
        : await createShippingZone(data)

      if (result?.data?.success) {
        toast.success(isEditing ? "Zone mise à jour" : "Zone créée")
        handleOpenChange(false)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Une erreur est survenue")
      }
    })
  }

  const addCity = () => {
    if (cityInput.trim()) {
      const currentCities = form.getValues("cities")
      if (!currentCities.includes(cityInput.trim())) {
        form.setValue("cities", [...currentCities, cityInput.trim()])
      }
      setCityInput("")
    }
  }

  const removeCity = (city: string) => {
    const currentCities = form.getValues("cities")
    form.setValue(
      "cities",
      currentCities.filter((c) => c !== city)
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la zone" : "Nouvelle zone de livraison"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la zone de livraison"
              : "Créez une nouvelle zone de livraison"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la zone *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Abidjan Centre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Villes *</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter une ville..."
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCity()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCity}>
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(field.value || []).map((city) => (
                      <Badge
                        key={city}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {city}
                        <button
                          type="button"
                          onClick={() => removeCity(city)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    Ajoutez les villes couvertes par cette zone
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frais de livraison (FCFA) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={typeof field.value === "number" ? field.value : 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Délai estimé</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1-2 jours" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      La zone sera disponible pour les clients
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
