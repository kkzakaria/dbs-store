"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Truck, CreditCard, Package } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table"
import { ClientOnly } from "@/components/shared/ClientOnly"
import { formatPrice } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ORDER_STATUSES, PAYMENT_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/validations/admin"
import type { Database } from "@/types/database.types"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  user?: {
    id: string
    full_name: string | null
    phone: string | null
    email: string | null
  } | null
  items?: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product_snapshot: unknown
  }> | null
}

interface OrderColumnsProps {
  onUpdateStatus?: (id: string, status: string) => void
  onUpdatePaymentStatus?: (id: string, status: string) => void
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export function getOrderColumns({
  onUpdateStatus,
  onUpdatePaymentStatus,
}: OrderColumnsProps = {}): ColumnDef<Order>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selectionner tout"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "order_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="N° Commande" />
      ),
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.order_number}
          </Link>
          <div className="text-xs text-muted-foreground">
            {row.original.created_at && new Date(row.original.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Client",
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <div className="min-w-[150px]">
            <div className="font-medium">{user?.full_name || "Client inconnu"}</div>
            <div className="text-xs text-muted-foreground">{user?.phone}</div>
          </div>
        )
      },
    },
    {
      id: "items_count",
      header: "Articles",
      cell: ({ row }) => {
        const items = row.original.items || []
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
        return (
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {totalQuantity}
          </Badge>
        )
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => {
        const total = row.original.total
        const discount = row.original.discount || 0
        return (
          <div>
            <div className="font-medium">{formatPrice(total)}</div>
            {discount > 0 && (
              <div className="text-xs text-green-600">
                -{formatPrice(discount)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: "Statut",
      cell: ({ row }) => {
        const status = row.original.status
        if (!status) return <span className="text-muted-foreground">-</span>
        return (
          <Badge
            variant="secondary"
            className={cn("gap-1", statusColors[status] || "")}
          >
            {ORDER_STATUS_LABELS[status] || status}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id) as string)
      },
    },
    {
      id: "payment_status",
      accessorFn: (row) => row.payment_status,
      header: "Paiement",
      cell: ({ row }) => {
        const status = row.original.payment_status
        if (!status) return <span className="text-muted-foreground">-</span>
        return (
          <Badge
            variant="secondary"
            className={cn("gap-1", paymentStatusColors[status] || "")}
          >
            <CreditCard className="h-3 w-3" />
            {PAYMENT_STATUS_LABELS[status] || status}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id) as string)
      },
    },
    {
      id: "tracking",
      header: "Suivi",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number
        return tracking ? (
          <Badge variant="outline" className="gap-1">
            <Truck className="h-3 w-3" />
            {tracking}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original
        return (
          <ClientOnly
            fallback={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/orders/${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onUpdateStatus && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Package className="mr-2 h-4 w-4" />
                      Changer le statut
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {ORDER_STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onUpdateStatus(order.id, status)}
                            disabled={order.status === status}
                          >
                            <Badge
                              variant="secondary"
                              className={cn("mr-2", statusColors[status])}
                            >
                              {ORDER_STATUS_LABELS[status]}
                            </Badge>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
                {onUpdatePaymentStatus && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Statut paiement
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {PAYMENT_STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onUpdatePaymentStatus(order.id, status)}
                            disabled={order.payment_status === status}
                          >
                            <Badge
                              variant="secondary"
                              className={cn("mr-2", paymentStatusColors[status])}
                            >
                              {PAYMENT_STATUS_LABELS[status]}
                            </Badge>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        )
      },
    },
  ]
}
