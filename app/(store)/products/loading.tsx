import { Skeleton } from "@/components/ui/skeleton"

export default function ProductsLoading() {
  return (
    <div className="bg-white dark:bg-background min-h-screen">
      <div className="container-google py-4 md:py-6">
        {/* Header skeleton */}
        <div className="mb-6 md:mb-8 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-blue-100/50 dark:border-blue-900/20">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        <div className="flex flex-col gap-16 lg:flex-row">
          {/* Sidebar skeleton */}
          <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </aside>

          {/* Grid skeleton */}
          <main className="flex-1">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
