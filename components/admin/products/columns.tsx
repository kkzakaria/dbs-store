"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Eye, Star, EyeOff } from "lucide-react"
import Image from "next/image"
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
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table"
import { formatPrice } from "@/lib/config"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: { id: string; name: string; slug: string } | null
  images?: Array<{
    id: string
    url: string
    alt: string | null
    position: number | null
    is_primary: boolean | null
  }> | null
}

interface ProductColumnsProps {
  onToggleActive?: (id: string) => void
  onToggleFeatured?: (id: string) => void
  onDelete?: (id: string) => void
}

export function getProductColumns({
  onToggleActive,
  onToggleFeatured,
  onDelete,
}: ProductColumnsProps = {}): ColumnDef<Product>[] {
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
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const images = row.original.images
        const primaryImage = images?.find((img) => img.is_primary) || images?.[0]
        return (
          <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || row.original.name}
                width={48}
                height={48}
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
        <DataTableColumnHeader column={column} title="Nom" />
      ),
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <div className="font-medium">{row.original.name}</div>
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
      accessorFn: (row) => row.category?.id,
      header: "Categorie",
      cell: ({ row }) => {
        const category = row.original.category
        return category ? (
          <Badge variant="outline">{category.name}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id) as string)
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Prix" />
      ),
      cell: ({ row }) => {
        const price = row.original.price
        const comparePrice = row.original.compare_price
        return (
          <div>
            <div className="font-medium">{formatPrice(price)}</div>
            {comparePrice && comparePrice > price && (
              <div className="text-xs text-muted-foreground line-through">
                {formatPrice(comparePrice)}
              </div>
            )}
          </div>
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
          <Badge
            variant={isOut ? "destructive" : isLow ? "secondary" : "outline"}
            className={cn(
              isOut && "bg-destructive/10 text-destructive",
              isLow && "bg-amber-500/10 text-amber-600"
            )}
          >
            {stock} {isOut ? "(Epuise)" : isLow ? "(Bas)" : ""}
          </Badge>
        )
      },
    },
    {
      id: "is_active",
      accessorFn: (row) => String(row.is_active),
      header: "Statut",
      cell: ({ row }) => {
        const isActive = row.original.is_active
        const isFeatured = row.original.is_featured
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Actif" : "Inactif"}
            </Badge>
            {isFeatured && (
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Vedette
              </Badge>
            )}
          </div>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id) as string)
      },
    },
    {
      id: "is_featured",
      accessorFn: (row) => String(row.is_featured),
      header: () => null,
      cell: () => null,
      enableHiding: true,
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id) as string)
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original
        return (
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
                <Link href={`/admin/products/${product.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir sur le site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(product.id)}>
                  {product.is_active ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Desactiver
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Activer
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onToggleFeatured && (
                <DropdownMenuItem onClick={() => onToggleFeatured(product.id)}>
                  <Star
                    className={cn(
                      "mr-2 h-4 w-4",
                      product.is_featured && "fill-current"
                    )}
                  />
                  {product.is_featured ? "Retirer des vedettes" : "Mettre en vedette"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(product.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
