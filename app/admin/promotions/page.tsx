import { Suspense } from "react"
import { getAdminPromotions, getPromotionStats } from "@/actions/admin/promotions"
import { PromotionsDataTable } from "@/components/admin/promotions/PromotionsDataTable"
import { DataTableSkeleton } from "@/components/data-table"

interface PromotionsPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    isActive?: string
    type?: string
  }>
}

export default async function AdminPromotionsPage({ searchParams }: PromotionsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 20
  const search = params.search || ""
  const isActive = params.isActive === "true" ? true : params.isActive === "false" ? false : undefined
  const type = params.type as "percentage" | "fixed_amount" | "free_shipping" | undefined

  const [result, stats] = await Promise.all([
    getAdminPromotions({
      page,
      limit,
      search: search || undefined,
      isActive,
      type,
    }),
    getPromotionStats(),
  ])

  if (!result.data || "error" in result.data) {
    const errorMessage = result.data && "error" in result.data ? result.data.error : "Erreur lors du chargement"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { promotions = [], totalPages = 1, total = 0 } = result.data
  const promotionStats = stats && !("error" in stats) ? stats : undefined

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={9} rowCount={10} />}>
      <PromotionsDataTable
        promotions={promotions}
        pageCount={totalPages}
        currentPage={page}
        pageSize={limit}
        search={search}
        isActiveFilter={params.isActive}
        typeFilter={params.type}
        totalCount={total}
        stats={promotionStats}
      />
    </Suspense>
  )
}
