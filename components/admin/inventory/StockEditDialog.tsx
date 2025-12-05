"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStock } from "@/actions/admin/inventory"
import { toast } from "sonner"

interface StockEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    id: string
    name: string
    stock_quantity: number | null
  } | null
}

export function StockEditDialog({
  open,
  onOpenChange,
  product,
}: StockEditDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState(0)

  // Reset quantity when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && product) {
      setQuantity(product.stock_quantity || 0)
    }
    onOpenChange(open)
  }

  const handleSubmit = () => {
    if (!product) return

    startTransition(async () => {
      const result = await updateStock({
        productId: product.id,
        quantity,
      })

      if (result?.data?.success) {
        toast.success("Stock mis a jour")
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result?.data?.error || "Erreur lors de la mise a jour")
      }
    })
  }

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(0, prev + delta))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Modifier le stock</DialogTitle>
          <DialogDescription>
            {product?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Quantite en stock</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-10)}
                disabled={quantity < 10}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">-10</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-1)}
                disabled={quantity < 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="text-center text-lg font-bold"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(10)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">+10</span>
              </Button>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {[0, 10, 25, 50, 100].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setQuantity(preset)}
                className={quantity === preset ? "border-primary" : ""}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
