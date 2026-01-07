"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"
import {
  Sparkles,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Watch,
  Tablet,
  Laptop,
  Headphones,
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

export function MobileNav({
  open,
  onOpenChange,
  hasPromotions = false,
}: MobileNavProps) {
  const pathname = usePathname()
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
      {/* Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-x-0 top-0 z-[100]",
          "animate-in slide-in-from-bottom-[5%] duration-500 ease-out", // Slightly modified animation to feel like it rises/settles or slides
          "h-[100dvh] flex flex-col"
        )}
      >
        {/* Transparent Spacer for Appbar */}
        <div className="h-[72px] shrink-0 bg-transparent" onClick={() => onOpenChange(false)} />

        {/* Menu Sheet - Rounded Top */}
        <div className="flex-1 bg-background rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative">
          
          {/* Menu Content */}
          <div className="overflow-y-auto h-full hide-scrollbar pb-24 pt-4">
          {/* Main Categories or Sub-menu */}
          {!activeCategory ? (
            // Main Menu
            <div className="p-4 space-y-3">
              {/* Category List - Google Style Capsules */}
              <div className="flex flex-col gap-2 px-4">
                {/* Promotions Link - First Position */}
                {hasPromotions && (
                  <Link
                    href="/promotions"
                    className={cn(
                      "flex items-center justify-between w-full p-2 pl-6 rounded-[32px]",
                      "bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-200",
                      "min-h-[64px]"
                    )}
                  >
                    <span className="text-base font-semibold tracking-tight text-amber-900 dark:text-amber-500">Offres spéciales</span>
                    <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/20 shadow-sm h-12 w-12">
                      <Sparkles className="size-6 text-amber-600 dark:text-amber-500" />
                    </div>
                  </Link>
                )}

                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.slug}
                      onClick={() => setActiveCategory(category.slug)}
                      className={cn(
                        "flex items-center justify-between w-full p-2 pl-6 rounded-[32px]", // Compact rounded
                        "bg-[#F1F3F4] dark:bg-muted transition-all duration-200",
                        "text-left group min-h-[64px]" // Reduced height
                      )}
                    >
                      <span className="text-base font-semibold tracking-tight text-foreground">{category.name}</span>
                      <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/20 shadow-sm h-12 w-12">
                        <Icon className="size-6 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* All Products Link - Google Capsule Style */}
              <div className="px-4 flex flex-col gap-2 mt-2">
                <Link
                  href="/products"
                  className={cn(
                    "flex items-center justify-between w-full p-2 pl-6 rounded-[32px]",
                    "bg-[#F1F3F4] dark:bg-muted transition-all duration-200",
                    "min-h-[64px]"
                  )}
                >
                  <span className="text-base font-semibold tracking-tight text-foreground">Tous les produits</span>
                  <div className="flex items-center justify-center p-2 mr-0 rounded-full bg-white dark:bg-black/20 shadow-sm h-12 w-12">
                    <ShoppingBag className="size-6 text-foreground" />
                  </div>
                </Link>

                {/* Promotions Link removed from here */}
              </div>

              {/* Divider */}
              <div className="h-px bg-border/50 my-4" />

              {/* User Section Style Google Capsules */}
              <div className="px-4 flex flex-col gap-2">


              {/* Theme Toggle - Minimal Capsule */}
              <div className={cn(
                "flex items-center justify-between w-full p-2 pl-6 rounded-[32px]",
                "bg-[#F1F3F4] dark:bg-muted transition-all duration-200",
                "min-h-[64px]"
              )}>
                <span className="text-base font-semibold tracking-tight text-foreground">Apparence</span>
                <div className="mr-2">
                   <ThemeToggle />
                </div>
              </div>
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
      </div>
    </>
  )
}
