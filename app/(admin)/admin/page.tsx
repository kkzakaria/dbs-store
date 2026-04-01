import { getDb } from "@/lib/db";
import { getAdminStats } from "@/lib/data/admin-stats";
import { StatsCard } from "@/components/admin/stats-card";
import { OrdersChart } from "@/components/admin/orders-chart";
import { formatFCFA } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const db = await getDb();
  const stats = await getAdminStats(db);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Commandes aujourd'hui"
          value={stats.ordersToday}
        />
        <StatsCard
          title="Revenus ce mois"
          value={formatFCFA(stats.revenueMonth)}
          subtitle="commandes confirmées + livrées"
        />
        <StatsCard
          title="En attente"
          value={stats.pendingOrders}
          subtitle="commandes à traiter"
        />
        <StatsCard
          title="Stock faible"
          value={stats.lowStockProducts}
          subtitle="produits ≤ 3 unités"
        />
      </div>
      <div className="mt-6 max-w-sm">
        <OrdersChart data={stats.ordersByDay} />
      </div>
    </div>
  );
}
