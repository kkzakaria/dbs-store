import { Skeleton } from "@/components/ui/skeleton"
import { DataTableSkeleton } from "@/components/data-table"

export function ReviewsPageSkeleton() {
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

      {/* Quick Filters Skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-48 rounded-lg bg-gray-200 dark:bg-gray-600" />
        <Skeleton className="h-10 w-28 rounded-lg bg-gray-200 dark:bg-gray-600" />
      </div>

      {/* Reviews DataTable Skeleton */}
      <DataTableSkeleton
        columnCount={7}
        rowCount={10}
        columnWidths={["w-32", "w-48", "w-20", "w-20", "w-24", "w-16", "w-8"]}
      />
    </div>
  )
}
