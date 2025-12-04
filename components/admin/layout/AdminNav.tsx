"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Percent,
  Users,
  Warehouse,
  Star,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Produits", href: "/admin/products", icon: Package },
  { label: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Promotions", href: "/admin/promotions", icon: Percent },
  { label: "Clients", href: "/admin/customers", icon: Users },
  { label: "Inventaire", href: "/admin/inventory", icon: Warehouse },
  { label: "Avis", href: "/admin/reviews", icon: Star },
  { label: "Parametres", href: "/admin/settings", icon: Settings },
]

interface AdminNavProps {
  collapsed?: boolean
  onItemClick?: () => void
}

export function AdminNav({ collapsed = false, onItemClick }: AdminNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export { navItems }
