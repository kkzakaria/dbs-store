"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, MapPin, Package, Gift } from "lucide-react"

const navItems = [
  {
    label: "Mon profil",
    href: "/account/profile",
    icon: User,
  },
  {
    label: "Mes adresses",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    label: "Mes commandes",
    href: "/orders",
    icon: Package,
  },
  {
    label: "Fidélité",
    href: "/account/loyalty",
    icon: Gift,
  },
]

interface AccountNavProps {
  className?: string
}

export function AccountNav({ className }: AccountNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/orders" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile version (horizontal)
export function AccountNavMobile({ className }: AccountNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/orders" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
