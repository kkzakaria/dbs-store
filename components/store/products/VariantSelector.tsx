"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductOption {
  id: string
  name: string
  values: unknown // Json from DB - can be string[] or ColorValue[]
  position: number | null
}

interface ProductVariant {
  id: string
  sku: string
  price: number
  compare_price: number | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  options: unknown // Json from DB
  position: number | null
  is_active: boolean | null
}

interface VariantSelectorProps {
  options: ProductOption[]
  variants: ProductVariant[]
  selectedOptions: Record<string, string>
  onSelectOption: (optionName: string, value: string) => void
  selectedVariant: ProductVariant | null
}

// ColorValue type for new color format
type ColorValue = {
  name: string
  hex: string
}

// Check if a value is a ColorValue object
const isColorValueObject = (value: unknown): value is ColorValue => {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "hex" in value
  )
}

// Check if a color value looks like a color name
const isColorOption = (name: string) => {
  const colorNames = ["couleur", "color", "colour"]
  return colorNames.includes(name.toLowerCase())
}

// Map common French color names to CSS colors (fallback for old data)
const colorMap: Record<string, string> = {
  noir: "#000000",
  blanc: "#FFFFFF",
  bleu: "#0066CC",
  rouge: "#CC0000",
  vert: "#008000",
  jaune: "#FFD700",
  orange: "#FF8C00",
  rose: "#FF69B4",
  violet: "#8B00FF",
  gris: "#808080",
  argent: "#C0C0C0",
  or: "#FFD700",
  gold: "#FFD700",
  silver: "#C0C0C0",
  "titane naturel": "#B4B4B4",
  "titane bleu": "#5A7B9A",
  "titane blanc": "#F5F5F5",
  "titane noir": "#1C1C1C",
  "or rose": "#E8B4B8",
  black: "#000000",
  white: "#FFFFFF",
  blue: "#0066CC",
  red: "#CC0000",
  green: "#008000",
}

const getColorValue = (colorName: string): string | null => {
  const normalized = colorName.toLowerCase().trim()
  return colorMap[normalized] || null
}

// Parsed option value with name and optional hex
type ParsedValue = {
  name: string
  hex: string | null
}

export function VariantSelector({
  options,
  variants,
  selectedOptions,
  onSelectOption,
  selectedVariant,
}: VariantSelectorProps) {
  // Parse option values from Json - supports both string[] and ColorValue[]
  const parsedOptions = useMemo(() => {
    return options.map((opt) => {
      const isColor = isColorOption(opt.name)
      const rawValues = Array.isArray(opt.values) ? opt.values : []

      // Parse values to extract name and hex
      const values: ParsedValue[] = rawValues.map((val) => {
        if (isColorValueObject(val)) {
          // New format: ColorValue object with name and hex
          return { name: val.name, hex: val.hex }
        } else if (typeof val === "string") {
          // Old format: plain string, use colorMap for colors
          return {
            name: val,
            hex: isColor ? getColorValue(val) : null,
          }
        }
        // Fallback
        return { name: String(val), hex: null }
      })

      return {
        ...opt,
        values,
      }
    })
  }, [options])

  // Check which option combinations are available
  const getAvailableValues = (optionName: string): Set<string> => {
    const available = new Set<string>()

    for (const variant of variants) {
      if (!variant.is_active || (variant.stock_quantity ?? 0) <= 0) continue

      const variantOptions =
        typeof variant.options === "object" && variant.options !== null
          ? (variant.options as Record<string, string>)
          : {}

      // Check if this variant matches all other selected options
      let matches = true
      for (const [key, value] of Object.entries(selectedOptions)) {
        if (key !== optionName && variantOptions[key] !== value) {
          matches = false
          break
        }
      }

      if (matches && variantOptions[optionName]) {
        available.add(variantOptions[optionName])
      }
    }

    return available
  }

  if (parsedOptions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {parsedOptions.map((option) => {
        const availableValues = getAvailableValues(option.name)
        const isColor = isColorOption(option.name)

        return (
          <div key={option.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {option.name}
                {selectedOptions[option.name] && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    : {selectedOptions[option.name]}
                  </span>
                )}
              </label>
            </div>

            {isColor ? (
              // Color swatches
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value.name
                  const isAvailable = availableValues.has(value.name)

                  return (
                    <button
                      key={value.name}
                      type="button"
                      onClick={() => isAvailable && onSelectOption(option.name, value.name)}
                      disabled={!isAvailable}
                      className={cn(
                        "relative h-8 w-8 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-muted hover:border-primary/50",
                        !isAvailable && "opacity-40 cursor-not-allowed"
                      )}
                      style={{
                        backgroundColor: value.hex || "#E5E5E5",
                      }}
                      title={value.name}
                    >
                      {!isAvailable && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-[2px] w-full bg-muted-foreground rotate-45 absolute" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : option.values.length <= 5 ? (
              // Button group for few options
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value.name
                  const isAvailable = availableValues.has(value.name)

                  return (
                    <button
                      key={value.name}
                      type="button"
                      onClick={() => isAvailable && onSelectOption(option.name, value.name)}
                      disabled={!isAvailable}
                      className={cn(
                        "px-3 py-1.5 text-sm border rounded-md transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:border-primary/50 bg-background",
                        !isAvailable && "opacity-40 cursor-not-allowed line-through"
                      )}
                    >
                      {value.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              // Dropdown for many options
              <Select
                value={selectedOptions[option.name] || ""}
                onValueChange={(val) => onSelectOption(option.name, val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Sélectionnez ${option.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {option.values.map((value) => {
                    const isAvailable = availableValues.has(value.name)
                    return (
                      <SelectItem
                        key={value.name}
                        value={value.name}
                        disabled={!isAvailable}
                        className={cn(!isAvailable && "opacity-50")}
                      >
                        {value.name}
                        {!isAvailable && " (Indisponible)"}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        )
      })}

      {/* Stock status */}
      {selectedVariant && (
        <div className="pt-2">
          {(selectedVariant.stock_quantity ?? 0) <= 0 ? (
            <Badge variant="destructive">Rupture de stock</Badge>
          ) : (selectedVariant.stock_quantity ?? 0) <=
            (selectedVariant.low_stock_threshold ?? 5) ? (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Plus que {selectedVariant.stock_quantity} en stock
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  )
}
