"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Download, Plus, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import type { DataTableToolbarConfig } from "@/types/data-table";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  config?: DataTableToolbarConfig<TData>;
}

export function DataTableToolbar<TData>({
  table,
  config,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleExport = () => {
    if (!config?.onExport) return;

    const hasSelection = table.getFilteredSelectedRowModel().rows.length > 0;
    const rows = hasSelection
      ? table.getFilteredSelectedRowModel().rows
      : table.getFilteredRowModel().rows;

    config.onExport(rows.map((row) => row.original));
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {config?.searchKey && (
          <Input
            placeholder={config.searchPlaceholder ?? "Rechercher..."}
            value={
              (table.getColumn(config.searchKey)?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn(config.searchKey!)
                ?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {config?.filterableColumns?.map((filterColumn) => {
          const column = table.getColumn(filterColumn.id);
          return column ? (
            <DataTableFacetedFilter
              key={filterColumn.id}
              column={column}
              title={filterColumn.title}
              options={filterColumn.options}
            />
          ) : null;
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {config?.onRefresh && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={config.onRefresh}
            disabled={config.isRefreshing}
          >
            <RefreshCw className={config.isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            <span className="sr-only">Actualiser</span>
          </Button>
        )}
        {config?.onAdd && (
          <Button onClick={config.onAdd} size="sm" className="h-8">
            <Plus className="mr-2 h-4 w-4" />
            {config.addLabel ?? "Ajouter"}
          </Button>
        )}
        {config?.enableExport && config?.onExport && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
