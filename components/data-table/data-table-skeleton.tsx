import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DataTableSkeletonProps {
  /**
   * Number of columns to display
   * @default 5
   */
  columnCount?: number;
  /**
   * Number of rows to display
   * @default 10
   */
  rowCount?: number;
  /**
   * Show toolbar skeleton
   * @default true
   */
  showToolbar?: boolean;
  /**
   * Show pagination skeleton
   * @default true
   */
  showPagination?: boolean;
  /**
   * Width of each column (can be different for variety)
   * @default ["w-24", "w-32", "w-20", "w-28", "w-16"]
   */
  columnWidths?: string[];
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
  showToolbar = true,
  showPagination = true,
  columnWidths = ["w-24", "w-32", "w-20", "w-28", "w-16"],
}: DataTableSkeletonProps) {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Toolbar Skeleton */}
      {showToolbar && (
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      )}

      {/* Table Skeleton */}
      <div className="rounded-md border flex-1 min-h-0">
        <div className="relative h-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            {/* Header */}
            <thead className="[&_tr]:border-b sticky top-0 z-10 bg-card shadow-sm">
              <tr className="border-b-2 bg-card">
                {Array.from({ length: columnCount }).map((_, index) => (
                  <th
                    key={`header-${index}`}
                    className="h-10 px-2 text-left align-middle"
                  >
                    <Skeleton
                      className={cn(
                        "h-4",
                        columnWidths[index % columnWidths.length]
                      )}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="border-b transition-colors"
                >
                  {Array.from({ length: columnCount }).map((_, colIndex) => (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="p-2 align-middle"
                    >
                      <Skeleton
                        className={cn(
                          "h-4",
                          columnWidths[colIndex % columnWidths.length]
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex-1">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-[70px]" />
              </div>
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center space-x-2">
                <Skeleton className="hidden h-8 w-8 lg:block" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="hidden h-8 w-8 lg:block" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
