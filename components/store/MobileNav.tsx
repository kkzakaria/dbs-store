"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth-store"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"
import {
  Sparkles,
  Heart,
  User as UserIcon,
  LogOut,
  LogIn,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  X,
  Smartphone,
  Watch,
  Tablet,
  Laptop,
  Headphones,
  Sun,
  Moon,
} from "lucide-react"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  authUser: AuthUser | null
  onSignOut: () => Promise<void>
  hasPromotions?: boolean
}

const categories = [
  { 
    name: "Smartphones", 
    slug: "smartphones", 
    icon: Smartphone,
    products: ["iPhone 15 Pro", "Samsung S24", "Pixel 8 Pro"]
  },
  { 
    name: "Montres", 
    slug: "montres-connectees", 
    icon: Watch,
    products: ["Apple Watch Ultra", "Galaxy Watch 6", "Pixel Watch 2"]
  },
  { 
    name: "Tablettes", 
    slug: "tablettes", 
    icon: Tablet,
    products: ["iPad Pro", "Galaxy Tab S9", "Pixel Tablet"]
  },
  { 
    name: "Ordinateurs", 
    slug: "ordinateurs", 
    icon: Laptop,
    products: ["MacBook Pro", "Dell XPS", "ThinkPad"]
  },
  { 
    name: "Accessoires", 
    slug: "accessoires", 
    icon: Headphones,
    products: ["AirPods Pro", "Galaxy Buds", "Sony WH-1000XM5"]
  },
]

const userNavigation = [
  { name: "Mon compte", href: "/account", icon: UserIcon },
  { name: "Mes commandes", href: "/orders", icon: ShoppingBag },
  { name: "Liste de souhaits", href: "/wishlist", icon: Heart },
]

export function MobileNav({
  open,
  onOpenChange,
  user,
  authUser,
  onSignOut,
  hasPromotions = false,
}: MobileNavProps) {
  const pathname = usePathname()
  const { openLogin, openRegister } = useAuthStore()
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)

  // Close menu on navigation
  React.useEffect(() => {
    onOpenChange(false)
    setActiveCategory(null)
  }, [pathname, onOpenChange])

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleSignOut = async () => {
    await onSignOut()
    onOpenChange(false)
  }

  const userInitials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  const activeCategoryData = categories.find(c => c.slug === activeCategory)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[99] bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={() => onOpenChange(false)}
      />

      {/* Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-x-0 top-0 z-[100] bg-background",
          "animate-in slide-in-from-top duration-400 ease-out",
          "h-[100dvh] overflow-hidden shadow-none pt-20"
        )}
      >

        {/* Menu Content */}
        <div className="overflow-y-auto h-full hide-scrollbar pb-24">
          {/* Main Categories or Sub-menu */}
          {!activeCategory ? (
            // Main Menu
            <div className="p-4 space-y-3">
              {/* Category List - Google Style */}
              <div className="flex flex-col gap-1">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.slug}
                      onClick={() => setActiveCategory(category.slug)}
                      className={cn(
                        "flex items-center justify-between w-full px-6 py-4 rounded-full",
                        "hover:bg-secondary/50 transition-colors",
                        "text-left group"
                      )}
                    >
                      <span className="text-lg font-medium tracking-tight">{category.name}</span>
                      <div className="flex items-center gap-3">
                        <Icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* All Products Link */}
              <Link
                href="/products"
                className={cn(
                  "flex items-center justify-between px-6 py-4 rounded-full",
                  "hover:bg-secondary/50 transition-colors"
                )}
              >
                <span className="text-lg font-medium tracking-tight">Tous les produits</span>
                <ShoppingBag className="size-5 text-muted-foreground" />
              </Link>

              {/* Promotions Link */}
              {hasPromotions && (
                <Link
                  href="/promotions"
                  className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-full",
                    "hover:bg-secondary/50 transition-colors"
                  )}
                >
                  <span className="text-lg font-medium tracking-tight text-amber-600 dark:text-amber-500">Offres spéciales</span>
                  <Sparkles className="size-5 text-amber-600 dark:text-amber-500" />
                </Link>
              )}

              {/* Divider */}
              <div className="h-px bg-border/50 my-4" />

              {/* User Section Style Google */}
              {authUser && user ? (
                <div className="space-y-1">
                  <Link
                    href="/account"
                    className="flex items-center justify-between px-6 py-4 rounded-full hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-lg font-medium tracking-tight">Mon compte</span>
                    </div>
                  </Link>

                  <Link href="/orders" className="flex items-center justify-between px-6 py-4 rounded-full hover:bg-secondary/50 transition-colors">
                    <span className="text-lg font-medium tracking-tight">Commandes</span>
                    <ShoppingBag className="size-5 text-muted-foreground" />
                  </Link>
                  
                  <Link href="/wishlist" className="flex items-center justify-between px-6 py-4 rounded-full hover:bg-secondary/50 transition-colors">
                    <span className="text-lg font-medium tracking-tight">Favoris</span>
                    <Heart className="size-5 text-muted-foreground" />
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-between w-full px-6 py-4 rounded-full hover:bg-secondary/50 transition-colors text-left text-destructive"
                  >
                    <span className="text-lg font-medium tracking-tight">Déconnexion</span>
                    <LogOut className="size-5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-2">
                  <Button
                    className="rounded-full h-12 font-medium"
                    onClick={() => {
                      onOpenChange(false)
                      openLogin()
                    }}
                  >
                    Connexion
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full h-12 font-medium"
                    onClick={() => {
                      onOpenChange(false)
                      openRegister()
                    }}
                  >
                    Inscription
                  </Button>
                </div>
              )}

              {/* Theme Toggle - Minimal */}
              <div className="flex items-center justify-between px-6 py-4 rounded-full hover:bg-secondary/50 transition-colors">
                <span className="text-lg font-medium tracking-tight">Apparence</span>
                <ThemeToggle />
              </div>
            </div>
          ) : (
            // Sub-menu (Category Detail)
            <div className="p-4">
              {/* Back Button */}
              <button
                onClick={() => setActiveCategory(null)}
                className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-5" />
                <span className="font-medium">Retour</span>
              </button>

              {/* Category Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{activeCategoryData?.name}</h2>
              </div>

              {/* View All Link */}
              <Link
                href={`/categories/${activeCategory}`}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl mb-4",
                  "bg-primary text-white"
                )}
              >
                <span className="font-semibold">Voir tous les {activeCategoryData?.name.toLowerCase()}</span>
                <ChevronRight className="size-5" />
              </Link>

              {/* Products in Category */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Produits populaires
                </h3>
                {activeCategoryData?.products.map((product) => (
                  <Link
                    key={product}
                    href={`/products?q=${encodeURIComponent(product)}`}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl",
                      "bg-muted/50 hover:bg-muted transition-google"
                    )}
                  >
                    <span className="font-medium">{product}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
