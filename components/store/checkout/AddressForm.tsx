"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  addressSchema,
  CITY_GROUPS,
  type AddressInput,
} from "@/lib/validations/checkout"
import { createAddress, updateAddress } from "@/actions/addresses"
import type { Address } from "@/types"

interface AddressFormProps {
  address?: Address | null
  onSuccess: (address: Address) => void
  onCancel: () => void
}

export function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const isEditing = !!address

  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLine: address?.address_line || "",
      city: address?.city || "",
      commune: address?.commune || "",
      landmark: address?.landmark || "",
      isDefault: address?.is_default || false,
    },
  })

  const { execute: executeCreate, isExecuting: isCreating } = useAction(
    createAddress,
    {
      onSuccess: (result) => {
        if (result.data?.error) {
          toast.error(result.data.error)
          return
        }
        if (result.data?.address) {
          toast.success("Adresse ajoutée avec succès")
          onSuccess(result.data.address)
        }
      },
      onError: () => {
        toast.error("Une erreur est survenue")
      },
    }
  )

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(
    updateAddress,
    {
      onSuccess: (result) => {
        if (result.data?.error) {
          toast.error(result.data.error)
          return
        }
        if (result.data?.address) {
          toast.success("Adresse mise à jour avec succès")
          onSuccess(result.data.address)
        }
      },
      onError: () => {
        toast.error("Une erreur est survenue")
      },
    }
  )

  const isLoading = isCreating || isUpdating

  function onSubmit(values: AddressInput) {
    if (isEditing && address) {
      executeUpdate({ id: address.id, ...values })
    } else {
      executeCreate(values)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Address Line */}
        <FormField
          control={form.control}
          name="addressLine"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Rue, Immeuble, Appartement..."
                  className="resize-none"
                  rows={2}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ville</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une ville" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CITY_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Commune */}
        <FormField
          control={form.control}
          name="commune"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Commune <span className="text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Angré, Riviera..."
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Landmark */}
        <FormField
          control={form.control}
          name="landmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Point de repère{" "}
                <span className="text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Près de la pharmacie..."
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Un point de repère facilite la livraison
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Default */}
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Définir comme adresse par défaut
                </FormLabel>
                <FormDescription>
                  Cette adresse sera pré-sélectionnée lors du checkout
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Modifier" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
