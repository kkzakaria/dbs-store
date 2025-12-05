import { DataTableSkeleton } from "@/components/data-table"

export function ProductsTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={8}
      rowCount={10}
      columnWidths={["w-8", "w-12", "w-48", "w-24", "w-20", "w-16", "w-20", "w-8"]}
    />
  )
}
