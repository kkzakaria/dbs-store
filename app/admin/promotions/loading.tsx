import { Skeleton } from "@/components/ui/skeleton"
import { DataTableSkeleton } from "@/components/data-table"

export default function PromotionsPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats Cards Skeleton - 4 columns */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-600" />
            </div>
            <Skeleton className="mt-2 h-8 w-12 bg-gray-200 dark:bg-gray-600" />
          </div>
        ))}
      </div>

      {/* Promotions DataTable Skeleton */}
      <DataTableSkeleton
        columnCount={9}
        rowCount={10}
        columnWidths={["w-8", "w-24", "w-32", "w-20", "w-16", "w-20", "w-24", "w-16", "w-8"]}
      />
    </div>
  )
}
