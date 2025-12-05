"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User, Phone, Mail, Shield, ShieldCheck, MoreHorizontal, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table"

export type AdminUser = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: "admin" | "super_admin" | null
  created_at: string | null
  avatar_url: string | null
}

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "destructive" }> = {
  admin: { label: "Admin", variant: "default" },
  super_admin: { label: "Super Admin", variant: "destructive" },
}

interface GetAdminUsersColumnsProps {
  currentUserId: string
  currentUserRole: string | null
  onRoleChange: (user: AdminUser, newRole: "admin" | "super_admin") => void
  onDelete: (user: AdminUser) => void
}

export function getAdminUsersColumns({
  currentUserId,
  currentUserRole,
  onRoleChange,
  onDelete,
}: GetAdminUsersColumnsProps): ColumnDef<AdminUser>[] {
  const isSuperAdmin = currentUserRole === "super_admin"

  return [
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Utilisateur" />
      ),
      cell: ({ row }) => {
        const { full_name, email, id } = row.original
        const isCurrentUser = id === currentUserId
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">
                {full_name || "Sans nom"}
                {isCurrentUser && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(vous)</span>
                )}
              </div>
              {email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {email}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => {
        const phone = row.original.phone
        return phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Rôle",
      cell: ({ row }) => {
        const role = row.original.role
        const config = role ? ROLE_LABELS[role] : ROLE_LABELS.admin
        return (
          <Badge variant={config.variant}>
            {role === "super_admin" ? (
              <ShieldCheck className="mr-1 h-3 w-3" />
            ) : (
              <Shield className="mr-1 h-3 w-3" />
            )}
            {config.label}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inscrit le" />
      ),
      cell: ({ row }) => {
        const date = row.original.created_at
        return date ? (
          <span className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : (
          "-"
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const isCurrentUser = user.id === currentUserId
        const canChangeRole = isSuperAdmin && !isCurrentUser

        if (!canChangeRole) {
          return null
        }

        const newRole = user.role === "super_admin" ? "admin" : "super_admin"

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRoleChange(user, newRole)}>
                {user.role === "super_admin" ? (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Rétrograder en Admin
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Promouvoir Super Admin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
