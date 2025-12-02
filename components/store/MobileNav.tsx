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
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "./theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User as AuthUser } from "@supabase/supabase-js"
import type { User } from "@/types"
import {
  FolderOpen,
  Percent,
  Heart,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  ShoppingBag,
} from "lucide-react"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  authUser: AuthUser | null
  onSignOut: () => Promise<void>
}

const navigation = [
  { name: "Offre", href: "/promotions", icon: Percent },
]

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
}: MobileNavProps) {
  const pathname = usePathname()

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
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <Logo variant="default" asLink={false} />
        </SheetHeader>

        <div className="flex flex-col h-full overflow-y-auto">
          {/* User Section */}
          <div className="p-4">
            {authUser && user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.avatar_url || undefined}
                    alt={user.full_name || "Avatar"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.phone}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button asChild variant="default" className="flex-1">
                  <Link href="/login">
                    <LogIn className="mr-2 size-4" />
                    Connexion
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/register">
                    <UserPlus className="mr-2 size-4" />
                    Inscription
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {item.name}
                </Link>
              )
            })}

            {/* Categories Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:no-underline [&[data-state=open]]:bg-accent [&[data-state=open]]:text-accent-foreground">
                  <FolderOpen className="size-5" />
                  Catégories
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="ml-8 space-y-1 py-2">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/categories/${category.slug}`}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          pathname === `/categories/${category.slug}`
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>

          {/* User Navigation (if logged in) */}
          {authUser && (
            <>
              <Separator />
              <nav className="p-4 space-y-1">
                {userNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="size-5" />
                      {item.name}
                    </Link>
                  )
                })}

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-5" />
                  Déconnexion
                </button>
              </nav>
            </>
          )}

          {/* Theme Toggle */}
          <Separator />
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Thème</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
