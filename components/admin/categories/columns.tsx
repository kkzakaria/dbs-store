"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, FolderTree } from "lucide-react"
import Image from "next/image"
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
import { ClientOnly } from "@/components/shared/ClientOnly"
import type { Database } from "@/types/database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  parent?: { id: string; name: string; slug: string } | null
  _count?: Array<{ count: number }> | null
}

interface CategoryColumnsProps {
  onEdit?: (category: Category) => void
  onToggleActive?: (id: string) => void
  onDelete?: (id: string) => void
}

export function getCategoryColumns({
  onEdit,
  onToggleActive,
  onDelete,
}: CategoryColumnsProps = {}): ColumnDef<Category>[] {
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
        const imageUrl = row.original.image_url
        return (
          <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={row.original.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
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
        <div className="min-w-[150px]">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">/{row.original.slug}</div>
        </div>
      ),
    },
    {
      id: "parent",
      header: "Parent",
      cell: ({ row }) => {
        const parent = row.original.parent
        return parent ? (
          <Badge variant="outline">{parent.name}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "position",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Position" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.position}</span>
      ),
    },
    {
      id: "products_count",
      header: "Produits",
      cell: ({ row }) => {
        const count = row.original._count?.[0]?.count || 0
        return (
          <Badge variant="secondary">{count}</Badge>
        )
      },
    },
    {
      id: "is_active",
      accessorFn: (row) => String(row.is_active),
      header: "Statut",
      cell: ({ row }) => {
        const isActive = row.original.is_active
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id) as string)
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original
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
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onToggleActive && (
                  <DropdownMenuItem onClick={() => onToggleActive(category.id)}>
                    {category.is_active ? (
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
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        )
      },
    },
  ]
}
