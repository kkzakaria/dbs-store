import { Skeleton } from "@/components/ui/skeleton"

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs Skeleton */}
      <div className="flex gap-1 border-b pb-2">
        <Skeleton className="h-9 w-28 rounded-md bg-gray-200 dark:bg-gray-600" />
        <Skeleton className="h-9 w-24 rounded-md bg-gray-200 dark:bg-gray-600" />
        <Skeleton className="h-9 w-24 rounded-md bg-gray-200 dark:bg-gray-600" />
      </div>

      {/* Content Skeleton - Shipping Zones */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40 bg-gray-200 dark:bg-gray-600" />
            <Skeleton className="mt-1 h-4 w-64 bg-gray-200 dark:bg-gray-600" />
          </div>
          <Skeleton className="h-10 w-40 bg-gray-200 dark:bg-gray-600" />
        </div>

        {/* Zone Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-600" />
                <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-600" />
              </div>
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-600" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-600" />
                <Skeleton className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
