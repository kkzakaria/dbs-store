import { Skeleton } from "@/components/ui/skeleton"
import { DataTableSkeleton } from "@/components/data-table"

export default function InventoryPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Quick Stats Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-gray-600" />
        <Skeleton className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-600" />
      </div>

      {/* Inventory DataTable Skeleton */}
      <DataTableSkeleton
        columnCount={8}
        rowCount={10}
        columnWidths={["w-12", "w-48", "w-24", "w-20", "w-20", "w-20", "w-16", "w-8"]}
      />
    </div>
  )
}
