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
          "w-[320px] p-0 border-r-0",
          "bg-background/95 backdrop-blur-xl"
        )}
      >
        <SheetHeader className="p-5 pb-0">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <Logo variant="default" asLink={false} />
        </SheetHeader>

        <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
          {/* User Section */}
          <div className="p-5">
            {authUser && user ? (
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl",
                  "bg-gradient-to-r from-primary/10 to-accent/5",
                  "border border-primary/10"
                )}
              >
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.full_name || "Avatar"}
                  />
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.phone}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className={cn(
                    "flex-1 rounded-xl font-semibold",
                    "bg-gradient-primary hover:opacity-90",
                    "shadow-soft"
                  )}
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
                  className="flex-1 rounded-xl font-semibold border-primary/30 hover:bg-primary/5"
                  onClick={() => {
                    onOpenChange(false)
                    openRegister()
                  }}
                >
                  <UserPlus className="mr-2 size-4" />
                  Inscription
                </Button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Main Navigation */}
          <nav className="flex-1 p-5 space-y-1">
            {/* Promotions Link */}
            {hasPromotions && (
              <Link
                href="/promotions"
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3",
                  "transition-all duration-300",
                  pathname === "/promotions"
                    ? "bg-gradient-primary text-white shadow-soft"
                    : "text-foreground hover:bg-primary/10"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center size-9 rounded-lg",
                    pathname === "/promotions"
                      ? "bg-white/20"
                      : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  <Sparkles className="size-5" />
                </div>
                <span className="font-medium flex-1">Offres</span>
                {pathname !== "/promotions" && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </Link>
            )}

            {/* Categories Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3",
                    "text-foreground hover:bg-primary/10",
                    "hover:no-underline transition-all duration-300",
                    "[&[data-state=open]]:bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="size-5" />
                  </div>
                  <span className="font-medium flex-1 text-left">Catégories</span>
                </AccordionTrigger>
                <AccordionContent className="pb-0 pt-1">
                  <div className="ml-4 space-y-1 pl-8 border-l-2 border-primary/20">
                    {categories.map((category) => {
                      const isActive = pathname === `/categories/${category.slug}`
                      return (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-2.5",
                            "transition-all duration-300",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span className="flex-1">{category.name}</span>
                          <ChevronRight
                            className={cn(
                              "size-4 transition-all duration-300",
                              isActive
                                ? "opacity-100"
                                : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            )}
                          />
                        </Link>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>

          {/* User Navigation (if logged in) */}
          {authUser && (
            <>
              {/* Divider */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              <nav className="p-5 space-y-1">
                {userNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3",
                        "transition-all duration-300",
                        isActive
                          ? "bg-gradient-primary text-white shadow-soft"
                          : "text-foreground hover:bg-primary/10"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center size-9 rounded-lg",
                          isActive ? "bg-white/20" : "bg-primary/10 text-primary",
                          item.href === "/wishlist" && !isActive && "bg-rose-500/10 text-rose-500"
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span className="font-medium flex-1">{item.name}</span>
                      <ChevronRight
                        className={cn(
                          "size-4 transition-all duration-300",
                          isActive
                            ? "opacity-100"
                            : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                        )}
                      />
                    </Link>
                  )
                })}

                <button
                  onClick={handleSignOut}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-4 py-3",
                    "text-destructive hover:bg-destructive/10",
                    "transition-all duration-300"
                  )}
                >
                  <div className="flex items-center justify-center size-9 rounded-lg bg-destructive/10">
                    <LogOut className="size-5" />
                  </div>
                  <span className="font-medium flex-1 text-left">Déconnexion</span>
                </button>
              </nav>
            </>
          )}

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Theme Toggle */}
          <div className="p-5">
            <div
              className={cn(
                "flex items-center justify-between",
                "p-3 rounded-xl bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary">
                  <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
                <span className="text-sm font-medium">Thème</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
