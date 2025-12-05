"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, AlertTriangle, PackageX } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/data-table"
import { cn } from "@/lib/utils"

type InventoryProduct = {
  id: string
  name: string
  slug: string
  sku: string | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  stock_type: string | null
  is_active: boolean | null
  category?: { id: string; name: string } | null
  images?: Array<{ url: string; is_primary: boolean | null }> | null
}

interface InventoryColumnsProps {
  onEditStock?: (product: InventoryProduct) => void
}

export function getInventoryColumns({
  onEditStock,
}: InventoryColumnsProps = {}): ColumnDef<InventoryProduct>[] {
  return [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const images = row.original.images
        const primaryImage = images?.find((img) => img.is_primary) || images?.[0]
        return (
          <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={row.original.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                N/A
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Produit" />
      ),
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <Link
            href={`/admin/products/${row.original.id}/edit`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          {row.original.sku && (
            <div className="text-xs text-muted-foreground">
              SKU: {row.original.sku}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Categorie",
      cell: ({ row }) => {
        const category = row.original.category
        return category ? (
          <Badge variant="outline">{category.name}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "stock_quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => {
        const stock = row.original.stock_quantity || 0
        const threshold = row.original.low_stock_threshold || 5
        const isLow = stock > 0 && stock <= threshold
        const isOut = stock === 0

        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-lg font-bold",
                isOut && "text-destructive",
                isLow && "text-amber-600"
              )}
            >
              {stock}
            </span>
            {isOut && <PackageX className="h-4 w-4 text-destructive" />}
            {isLow && !isOut && <AlertTriangle className="h-4 w-4 text-amber-600" />}
          </div>
        )
      },
    },
    {
      accessorKey: "low_stock_threshold",
      header: "Seuil alerte",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.low_stock_threshold || 5}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: ({ row }) => {
        const stock = row.original.stock_quantity || 0
        const threshold = row.original.low_stock_threshold || 5
        const isLow = stock > 0 && stock <= threshold
        const isOut = stock === 0

        if (isOut) {
          return (
            <Badge variant="destructive" className="gap-1">
              <PackageX className="h-3 w-3" />
              Epuise
            </Badge>
          )
        }

        if (isLow) {
          return (
            <Badge className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
              <AlertTriangle className="h-3 w-3" />
              Stock bas
            </Badge>
          )
        }

        return (
          <Badge variant="secondary" className="text-green-600">
            En stock
          </Badge>
        )
      },
    },
    {
      accessorKey: "stock_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.stock_type
        return (
          <Badge variant="outline" className="capitalize">
            {type === "dropshipping" ? "Dropshipping" : "Physique"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStock?.(product)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        )
      },
    },
  ]
}
