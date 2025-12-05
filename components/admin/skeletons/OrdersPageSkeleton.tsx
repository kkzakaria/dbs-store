import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableSkeleton } from "@/components/data-table"

export function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton - 5 columns like OrderStats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="h-4 w-4 bg-gray-200 dark:bg-gray-600" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 bg-gray-200 dark:bg-gray-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders DataTable Skeleton */}
      <DataTableSkeleton
        columnCount={8}
        rowCount={10}
        columnWidths={["w-28", "w-32", "w-24", "w-24", "w-20", "w-20", "w-24", "w-8"]}
      />
    </div>
  )
}
