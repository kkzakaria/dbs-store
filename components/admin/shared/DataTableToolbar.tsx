"use client"

import { Table } from "@tanstack/react-table"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  // For server-side search
  searchValue?: string
  onSearchChange?: (value: string) => void
  children?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Rechercher...",
  searchValue,
  onSearchChange,
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || (searchValue && searchValue.length > 0)

  // Determine if using client-side or server-side search
  const isServerSide = searchValue !== undefined && onSearchChange !== undefined
  const currentValue = isServerSide
    ? searchValue
    : searchKey
      ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
      : ""

  const handleChange = (value: string) => {
    if (isServerSide && onSearchChange) {
      onSearchChange(value)
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  const handleReset = () => {
    if (isServerSide && onSearchChange) {
      onSearchChange("")
    } else {
      table.resetColumnFilters()
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={currentValue}
            onChange={(event) => handleChange(event.target.value)}
            className="pl-8"
          />
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            Reinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
