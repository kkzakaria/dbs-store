"use client"

import * as React from "react"
import { useAction } from "next-safe-action/hooks"
import { Plus, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { AddressCard } from "./AddressCard"
import { AddressForm } from "./AddressForm"
import { deleteAddress, setDefaultAddress } from "@/actions/addresses"
import type { Address } from "@/types"

interface AddressStepProps {
  addresses: Address[]
  selectedAddressId: string | null
  onSelectAddress: (addressId: string) => void
  onContinue: () => void
  isLoading?: boolean
}

export function AddressStep({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onContinue,
  isLoading = false,
}: AddressStepProps) {
  const [showForm, setShowForm] = React.useState(false)
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null)
  const [deletingAddressId, setDeletingAddressId] = React.useState<string | null>(
    null
  )
  const [localAddresses, setLocalAddresses] = React.useState(addresses)

  // Auto-select default address on first load
  React.useEffect(() => {
    if (!selectedAddressId && localAddresses.length > 0) {
      const defaultAddress = localAddresses.find((a) => a.is_default)
      if (defaultAddress) {
        onSelectAddress(defaultAddress.id)
      } else {
        onSelectAddress(localAddresses[0].id)
      }
    }
  }, [localAddresses, selectedAddressId, onSelectAddress])

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteAddress,
    {
      onSuccess: (result) => {
        if (result.data?.error) {
          toast.error(result.data.error)
          return
        }
        toast.success("Adresse supprimée")
        setLocalAddresses((prev) =>
          prev.filter((a) => a.id !== deletingAddressId)
        )
        if (selectedAddressId === deletingAddressId) {
          const remaining = localAddresses.filter(
            (a) => a.id !== deletingAddressId
          )
          if (remaining.length > 0) {
            onSelectAddress(remaining[0].id)
          }
        }
        setDeletingAddressId(null)
      },
      onError: () => {
        toast.error("Une erreur est survenue")
        setDeletingAddressId(null)
      },
    }
  )

  const { execute: executeSetDefault, isExecuting: isSettingDefault } =
    useAction(setDefaultAddress, {
      onSuccess: (result) => {
        if (result.data?.error) {
          toast.error(result.data.error)
          return
        }
        toast.success("Adresse par défaut mise à jour")
        // Update local state
        setLocalAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === result.input?.id,
          }))
        )
      },
      onError: () => {
        toast.error("Une erreur est survenue")
      },
    })

  const handleAddressCreated = (newAddress: Address) => {
    setLocalAddresses((prev) => {
      // If new address is default, update others
      if (newAddress.is_default) {
        return [newAddress, ...prev.map((a) => ({ ...a, is_default: false }))]
      }
      return [newAddress, ...prev]
    })
    setShowForm(false)
    onSelectAddress(newAddress.id)
  }

  const handleAddressUpdated = (updatedAddress: Address) => {
    setLocalAddresses((prev) =>
      prev.map((a) => {
        if (a.id === updatedAddress.id) {
          return updatedAddress
        }
        // If updated address is now default, unset others
        if (updatedAddress.is_default) {
          return { ...a, is_default: false }
        }
        return a
      })
    )
    setEditingAddress(null)
  }

  const handleDelete = (id: string) => {
    setDeletingAddressId(id)
  }

  const confirmDelete = () => {
    if (deletingAddressId) {
      executeDelete({ id: deletingAddressId })
    }
  }

  const canContinue = !!selectedAddressId

  // If no addresses, show form directly
  if (localAddresses.length === 0 && !showForm) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="font-medium text-lg mb-2">
            Aucune adresse enregistrée
          </h3>
          <p className="text-muted-foreground mb-4">
            Ajoutez une adresse de livraison pour continuer
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une adresse
          </Button>
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle adresse</DialogTitle>
              <DialogDescription>
                Ajoutez une adresse de livraison
              </DialogDescription>
            </DialogHeader>
            <AddressForm
              onSuccess={handleAddressCreated}
              onCancel={() => setShowForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Adresse de livraison</h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez ou ajoutez une adresse
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Address list */}
      <div className="grid gap-3">
        {localAddresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={selectedAddressId === address.id}
            onSelect={() => onSelectAddress(address.id)}
            onEdit={() => setEditingAddress(address)}
            onDelete={() => handleDelete(address.id)}
            onSetDefault={() => executeSetDefault({ id: address.id })}
            showActions
            disabled={isLoading || isDeleting || isSettingDefault}
          />
        ))}
      </div>

      {/* Continue button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onContinue}
          disabled={!canContinue || isLoading}
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Continuer
        </Button>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={showForm || !!editingAddress}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditingAddress(null)
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Modifiez les informations de l'adresse"
                : "Ajoutez une adresse de livraison"}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            address={editingAddress}
            onSuccess={editingAddress ? handleAddressUpdated : handleAddressCreated}
            onCancel={() => {
              setShowForm(false)
              setEditingAddress(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingAddressId}
        onOpenChange={(open) => !open && setDeletingAddressId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;adresse ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;adresse sera définitivement
              supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
