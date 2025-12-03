"use client"

import * as React from "react"
import { useAction } from "next-safe-action/hooks"
import { Plus, Loader2 } from "lucide-react"
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

interface AddressSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addresses: Address[]
  selectedAddressId: string | null
  onSelectAddress: (address: Address) => void
  onAddressesChange: (addresses: Address[]) => void
}

export function AddressSelectDialog({
  open,
  onOpenChange,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddressesChange,
}: AddressSelectDialogProps) {
  const [showForm, setShowForm] = React.useState(false)
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null)
  const [deletingAddressId, setDeletingAddressId] = React.useState<string | null>(null)

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteAddress,
    {
      onSuccess: (result) => {
        if (result.data?.error) {
          toast.error(result.data.error)
          return
        }
        toast.success("Adresse supprimée")
        const updated = addresses.filter((a) => a.id !== deletingAddressId)
        onAddressesChange(updated)
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
        const updated = addresses.map((a) => ({
          ...a,
          is_default: a.id === result.input?.id,
        }))
        onAddressesChange(updated)
      },
      onError: () => {
        toast.error("Une erreur est survenue")
      },
    })

  const handleAddressCreated = (newAddress: Address) => {
    let updated: Address[]
    if (newAddress.is_default) {
      updated = [newAddress, ...addresses.map((a) => ({ ...a, is_default: false }))]
    } else {
      updated = [newAddress, ...addresses]
    }
    onAddressesChange(updated)
    setShowForm(false)
    onSelectAddress(newAddress)
    onOpenChange(false)
  }

  const handleAddressUpdated = (updatedAddress: Address) => {
    const updated = addresses.map((a) => {
      if (a.id === updatedAddress.id) {
        return updatedAddress
      }
      if (updatedAddress.is_default) {
        return { ...a, is_default: false }
      }
      return a
    })
    onAddressesChange(updated)
    setEditingAddress(null)
    // If the updated address is currently selected, update it
    if (selectedAddressId === updatedAddress.id) {
      onSelectAddress(updatedAddress)
    }
  }

  const handleSelect = (address: Address) => {
    onSelectAddress(address)
    onOpenChange(false)
  }

  const confirmDelete = () => {
    if (deletingAddressId) {
      executeDelete({ id: deletingAddressId })
    }
  }

  return (
    <>
      <Dialog open={open && !showForm && !editingAddress} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Changer l&apos;adresse</DialogTitle>
            <DialogDescription>
              Sélectionnez une adresse de livraison
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Aucune adresse enregistrée
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une adresse
                </Button>
              </div>
            ) : (
              <>
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isSelected={selectedAddressId === address.id}
                    onSelect={() => handleSelect(address)}
                    onEdit={() => setEditingAddress(address)}
                    onDelete={() => setDeletingAddressId(address.id)}
                    onSetDefault={() => executeSetDefault({ id: address.id })}
                    showActions
                    disabled={isDeleting || isSettingDefault}
                    compact
                  />
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une nouvelle adresse
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
