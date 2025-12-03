"use client"

import { MapPin, Phone, Star, Pencil, Trash2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPhoneForDisplay } from "@/lib/validations/auth"
import type { Address } from "@/types"

interface AddressCardProps {
  address: Address
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
  showActions?: boolean
  disabled?: boolean
}

export function AddressCard({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = false,
  disabled = false,
}: AddressCardProps) {
  const hasActions = showActions && (onEdit || onDelete || onSetDefault)

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={!disabled && onSelect ? onSelect : undefined}
      onKeyDown={(e) => {
        if (!disabled && onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "relative rounded-lg border p-4 transition-all",
        onSelect && !disabled && "cursor-pointer hover:border-primary/50",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {/* Default badge */}
      {address.is_default && (
        <Badge
          variant="secondary"
          className="absolute right-2 top-2 gap-1 text-xs"
        >
          <Star className="h-3 w-3 fill-current" />
          Par défaut
        </Badge>
      )}

      {/* Actions dropdown */}
      {hasActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-2 h-8 w-8",
                address.is_default ? "top-10" : "top-2"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
            )}
            {onSetDefault && !address.is_default && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onSetDefault()
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                Définir par défaut
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Selection indicator */}
      {onSelect && (
        <div
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 transition-colors",
            isSelected
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && (
            <div className="absolute inset-1 rounded-full bg-primary-foreground" />
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn("space-y-2", onSelect && "pl-8")}>
        {/* Name */}
        <p className="font-medium">{address.full_name}</p>

        {/* Phone */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{formatPhoneForDisplay(address.phone)}</span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>
            <p>{address.address_line}</p>
            <p>
              {address.city}
              {address.commune && `, ${address.commune}`}
            </p>
            {address.landmark && (
              <p className="text-xs italic">Repère: {address.landmark}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
