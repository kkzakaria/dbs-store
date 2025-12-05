import { Suspense } from "react"
import { getAdminReviews, getReviewStats } from "@/actions/admin/reviews"
import { ReviewsDataTable } from "@/components/admin/reviews/ReviewsDataTable"
import { DataTableSkeleton } from "@/components/data-table"

interface ReviewsPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    isApproved?: string
    rating?: string
  }>
}

export default async function AdminReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 20
  const search = params.search || ""
  const isApproved = params.isApproved === "true" ? true : params.isApproved === "false" ? false : undefined
  const rating = params.rating ? Number(params.rating) : undefined

  const [result, stats] = await Promise.all([
    getAdminReviews({
      page,
      limit,
      search: search || undefined,
      isApproved,
      rating,
    }),
    getReviewStats(),
  ])

  if (!result.data || "error" in result.data) {
    const errorMessage = result.data && "error" in result.data ? result.data.error : "Erreur lors du chargement"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { reviews = [], totalPages = 1, total = 0 } = result.data
  const reviewStats = stats && !("error" in stats) ? stats : undefined

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
      <ReviewsDataTable
        reviews={reviews}
        pageCount={totalPages}
        currentPage={page}
        pageSize={limit}
        search={search}
        totalCount={total}
        stats={reviewStats}
      />
    </Suspense>
  )
}
