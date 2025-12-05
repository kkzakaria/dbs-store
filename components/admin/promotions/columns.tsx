"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Power, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table"
import { formatPrice } from "@/lib/config"
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
  used_count: number | null
  starts_at: string
  ends_at: string
  is_active: boolean | null
}

interface PromotionColumnsProps {
  onEdit?: (promotion: Promotion) => void
  onDelete?: (promotion: Promotion) => void
  onToggleStatus?: (promotion: Promotion) => void
}

const TYPE_LABELS: Record<string, string> = {
  percentage: "Pourcentage",
  fixed_amount: "Montant fixe",
  free_shipping: "Livraison gratuite",
}

function getPromotionStatus(promotion: Promotion) {
  const now = new Date()
  const start = new Date(promotion.starts_at)
  const end = new Date(promotion.ends_at)

  if (!promotion.is_active) {
    return { label: "Inactive", variant: "secondary" as const }
  }
  if (now < start) {
    return { label: "Programmée", variant: "outline" as const }
  }
  if (now > end) {
    return { label: "Expirée", variant: "destructive" as const }
  }
  return { label: "Active", variant: "default" as const }
}

export function getPromotionColumns({
  onEdit,
  onDelete,
  onToggleStatus,
}: PromotionColumnsProps = {}): ColumnDef<Promotion>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Code" />
      ),
      cell: ({ row }) => {
        const code = row.original.code
        return (
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-bold">
              {code}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                navigator.clipboard.writeText(code)
                toast.success("Code copié")
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nom" />
      ),
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {TYPE_LABELS[row.original.type] || row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "value",
      header: "Réduction",
      cell: ({ row }) => {
        const { type, value } = row.original
        if (type === "percentage") {
          return <span className="font-mono font-bold">{value}%</span>
        }
        if (type === "fixed_amount") {
          return <span className="font-mono font-bold">{formatPrice(value)}</span>
        }
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: "min_purchase",
      header: "Achat min.",
      cell: ({ row }) => {
        const min = row.original.min_purchase
        return min ? (
          <span className="font-mono text-sm">{formatPrice(min)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      id: "usage",
      header: "Utilisation",
      cell: ({ row }) => {
        const { used_count, max_uses } = row.original
        const used = used_count || 0
        const max = max_uses

        return (
          <div className="font-mono text-sm">
            {used}
            {max && <span className="text-muted-foreground">/{max}</span>}
          </div>
        )
      },
    },
    {
      id: "period",
      header: "Période",
      cell: ({ row }) => {
        const start = new Date(row.original.starts_at)
        const end = new Date(row.original.ends_at)
        const dateFormat = new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "short",
        })

        return (
          <div className="text-sm">
            <div>{dateFormat.format(start)}</div>
            <div className="text-muted-foreground">→ {dateFormat.format(end)}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "is_active",
      id: "is_active",
      header: "Statut",
      cell: ({ row }) => {
        const status = getPromotionStatus(row.original)
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
      filterFn: (row, id, value) => {
        if (!value || value.length === 0) return true
        const isActive = row.getValue(id)
        return value.includes(String(isActive))
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const promotion = row.original
        const isActive = promotion.is_active

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(promotion)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus?.(promotion)}>
                <Power className="mr-2 h-4 w-4" />
                {isActive ? "Désactiver" : "Activer"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(promotion)}
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
