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
        className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={() => onOpenChange(false)}
      />

      {/* Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-x-0 top-0 z-[61] bg-background",
          "animate-in slide-in-from-top duration-400 ease-out",
          "max-h-[85vh] overflow-hidden rounded-b-3xl shadow-google-lg"
        )}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <Logo variant="default" className="h-7" />
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] hide-scrollbar">
          {/* Main Categories or Sub-menu */}
          {!activeCategory ? (
            // Main Menu
            <div className="p-4 space-y-3">
              {/* Category Cards */}
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.slug}
                      onClick={() => setActiveCategory(category.slug)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl",
                        "bg-secondary/50 hover:bg-secondary transition-google",
                        "text-left group"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-background">
                          <Icon className="size-5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  )
                })}
              </div>

              {/* All Products Link */}
              <Link
                href="/products"
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl",
                  "bg-primary/5 hover:bg-primary/10 transition-google"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <ShoppingBag className="size-5 text-primary" />
                  </div>
                  <span className="font-medium">Tous les produits</span>
                </div>
                <ChevronRight className="size-4 text-primary" />
              </Link>

              {/* Promotions Link */}
              {hasPromotions && (
                <Link
                  href="/promotions"
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl",
                    "bg-amber-500/10 hover:bg-amber-500/20 transition-google"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20">
                      <Sparkles className="size-5 text-amber-500" />
                    </div>
                    <span className="font-medium text-amber-700 dark:text-amber-400">Offres spéciales</span>
                  </div>
                  <ChevronRight className="size-4 text-amber-500" />
                </Link>
              )}

              {/* Divider */}
              <div className="h-px bg-border/50 my-4" />

              {/* User Section */}
              {authUser && user ? (
                <div className="space-y-2">
                  {/* User Profile Card */}
                  <Link
                    href="/account"
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl",
                      "bg-secondary/30 hover:bg-secondary/50 transition-google"
                    )}
                  >
                    <Avatar className="h-12 w-12 border-2 border-background shadow-google-sm">
                      <AvatarImage
                        src={user.avatar_url || undefined}
                        alt={user.full_name || "Avatar"}
                      />
                      <AvatarFallback className="bg-primary text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">
                        {user.full_name || "Utilisateur"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        Gérer mon compte
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Link>

                  {/* Quick Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-google"
                    >
                      <ShoppingBag className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Commandes</span>
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-google"
                    >
                      <Heart className="size-4 text-rose-500" />
                      <span className="text-sm font-medium">Favoris</span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 p-3 rounded-xl text-destructive hover:bg-destructive/5 transition-google"
                  >
                    <LogOut className="size-4" />
                    <span className="text-sm font-medium">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 rounded-xl h-12 font-bold bg-primary hover:bg-primary-hover text-white"
                    onClick={() => {
                      onOpenChange(false)
                      openLogin()
                    }}
                  >
                    <LogIn className="mr-2 size-4" />
                    Connexion
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-12 font-bold"
                    onClick={() => {
                      onOpenChange(false)
                      openRegister()
                    }}
                  >
                    Inscription
                  </Button>
                </div>
              )}

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 mt-4">
                <div className="flex items-center gap-3">
                  <Sun className="size-4 text-muted-foreground dark:hidden" />
                  <Moon className="size-4 text-muted-foreground hidden dark:block" />
                  <span className="text-sm font-medium">Apparence</span>
                </div>
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
