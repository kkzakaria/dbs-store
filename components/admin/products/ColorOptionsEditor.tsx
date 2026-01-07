"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { ColorPicker } from "./ColorPicker"
import type { ColorValue } from "@/lib/validations/admin"

interface ColorOptionsEditorProps {
  colors: ColorValue[]
  onChange: (colors: ColorValue[]) => void
  error?: string
}

export function ColorOptionsEditor({
  colors,
  onChange,
  error,
}: ColorOptionsEditorProps) {
  const handleColorSelect = (color: ColorValue) => {
    // Check if color already exists
    const exists = colors.some(
      (c) => c.name.toLowerCase() === color.name.toLowerCase()
    )
    if (exists) return

    onChange([...colors, color])
  }

  const handleColorRemove = (colorName: string) => {
    onChange(colors.filter((c) => c.name !== colorName))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Valeurs de couleur
        </Label>
        {colors.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {colors.length} couleur{colors.length > 1 ? "s" : ""} sélectionnée{colors.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <ColorPicker
        selectedColors={colors}
        onColorSelect={handleColorSelect}
        onColorRemove={handleColorRemove}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Selected colors display (compact view) */}
      {colors.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground mb-2">
            Ordre d&apos;affichage (glissez pour réorganiser)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((color, index) => (
              <div
                key={color.name}
                className={cn(
                  "flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-xs border",
                  "cursor-move hover:border-primary/50 transition-colors"
                )}
              >
                <span className="text-muted-foreground w-4">{index + 1}.</span>
                <span
                  className="h-3 w-3 rounded-full border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate max-w-[100px]">{color.name}</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {color.hex}
                </span>
                <button
                  type="button"
                  onClick={() => handleColorRemove(color.name)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
