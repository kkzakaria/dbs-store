"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import type { DataTableProps } from "@/types/data-table";

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  enablePagination = true,
  enableRowSelection = false,
  enableSorting = true,
  isLoading = false,
  emptyMessage,
  getRowId,
  onRowSelectionChange,
  manualPagination = false,
  pageCount,
  // Initial state from URL
  initialColumnFilters = [],
  initialSorting = [],
  initialColumnVisibility = {},
  initialPagination,
  // Callbacks for state changes
  onColumnFiltersChange,
  onSortingChange,
  onColumnVisibilityChange,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  // Track if component has completed initial render to prevent callbacks on mount
  const isInitialRenderRef = React.useRef(true);
  React.useEffect(() => {
    // Mark initial render as complete after first effect cycle
    const timer = setTimeout(() => {
      isInitialRenderRef.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Local state initialized with URL values
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [pagination, setPagination] = React.useState(
    initialPagination || {
      pageIndex: 0,
      pageSize,
    }
  );

  // Track previous values to detect actual user-initiated changes
  const prevColumnFiltersRef = React.useRef(columnFilters);
  const prevSortingRef = React.useRef(sorting);
  const prevColumnVisibilityRef = React.useRef(columnVisibility);
  const prevPaginationRef = React.useRef(pagination);

  // Call URL sync callbacks only after user-initiated changes (not on mount)
  React.useEffect(() => {
    if (isInitialRenderRef.current) return;

    const hasChanged = JSON.stringify(prevColumnFiltersRef.current) !== JSON.stringify(columnFilters);
    if (hasChanged && onColumnFiltersChange) {
      prevColumnFiltersRef.current = columnFilters;
      onColumnFiltersChange(columnFilters);
    }
  }, [columnFilters, onColumnFiltersChange]);

  React.useEffect(() => {
    if (isInitialRenderRef.current) return;

    const hasChanged = JSON.stringify(prevSortingRef.current) !== JSON.stringify(sorting);
    if (hasChanged && onSortingChange) {
      prevSortingRef.current = sorting;
      onSortingChange(sorting);
    }
  }, [sorting, onSortingChange]);

  React.useEffect(() => {
    if (isInitialRenderRef.current) return;

    const hasChanged = JSON.stringify(prevColumnVisibilityRef.current) !== JSON.stringify(columnVisibility);
    if (hasChanged && onColumnVisibilityChange) {
      prevColumnVisibilityRef.current = columnVisibility;
      onColumnVisibilityChange(columnVisibility);
    }
  }, [columnVisibility, onColumnVisibilityChange]);

  React.useEffect(() => {
    if (isInitialRenderRef.current) return;

    const hasChanged =
      prevPaginationRef.current.pageIndex !== pagination.pageIndex ||
      prevPaginationRef.current.pageSize !== pagination.pageSize;
    if (hasChanged && onPaginationChange) {
      prevPaginationRef.current = pagination;
      onPaginationChange(pagination);
    }
  }, [pagination, onPaginationChange]);

  const table = useReactTable({
    data,
    columns,
    // Only set pageCount for manual pagination, otherwise let TanStack Table calculate it
    pageCount: manualPagination ? (pageCount ?? -1) : undefined,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId,
    manualPagination,
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, table]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {toolbar && <DataTableToolbar table={table} config={toolbar} />}
      <div className="rounded-md border flex-1 min-h-0">
        <div className="relative h-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b sticky top-0 z-10 bg-card shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className={cn(
                    "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
                    "bg-card hover:bg-card border-b-2"
                  )}
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                          "!font-bold"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className={cn("[&_tr:last-child]:border-0")}>
              {isLoading ? (
                <tr
                  className={cn(
                    "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                  )}
                >
                  <td
                    colSpan={columns.length}
                    className={cn(
                      "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                      "h-24 text-center"
                    )}
                  >
                    Chargement...
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr
                  className={cn(
                    "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                  )}
                >
                  <td
                    colSpan={columns.length}
                    className={cn(
                      "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                      "h-24 text-center"
                    )}
                  >
                    {emptyMessage ?? "Aucun résultat."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {enablePagination && (
        <div className="flex-shrink-0">
          <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
        </div>
      )}
    </div>
  );
}
