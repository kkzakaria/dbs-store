"use client"

import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PREDEFINED_COLORS, type ColorValue } from "@/lib/validations/admin"

interface ColorPickerProps {
  selectedColors: ColorValue[]
  onColorSelect: (color: ColorValue) => void
  onColorRemove: (colorName: string) => void
}

export function ColorPicker({
  selectedColors,
  onColorSelect,
  onColorRemove,
}: ColorPickerProps) {
  const [customColorName, setCustomColorName] = useState("")
  const [customColorHex, setCustomColorHex] = useState("#000000")
  const [isCustomOpen, setIsCustomOpen] = useState(false)

  const isColorSelected = (colorName: string) => {
    return selectedColors.some(
      (c) => c.name.toLowerCase() === colorName.toLowerCase()
    )
  }

  const handlePredefinedClick = (color: ColorValue) => {
    if (isColorSelected(color.name)) {
      onColorRemove(color.name)
    } else {
      onColorSelect(color)
    }
  }

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) return
    if (!/^#[0-9A-Fa-f]{6}$/.test(customColorHex)) return

    onColorSelect({
      name: customColorName.trim(),
      hex: customColorHex.toUpperCase(),
    })

    setCustomColorName("")
    setCustomColorHex("#000000")
    setIsCustomOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Predefined Colors Grid */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Couleurs prédéfinies
        </Label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_COLORS.map((color) => {
            const selected = isColorSelected(color.name)
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => handlePredefinedClick(color)}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all border",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:border-primary/50 bg-background"
                )}
                title={color.name}
              >
                {/* Color swatch */}
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border border-border/50 flex items-center justify-center",
                    color.hex === "#FFFFFF" && "border-muted-foreground/30"
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  {selected && (
                    <Check
                      className={cn(
                        "h-3 w-3",
                        color.hex === "#FFFFFF" || color.hex === "#FFD700"
                          ? "text-black"
                          : "text-white"
                      )}
                    />
                  )}
                </span>
                {/* Color name */}
                <span>{color.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      <div>
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une couleur personnalisée
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="color-name">Nom de la couleur</Label>
                <Input
                  id="color-name"
                  placeholder="Ex: Bleu Océan"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-hex">Code couleur (HEX)</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border border-input flex-shrink-0"
                    style={{ backgroundColor: customColorHex }}
                  />
                  <Input
                    id="color-hex"
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="h-10 w-14 p-1 cursor-pointer"
                  />
                  <Input
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddCustomColor}
                disabled={
                  !customColorName.trim() ||
                  !/^#[0-9A-Fa-f]{6}$/.test(customColorHex)
                }
                className="w-full"
              >
                Ajouter la couleur
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Colors Preview */}
      {selectedColors.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Couleurs sélectionnées ({selectedColors.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color) => (
              <div
                key={color.name}
                className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                <span
                  className="h-4 w-4 rounded-full border border-border/50"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
                <button
                  type="button"
                  onClick={() => onColorRemove(color.name)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
