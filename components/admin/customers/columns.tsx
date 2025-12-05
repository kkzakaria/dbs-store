"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User, Phone, Mail, ShoppingBag, Award } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table"
import { formatPrice } from "@/lib/config"

type Customer = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  loyalty_points: number | null
  created_at: string | null
  orders_count: number
  total_spent: number
}

export function getCustomerColumns(): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Client" />
      ),
      cell: ({ row }) => {
        const { full_name, email } = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{full_name || "Sans nom"}</div>
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
      accessorKey: "orders_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Commandes" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{row.original.orders_count}</span>
        </div>
      ),
    },
    {
      accessorKey: "total_spent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total dépensé" />
      ),
      cell: ({ row }) => (
        <span className="font-mono font-bold">
          {formatPrice(row.original.total_spent)}
        </span>
      ),
    },
    {
      accessorKey: "loyalty_points",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Points fidélité" />
      ),
      cell: ({ row }) => {
        const points = row.original.loyalty_points || 0
        return (
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="font-mono">{points}</span>
          </div>
        )
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
  ]
}
