import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-gray-600" />
        <Skeleton className="mt-2 h-4 w-64 bg-gray-200 dark:bg-gray-600" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="mt-2 h-3 w-20 bg-gray-200 dark:bg-gray-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Recent Orders Skeleton */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart Skeleton */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="mt-1 h-4 w-48 bg-gray-200 dark:bg-gray-600" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full bg-gray-200 dark:bg-gray-600" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Skeleton */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40 bg-gray-200 dark:bg-gray-600" />
              <Skeleton className="mt-1 h-4 w-32 bg-gray-200 dark:bg-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28 bg-gray-200 dark:bg-gray-600" />
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-600" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-600" />
                      <Skeleton className="h-5 w-16 bg-gray-200 dark:bg-gray-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
