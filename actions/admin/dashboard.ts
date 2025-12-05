"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/actions/auth"
import { isAdminRole } from "@/lib/validations/admin"

// ===========================================
// Get Dashboard Statistics
// ===========================================

export async function getDashboardStats() {
  // Verify admin access
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  try {
    // Get revenue for last 30 days
    const { data: currentRevenue } = await supabaseAdmin
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", thirtyDaysAgo.toISOString())

    // Get revenue for previous 30 days (for comparison)
    const { data: previousRevenue } = await supabaseAdmin
      .from("orders")
      .select("total")
      .eq("payment_status", "paid")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString())

    const currentTotal = currentRevenue?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
    const previousTotal = previousRevenue?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
    const revenueChange = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0

    // Get orders count
    const { count: totalOrders } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    const { count: pendingOrders } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "confirmed"])

    // Get previous period orders for comparison
    const { count: previousOrders } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString())

    const ordersChange = (previousOrders || 0) > 0
      ? Math.round((((totalOrders || 0) - (previousOrders || 0)) / (previousOrders || 1)) * 100)
      : 0

    // Get products count
    const { count: totalProducts } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })

    const { count: activeProducts } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Get customers count
    const { count: totalCustomers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer")

    const { count: newCustomers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", thirtyDaysAgo.toISOString())

    const { count: previousCustomers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString())

    const customersChange = (previousCustomers || 0) > 0
      ? Math.round((((newCustomers || 0) - (previousCustomers || 0)) / (previousCustomers || 1)) * 100)
      : 0

    return {
      revenue: {
        total: currentTotal,
        change: revenueChange,
      },
      orders: {
        total: totalOrders || 0,
        pending: pendingOrders || 0,
        change: ordersChange,
      },
      products: {
        total: totalProducts || 0,
        active: activeProducts || 0,
      },
      customers: {
        total: totalCustomers || 0,
        new: newCustomers || 0,
        change: customersChange,
      },
    }
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return { error: "Erreur lors de la récupération des statistiques" }
  }
}

// ===========================================
// Get Sales Chart Data
// ===========================================

export async function getSalesChartData(days: number = 30) {
  // Verify admin access
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days)

  try {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("total, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) throw error

    // Group by date
    const dailyData: Record<string, { revenue: number; orders: number }> = {}

    // Initialize all days with zeros
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split("T")[0]
      dailyData[dateKey] = { revenue: 0, orders: 0 }
    }

    // Aggregate orders by day
    orders?.forEach((order) => {
      if (!order.created_at) return
      const dateKey = new Date(order.created_at).toISOString().split("T")[0]
      if (dailyData[dateKey]) {
        dailyData[dateKey].revenue += order.total || 0
        dailyData[dateKey].orders += 1
      }
    })

    // Convert to array and format dates
    const chartData = Object.entries(dailyData).map(([date, data]) => {
      const d = new Date(date)
      const formattedDate = d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      })
      return {
        date: formattedDate,
        revenue: data.revenue,
        orders: data.orders,
      }
    })

    return { data: chartData }
  } catch (error) {
    console.error("Sales chart data error:", error)
    return { error: "Erreur lors de la récupération des données de ventes" }
  }
}

// ===========================================
// Get Recent Orders
// ===========================================

export async function getRecentOrders(limit: number = 5) {
  // Verify admin access
  const user = await getCurrentUser()
  if (!user || !isAdminRole(user.role)) {
    return { error: "Accès non autorisé" }
  }

  try {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        order_number,
        total,
        status,
        payment_status,
        created_at,
        user:users(id, full_name, phone)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return { orders: orders || [] }
  } catch (error) {
    console.error("Recent orders error:", error)
    return { error: "Erreur lors de la récupération des commandes récentes" }
  }
}
