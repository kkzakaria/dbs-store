import { Suspense } from "react"
import { getAdminCustomers, getCustomerStats } from "@/actions/admin/customers"
import { CustomersDataTable } from "@/components/admin/customers/CustomersDataTable"
import { DataTableSkeleton } from "@/components/data-table"

interface CustomersPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    role?: string
  }>
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 20
  const search = params.search || ""
  const role = params.role as "customer" | "admin" | "super_admin" | undefined

  const [result, stats] = await Promise.all([
    getAdminCustomers({
      page,
      limit,
      search: search || undefined,
      role,
    }),
    getCustomerStats(),
  ])

  if (!result.data || "error" in result.data) {
    const errorMessage = result.data && "error" in result.data ? result.data.error : "Erreur lors du chargement"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { customers = [], totalPages = 1, total = 0 } = result.data
  const customerStats = stats && !("error" in stats) ? stats : undefined

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}>
      <CustomersDataTable
        customers={customers}
        pageCount={totalPages}
        currentPage={page}
        pageSize={limit}
        search={search}
        totalCount={total}
        stats={customerStats}
      />
    </Suspense>
  )
}
