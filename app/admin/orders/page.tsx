import { Suspense } from "react"
import { getAdminOrders, getOrderStats } from "@/actions/admin/orders"
import { OrdersDataTable } from "@/components/admin/orders/OrdersDataTable"
import { DataTableSkeleton } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react"

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
    paymentStatus?: string
    dateFrom?: string
    dateTo?: string
  }>
}

async function OrderStats() {
  const result = await getOrderStats()

  if (!result || "error" in result) {
    return null
  }

  const { stats } = result
  const statsCards = [
    {
      title: "En attente",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "En préparation",
      value: stats.processing,
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Expédiées",
      value: stats.shipped,
      icon: Truck,
      color: "text-cyan-600",
    },
    {
      title: "Livrées",
      value: stats.delivered,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Annulées",
      value: stats.cancelled,
      icon: XCircle,
      color: "text-red-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {statsCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 10
  const search = params.search || ""
  const status = params.status
  const paymentStatus = params.paymentStatus

  const result = await getAdminOrders({
    page,
    limit,
    search: search || undefined,
    status: status as never,
    paymentStatus: paymentStatus as never,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sort: "created_at",
    order: "desc",
  })

  if (!result.data) {
    const errorMessage = "error" in result ? String(result.data) : "Erreur lors du chargement"
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{errorMessage}</p>
      </div>
    )
  }

  const { orders = [], totalPages = 1, total = 0 } = result.data

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>}>
        <OrderStats />
      </Suspense>

      <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}>
        <OrdersDataTable
          orders={orders}
          pageCount={totalPages}
          currentPage={page}
          pageSize={limit}
          search={search}
          statusFilter={status}
          paymentStatusFilter={paymentStatus}
          totalCount={total}
        />
      </Suspense>
    </div>
  )
}
