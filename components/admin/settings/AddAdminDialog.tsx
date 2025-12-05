"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Search, User, Mail, Phone, Shield, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { searchCustomersForPromotion, promoteToAdmin } from "@/actions/admin/users"
import { toast } from "sonner"

type Customer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

interface AddAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAdminDialog({ open, onOpenChange }: AddAdminDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedRole, setSelectedRole] = useState<"admin" | "super_admin">("admin")
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Search customers with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (value.length < 2) {
      setCustomers([])
      return
    }

    // Debounce search
    const timeout = setTimeout(() => {
      setIsSearching(true)
      searchCustomersForPromotion({ search: value }).then((result) => {
        setIsSearching(false)
        if (result?.data?.customers) {
          setCustomers(result.data.customers)
        }
      })
    }, 300)

    setSearchTimeout(timeout)
  }, [searchTimeout])

  const handleSubmit = () => {
    if (!selectedCustomer) return

    startTransition(async () => {
      const result = await promoteToAdmin({
        userId: selectedCustomer.id,
        role: selectedRole,
      })

      if (result?.data?.success) {
        toast.success(
          `${selectedCustomer.full_name || "Utilisateur"} promu ${selectedRole === "super_admin" ? "Super Admin" : "Admin"}`
        )
        handleClose(false)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la promotion")
      }
    })
  }

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setSearch("")
      setCustomers([])
      setSelectedCustomer(null)
      setSelectedRole("admin")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un administrateur</DialogTitle>
          <DialogDescription>
            Recherchez un client existant pour le promouvoir en administrateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher un client</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom, email ou téléphone..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {customers.length > 0 && !selectedCustomer && (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">
                      {customer.full_name || "Sans nom"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {search.length >= 2 && !isSearching && customers.length === 0 && !selectedCustomer && (
            <p className="text-center text-sm text-muted-foreground">
              Aucun client trouvé
            </p>
          )}

          {/* Selected Customer */}
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {selectedCustomer.full_name || "Sans nom"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCustomer.email || selectedCustomer.phone}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Changer
                </Button>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Rôle à attribuer</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as "admin" | "super_admin")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="admin"
                      id="admin"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="admin"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Shield className="mb-2 h-6 w-6" />
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">
                        Accès limité
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="super_admin"
                      id="super_admin"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="super_admin"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <ShieldCheck className="mb-2 h-6 w-6" />
                      <span className="font-medium">Super Admin</span>
                      <span className="text-xs text-muted-foreground">
                        Tous les droits
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Promotion en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Promouvoir en {selectedRole === "super_admin" ? "Super Admin" : "Admin"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
