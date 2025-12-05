"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Check, X, Star, ShieldCheck, User } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/data-table"
import { cn } from "@/lib/utils"

type Review = {
  id: string
  title: string | null
  comment: string | null
  rating: number
  is_approved: boolean | null
  is_verified_purchase: boolean | null
  created_at: string | null
  product: { id: string; name: string; slug: string } | null
  user: { id: string; full_name: string | null; phone: string | null } | null
}

interface ReviewColumnsProps {
  onApprove?: (review: Review) => void
  onReject?: (review: Review) => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  )
}

export function getReviewColumns({
  onApprove,
  onReject,
}: ReviewColumnsProps = {}): ColumnDef<Review>[] {
  return [
    {
      accessorKey: "product",
      header: "Produit",
      cell: ({ row }) => {
        const product = row.original.product
        return product ? (
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="font-medium hover:underline"
          >
            {product.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "user",
      header: "Client",
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{user?.full_name || "Anonyme"}</div>
              <div className="text-xs text-muted-foreground">{user?.phone}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "rating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Note" />
      ),
      cell: ({ row }) => <StarRating rating={row.original.rating} />,
    },
    {
      accessorKey: "content",
      header: "Contenu",
      cell: ({ row }) => {
        const { title, comment, is_verified_purchase } = row.original
        return (
          <div className="max-w-[300px] space-y-1">
            {title && <div className="font-medium">{title}</div>}
            {comment && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {comment}
              </p>
            )}
            {is_verified_purchase && (
              <Badge variant="outline" className="gap-1 text-green-600">
                <ShieldCheck className="h-3 w-3" />
                Achat vérifié
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
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
      id: "status",
      accessorFn: (row) => row.is_approved === true ? "approved" : "pending",
      header: "Statut",
      cell: ({ row }) => {
        const isApproved = row.original.is_approved
        if (isApproved === true) {
          return (
            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-200">
              <Check className="h-3 w-3" />
              Approuvé
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="gap-1 text-amber-600">
            En attente
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const review = row.original
        const isApproved = review.is_approved

        return (
          <div className="flex items-center gap-2">
            {!isApproved && (
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onApprove?.(review)}
              >
                <Check className="mr-1 h-4 w-4" />
                Approuver
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onReject?.(review)}
            >
              <X className="mr-1 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        )
      },
    },
  ]
}
