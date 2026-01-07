"use client"

import Image from "next/image"
import { ImageIcon, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ProductVariantInput } from "@/lib/validations/admin"

interface ProductImageWithVariant {
  id: string
  url: string
  alt: string | null
  position: number | null
  is_primary: boolean | null
  variant_id?: string | null
}

interface VariantImageAssignmentProps {
  images: ProductImageWithVariant[]
  variants: ProductVariantInput[]
  onAssign: (imageId: string, variantId: string | null) => void
}

export function VariantImageAssignment({
  images,
  variants,
  onAssign,
}: VariantImageAssignmentProps) {
  const formatVariantLabel = (variant: ProductVariantInput) => {
    return Object.entries(variant.options)
      .map(([, value]) => value)
      .join(" / ")
  }

  const getVariantForImage = (image: ProductImageWithVariant) => {
    if (!image.variant_id) return null
    return variants.find((v) => v.id === image.variant_id)
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aucune image telechargee.</p>
        <p className="text-sm mt-1">
          Ajoutez d&apos;abord des images au produit pour pouvoir les assigner aux variantes.
        </p>
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg">
        <p>Aucune variante definie.</p>
        <p className="text-sm mt-1">
          Creez d&apos;abord des variantes pour pouvoir assigner des images.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Assignez chaque image a une variante specifique. Les images sans variante
        seront affichees pour toutes les variantes.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => {
          const assignedVariant = getVariantForImage(image)

          return (
            <div
              key={image.id}
              className={cn(
                "relative border rounded-lg overflow-hidden",
                image.is_primary && "ring-2 ring-primary"
              )}
            >
              {/* Image */}
              <div className="aspect-square relative bg-muted">
                <Image
                  src={image.url}
                  alt={image.alt || "Product image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Primary badge */}
                {image.is_primary && (
                  <Badge className="absolute top-2 left-2" variant="default">
                    Principale
                  </Badge>
                )}

                {/* Assigned variant badge */}
                {assignedVariant && (
                  <Badge
                    className="absolute top-2 right-2 max-w-[80%] truncate"
                    variant="secondary"
                  >
                    {formatVariantLabel(assignedVariant)}
                  </Badge>
                )}
              </div>

              {/* Variant selector */}
              <div className="p-2">
                <Select
                  value={image.variant_id || "none"}
                  onValueChange={(value) =>
                    onAssign(image.id, value === "none" ? null : value)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selectionner variante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="flex items-center gap-2">
                        Toutes les variantes
                      </span>
                    </SelectItem>
                    {variants.map((variant, index) => (
                      <SelectItem
                        key={variant.id || `new-${index}`}
                        value={variant.id || `new-${index}`}
                        disabled={!variant.id}
                      >
                        <span className="flex items-center gap-2">
                          {formatVariantLabel(variant)}
                          {variant.id === image.variant_id && (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-primary" />
          Image principale
        </span>
        <span>
          Images sans variante = affichees pour toutes les variantes
        </span>
      </div>
    </div>
  )
}
