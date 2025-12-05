"use client"

import { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  manualPagination?: boolean
  pageIndex?: number
  pageSize?: number
  pageCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTablePagination<TData>({
  table,
  manualPagination = false,
  pageIndex = 0,
  pageSize = 10,
  pageCount = 1,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const currentPage = manualPagination ? pageIndex : table.getState().pagination.pageIndex
  const currentPageSize = manualPagination ? pageSize : table.getState().pagination.pageSize
  const totalPages = manualPagination ? pageCount : table.getPageCount()

  const handlePageChange = (newPage: number) => {
    if (manualPagination && onPageChange) {
      onPageChange(newPage)
    } else {
      table.setPageIndex(newPage)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    if (manualPagination && onPageSizeChange) {
      onPageSizeChange(newSize)
    } else {
      table.setPageSize(newSize)
    }
  }

  const canGoPrevious = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <span>
            {table.getFilteredSelectedRowModel().rows.length} sur{" "}
            {table.getFilteredRowModel().rows.length} ligne(s) selectionnee(s).
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Lignes par page</p>
          <Select
            value={currentPageSize.toString()}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {currentPage + 1} sur {totalPages || 1}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(0)}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Premiere page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Page precedente</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
          >
            <span className="sr-only">Page suivante</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={!canGoNext}
          >
            <span className="sr-only">Derniere page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
