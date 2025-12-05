import { getDashboardStats, getSalesChartData, getRecentOrders } from "@/actions/admin/dashboard"
import { StatsCards } from "@/components/admin/dashboard/StatsCards"
import { SalesChart } from "@/components/admin/dashboard/SalesChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/config"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmee", variant: "default" },
  processing: { label: "En cours", variant: "default" },
  shipped: { label: "Expediee", variant: "default" },
  delivered: { label: "Livree", variant: "outline" },
  cancelled: { label: "Annulee", variant: "destructive" },
  refunded: { label: "Remboursee", variant: "destructive" },
}

export default async function AdminDashboardPage() {
  const [statsResult, chartResult, ordersResult] = await Promise.all([
    getDashboardStats(),
    getSalesChartData(30),
    getRecentOrders(5),
  ])

  // Handle errors
  if ("error" in statsResult) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">{statsResult.error}</p>
      </div>
    )
  }

  const stats = statsResult
  const chartData = "data" in chartResult && chartResult.data ? chartResult.data : []
  const recentOrders = "orders" in ordersResult && ordersResult.orders ? ordersResult.orders : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre boutique
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts and Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Sales Chart */}
        <div className="lg:col-span-4">
          <SalesChart data={chartData} />
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Commandes recentes</CardTitle>
                <CardDescription>
                  Les 5 dernieres commandes
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">
                  Voir tout
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Aucune commande pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const orderStatus = order.status || "pending"
                    const status = statusLabels[orderStatus] || {
                      label: orderStatus,
                      variant: "secondary" as const,
                    }
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {order.order_number}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {order.user?.full_name || order.user?.phone || "Client"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(order.total)}
                          </p>
                          <Badge variant={status.variant} className="mt-1">
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
