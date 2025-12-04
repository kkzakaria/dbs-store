"use client"

import Link from "next/link"
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/config"
import { cn } from "@/lib/utils"

interface DashboardStats {
  revenue: {
    total: number
    change: number
  }
  orders: {
    total: number
    pending: number
    change: number
  }
  products: {
    total: number
    active: number
  }
  customers: {
    total: number
    new: number
    change: number
  }
}

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Chiffre d'affaires",
      value: formatPrice(stats.revenue.total),
      change: stats.revenue.change,
      subtitle: "30 derniers jours",
      icon: DollarSign,
      href: "/admin/orders",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Commandes",
      value: stats.orders.total.toString(),
      change: stats.orders.change,
      subtitle: `${stats.orders.pending} en attente`,
      icon: ShoppingCart,
      href: "/admin/orders",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
    },
    {
      title: "Produits",
      value: stats.products.total.toString(),
      subtitle: `${stats.products.active} actifs`,
      icon: Package,
      href: "/admin/products",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
    {
      title: "Clients",
      value: stats.customers.total.toString(),
      change: stats.customers.change,
      subtitle: `${stats.customers.new} nouveaux ce mois`,
      icon: Users,
      href: "/admin/customers",
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("rounded-full p-2", card.iconBg)}>
              <card.icon className={cn("h-4 w-4", card.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              {card.change !== undefined && (
                <div
                  className={cn(
                    "flex items-center text-xs font-medium",
                    card.change >= 0 ? "text-emerald-500" : "text-destructive"
                  )}
                >
                  {card.change >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {card.change >= 0 ? "+" : ""}
                  {card.change}%
                </div>
              )}
            </div>
            {card.href && (
              <Link
                href={card.href}
                className="absolute inset-0 z-10"
                aria-label={`Voir ${card.title.toLowerCase()}`}
              >
                <span className="sr-only">Voir details</span>
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
