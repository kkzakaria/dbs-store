"use client"

import { cn } from "@/lib/utils"

interface ProductSpecificationsProps {
  specifications: Record<string, unknown> | null
  className?: string
  columns?: 1 | 2
  maxItems?: number
}

/**
 * Format specification value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Format specification key for display (capitalize, replace underscores)
 */
function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function ProductSpecifications({
  specifications,
  className,
  columns = 2,
  maxItems,
}: ProductSpecificationsProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null
  }

  const entries = Object.entries(specifications)
  const displayEntries = maxItems ? entries.slice(0, maxItems) : entries

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {displayEntries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
        >
          <span className="text-sm font-medium text-muted-foreground">
            {formatKey(key)}
          </span>
          <span className="text-sm font-medium text-right">
            {formatValue(value)}
          </span>
        </div>
      ))}

      {maxItems && entries.length > maxItems && (
        <div className="col-span-full text-center">
          <span className="text-sm text-muted-foreground">
            +{entries.length - maxItems} autres caractéristiques
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Compact specifications display for product cards
 */
export function ProductSpecificationsCompact({
  specifications,
  className,
  maxItems = 3,
}: ProductSpecificationsProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null
  }

  const entries = Object.entries(specifications).slice(0, maxItems)

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
        >
          {formatValue(value)}
        </span>
      ))}
    </div>
  )
}
