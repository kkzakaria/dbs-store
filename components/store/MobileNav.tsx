"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ThemeToggle } from "./theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth-store"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"
import {
  FolderOpen,
  Sparkles,
  Heart,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  ShoppingBag,
  ChevronRight,
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
  { name: "Smartphone", slug: "smartphones" },
  { name: "Montre connectée", slug: "montres-connectees" },
  { name: "Tablette", slug: "tablettes" },
  { name: "Ordinateur", slug: "ordinateurs" },
  { name: "Accessoires", slug: "accessoires" },
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

  // Close menu on navigation
  React.useEffect(() => {
    onOpenChange(false)
  }, [pathname, onOpenChange])

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


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={cn(
          "w-[310px] p-0 border-r border-border/40",
          "bg-background/98 backdrop-blur-xl"
        )}
      >
        <SheetHeader className="p-6 border-b border-border/10">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo variant="default" asLink={false} />
        </SheetHeader>

        <div className="flex flex-col h-full overflow-y-auto hide-scrollbar pb-10">
          {/* User Section */}
          <div className="p-6">
            {authUser && user ? (
              <Link
                href="/account"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-3xl",
                  "bg-secondary/30 transition-google hover:bg-secondary/50"
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
                  <p className="text-sm font-bold truncate">
                    {user.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Compte client
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full rounded-2xl h-12 font-bold bg-primary hover:bg-primary-hover text-white transition-google shadow-google-sm"
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
                  className="w-full rounded-2xl h-12 font-bold border-border hover:bg-secondary transition-google"
                  onClick={() => {
                    onOpenChange(false)
                    openRegister()
                  }}
                >
                  Inscription
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            <Link
              href="/products"
              className={cn(
                "flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-medium transition-google",
                pathname === "/products"
                  ? "bg-primary/5 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <ShoppingBag className="size-5" />
              <span>Tous les produits</span>
            </Link>

            {hasPromotions && (
              <Link
                href="/promotions"
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-medium transition-google",
                  pathname === "/promotions"
                    ? "bg-primary/5 text-primary font-bold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Sparkles className="size-5 text-amber-500" />
                <span>Offres spéciales</span>
              </Link>
            )}

            <Accordion type="single" collapsible className="w-full px-0">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-4 hover:no-underline transition-google",
                    "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-4 w-full text-[15px] font-medium">
                    <FolderOpen className="size-5" />
                    <span>Catégories</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-1 px-4">
                  <div className="space-y-1 pl-9 border-l border-border/60">
                    {categories.map((category) => {
                      const isActive = pathname === `/categories/${category.slug}`
                      return (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-google",
                            isActive
                              ? "bg-primary/5 text-primary font-bold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span>{category.name}</span>
                          <ChevronRight className="size-4 opacity-40" />
                        </Link>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>

          {/* User Specific Nav */}
          {authUser && (
            <div className="p-4 pt-0 space-y-1">
              <div className="h-px bg-border/40 mx-4 my-4" />
              {userNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-medium transition-google",
                      isActive
                        ? "bg-primary/5 text-primary font-bold"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="size-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-[15px] font-medium text-destructive hover:bg-destructive/5 transition-google"
              >
                <LogOut className="size-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}

          {/* Footer of Mobile Nav */}
          <div className="mt-auto p-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-3xl bg-secondary/20">
              <div className="flex items-center gap-3">
                {pathname.includes('dark') ? <Moon className="size-5" /> : <Sun className="size-5" />}
                <span className="text-sm font-medium">Apparence</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
