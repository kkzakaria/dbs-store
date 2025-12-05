"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, User, Store, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminSidebarMobile } from "./AdminSidebarMobile"
import { ThemeToggle } from "@/components/store/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type User = Database["public"]["Tables"]["users"]["Row"]

interface AdminHeaderProps {
  user: User
}

// Map routes to page titles
const pageTitles: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/products": "Produits",
  "/admin/products/new": "Nouveau produit",
  "/admin/categories": "Catégories",
  "/admin/orders": "Commandes",
  "/admin/customers": "Clients",
  "/admin/settings": "Paramètres",
}

function getPageTitle(pathname: string): string {
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  // Check for edit pages (e.g., /admin/products/[id]/edit)
  if (pathname.includes("/admin/products/") && pathname.endsWith("/edit")) {
    return "Modifier le produit"
  }

  // Check for parent routes
  for (const [route, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(route) && route !== "/admin") {
      return title
    }
  }

  return "Administration"
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const pageTitle = getPageTitle(pathname)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD"

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
      {/* Mobile Menu */}
      <AdminSidebarMobile />

      {/* Title / Breadcrumb */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View Store */}
        <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
          <Link href="/" target="_blank">
            <Store className="h-5 w-5" />
            <span className="sr-only">Voir la boutique</span>
          </Link>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {/* Notification badge - can be dynamic later */}
          {/* <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">3</span> */}
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user.avatar_url || undefined}
                  alt={user.full_name || "Admin"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.full_name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{user.phone}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/" className="cursor-pointer">
                <Store className="mr-2 h-4 w-4" />
                Voir la boutique
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
