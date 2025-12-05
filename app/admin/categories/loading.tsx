import { DataTableSkeleton } from "@/components/data-table"

export default function CategoriesTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={7}
      rowCount={10}
      columnWidths={["w-8", "w-12", "w-40", "w-32", "w-16", "w-20", "w-8"]}
    />
  )
}
