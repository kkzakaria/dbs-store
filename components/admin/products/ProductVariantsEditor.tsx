"use client"

import { useState } from "react"
import { Plus, Trash2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { ProductOptionInput, ProductVariantInput } from "@/lib/validations/admin"
import { generateSlug } from "@/lib/validations/admin"

interface ProductVariantsEditorProps {
  options: ProductOptionInput[]
  variants: ProductVariantInput[]
  onChange: (variants: ProductVariantInput[]) => void
  productName?: string
}

export function ProductVariantsEditor({
  options,
  variants,
  onChange,
  productName = "",
}: ProductVariantsEditorProps) {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // Generate all possible combinations from options
  const generateCombinations = (
    opts: ProductOptionInput[],
    current: Record<string, string> = {},
    index: number = 0
  ): Record<string, string>[] => {
    if (index >= opts.length) {
      return [current]
    }

    const option = opts[index]
    const results: Record<string, string>[] = []

    for (const value of option.values) {
      const newCurrent = { ...current, [option.name]: value }
      results.push(...generateCombinations(opts, newCurrent, index + 1))
    }

    return results
  }

  const generateVariants = () => {
    if (options.length === 0 || options.some((o) => o.values.length === 0)) {
      return
    }

    const combinations = generateCombinations(options)
    const baseSlug = generateSlug(productName)

    const newVariants: ProductVariantInput[] = combinations.map((combo, index) => {
      // Generate SKU from option values
      const skuParts = Object.values(combo).map((v) =>
        generateSlug(v).toUpperCase().slice(0, 3)
      )
      const sku = `${baseSlug.toUpperCase().slice(0, 10)}-${skuParts.join("-")}-${index + 1}`

      return {
        sku,
        price: 0,
        compare_price: null,
        stock_quantity: 0,
        low_stock_threshold: 5,
        options: combo,
        position: index,
        is_active: true,
      }
    })

    onChange(newVariants)
    setShowGenerateDialog(false)
  }

  const updateVariant = (index: number, field: keyof ProductVariantInput, value: any) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index)
    // Update positions
    const reindexed = updated.map((v, i) => ({ ...v, position: i }))
    onChange(reindexed)
  }

  const addVariant = () => {
    const newVariant: ProductVariantInput = {
      sku: `SKU-${Date.now()}`,
      price: 0,
      compare_price: null,
      stock_quantity: 0,
      low_stock_threshold: 5,
      options: options.reduce((acc, opt) => {
        acc[opt.name] = opt.values[0] || ""
        return acc
      }, {} as Record<string, string>),
      position: variants.length,
      is_active: true,
    }
    onChange([...variants, newVariant])
  }

  const formatOptions = (opts: Record<string, string>) => {
    return Object.entries(opts)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ")
  }

  const canGenerate = options.length > 0 && options.every((o) => o.values.length > 0)
  const totalCombinations = options.reduce((acc, opt) => acc * (opt.values.length || 1), 1)

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <AlertDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={!canGenerate}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Generer {totalCombinations} variante{totalCombinations > 1 ? "s" : ""}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Generer les variantes ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va creer {totalCombinations} variante{totalCombinations > 1 ? "s" : ""}
                a partir des combinaisons d'options.
                {variants.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    Attention: Les {variants.length} variante{variants.length > 1 ? "s" : ""} existante{variants.length > 1 ? "s" : ""} seront remplacee{variants.length > 1 ? "s" : ""}.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={generateVariants}>Generer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button type="button" variant="outline" onClick={addVariant} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter manuellement
        </Button>
      </div>

      {/* Variants Table */}
      {variants.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Options</TableHead>
                <TableHead className="w-[140px]">SKU</TableHead>
                <TableHead className="w-[120px]">Prix (FCFA)</TableHead>
                <TableHead className="w-[100px]">Stock</TableHead>
                <TableHead className="w-[80px]">Actif</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(variant.options).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.price || ""}
                      onChange={(e) =>
                        updateVariant(index, "price", Number(e.target.value))
                      }
                      className="h-8 text-sm"
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={variant.stock_quantity || ""}
                      onChange={(e) =>
                        updateVariant(index, "stock_quantity", Number(e.target.value))
                      }
                      className="h-8 text-sm"
                      min={0}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) =>
                        updateVariant(index, "is_active", checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p>Aucune variante definie.</p>
          <p className="text-sm mt-1">
            {canGenerate
              ? "Cliquez sur \"Generer\" pour creer les variantes automatiquement."
              : "Definissez d'abord des options avec leurs valeurs."}
          </p>
        </div>
      )}

      {/* Summary */}
      {variants.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {variants.length} variante{variants.length > 1 ? "s" : ""} |
            Stock total: {variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)} |
            Prix min: {Math.min(...variants.map((v) => v.price || 0)).toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      )}
    </div>
  )
}
