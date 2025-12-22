"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SearchCommand } from "./SearchCommand"
import { MobileNav } from "./MobileNav"
import { ThemeToggle } from "./theme-toggle"
import { AuthDialog } from "@/components/auth"
import { useUser } from "@/hooks/use-user"
import { useCart } from "@/hooks/use-cart"
import { useHasActivePromotions } from "@/hooks/use-promotions"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Package,
  Heart,
  Menu,
  Sparkles,
  ChevronRight,
} from "lucide-react"

type NavigationItem = {
  name: string
  href?: string
  submenu?: boolean
  items?: { name: string; href: string; description?: string }[]
}

const navigation: NavigationItem[] = [
  {
    name: "Smartphone",
    submenu: true,
    items: [
      { name: "Tous les smartphones", href: "/categories/smartphones", description: "Découvrez notre gamme complète" },
      { name: "iPhone", href: "/categories/smartphones?brand=apple", description: "Apple iPhone" },
      { name: "Samsung Galaxy", href: "/categories/smartphones?brand=samsung", description: "Samsung Galaxy Series" },
      { name: "Xiaomi", href: "/categories/smartphones?brand=xiaomi", description: "Xiaomi & Redmi" },
    ],
  },
  {
    name: "Montre connectée",
    submenu: true,
    items: [
      { name: "Toutes les montres", href: "/categories/montres-connectees", description: "Montres intelligentes" },
      { name: "Apple Watch", href: "/categories/montres-connectees?brand=apple", description: "Apple Watch Series" },
      { name: "Samsung Galaxy Watch", href: "/categories/montres-connectees?brand=samsung", description: "Galaxy Watch" },
    ],
  },
  {
    name: "Tablette",
    submenu: true,
    items: [
      { name: "Toutes les tablettes", href: "/categories/tablettes", description: "Tablettes tactiles" },
      { name: "iPad", href: "/categories/tablettes?brand=apple", description: "Apple iPad" },
      { name: "Samsung Tab", href: "/categories/tablettes?brand=samsung", description: "Galaxy Tab Series" },
    ],
  },
  {
    name: "Ordinateur",
    submenu: true,
    items: [
      { name: "Tous les ordinateurs", href: "/categories/ordinateurs", description: "PC portables & fixes" },
      { name: "MacBook", href: "/categories/ordinateurs?brand=apple", description: "Apple MacBook" },
      { name: "PC Portable", href: "/categories/ordinateurs?type=laptop", description: "Laptops Windows" },
      { name: "PC Bureau", href: "/categories/ordinateurs?type=desktop", description: "Ordinateurs de bureau" },
    ],
  },
  {
    name: "Accessoires",
    submenu: true,
    items: [
      { name: "Tous les accessoires", href: "/categories/accessoires", description: "Accessoires high-tech" },
      { name: "Écouteurs & Casques", href: "/categories/accessoires?type=audio", description: "Audio sans fil" },
      { name: "Chargeurs", href: "/categories/accessoires?type=chargeurs", description: "Chargeurs & câbles" },
      { name: "Coques & Protection", href: "/categories/accessoires?type=protection", description: "Protection smartphone" },
    ],
  },
]

export function Header() {
  const pathname = usePathname()
  const { user, authUser, signOut, isLoading } = useUser()
  const { totalItems, openCart, isHydrated } = useCart()
  const { hasPromotions } = useHasActivePromotions()
  const { openLogin } = useAuthStore()
  const { resolvedTheme } = useTheme()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Build navigation with optional "Offre" item
  const fullNavigation = React.useMemo(() => {
    if (hasPromotions) {
      return [{ name: "Offres", href: "/promotions" }, ...navigation]
    }
    return navigation
  }, [hasPromotions])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Keyboard shortcut for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const userInitials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-500",
          isScrolled
            ? "glass-strong shadow-soft"
            : "bg-background/80 backdrop-blur-md"
        )}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-primary opacity-80" />

        <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo variant="default" />
          </Link>

          {/* Desktop Navigation */}
          {mounted ? (
            <NavigationMenu className="hidden lg:flex" viewport={false}>
              <NavigationMenuList className="gap-0.5">
                {fullNavigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.submenu ? (
                      <>
                        <NavigationMenuTrigger
                          className={cn(
                            "relative !bg-transparent text-sm font-medium transition-all duration-300 px-4 py-2 rounded-full",
                            "hover:!bg-primary/8 hover:!text-primary",
                            "data-[state=open]:!bg-primary/10 data-[state=open]:!text-primary",
                            pathname?.startsWith("/categories/" + item.name.toLowerCase().replace(/ /g, "-"))
                              ? "!text-primary !bg-primary/10"
                              : "text-foreground/70"
                          )}
                        >
                          {item.name}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent
                          className={cn(
                            "p-3 !rounded-2xl border-0",
                            "bg-card/95 backdrop-blur-xl",
                            "shadow-elevated",
                            "animate-fade-in"
                          )}
                        >
                          <ul className="grid w-[300px] gap-1">
                            {item.items?.map((subItem, idx) => (
                              <li key={subItem.href}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={subItem.href}
                                    className={cn(
                                      "group flex items-center gap-3 select-none rounded-xl px-4 py-3",
                                      "outline-none transition-all duration-200",
                                      "hover:bg-primary/8 hover:translate-x-1",
                                      pathname === subItem.href && "bg-primary/10"
                                    )}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                  >
                                    <div className="flex-1">
                                      <div className={cn(
                                        "text-sm font-semibold transition-colors",
                                        pathname === subItem.href ? "text-primary" : "group-hover:text-primary"
                                      )}>
                                        {subItem.name}
                                      </div>
                                      {subItem.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {subItem.description}
                                        </p>
                                      )}
                                    </div>
                                    <ChevronRight className={cn(
                                      "size-4 text-muted-foreground/50 transition-all duration-200",
                                      "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                    )} />
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <Link
                        href={item.href!}
                        className={cn(
                          "relative flex items-center gap-2 text-sm font-medium transition-all duration-300",
                          "px-4 py-2 rounded-full",
                          "hover:bg-primary/8 hover:text-primary",
                          pathname === item.href
                            ? "text-primary bg-primary/10"
                            : "text-foreground/70"
                        )}
                      >
                        {item.name === "Offres" && (
                          <Sparkles className="size-4 text-amber-500 animate-pulse-soft" />
                        )}
                        <span>{item.name}</span>
                        {item.name === "Offres" && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        )}
                      </Link>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <nav className="hidden lg:flex items-center gap-1">
              {fullNavigation.slice(0, 4).map((item) => (
                <span
                  key={item.name}
                  className="text-sm font-medium text-foreground/50 px-4 py-2 rounded-full"
                >
                  {item.name}
                </span>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className={cn(
                "relative rounded-full transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary hover:scale-105",
                "active:scale-95"
              )}
            >
              <Search className="size-5" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative rounded-full transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary hover:scale-105",
                "active:scale-95"
              )}
              onClick={openCart}
              aria-label="Panier"
            >
              <ShoppingCart className="size-5" />
              {isHydrated && totalItems > 0 && (
                <Badge
                  className={cn(
                    "absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center",
                    "text-[10px] font-bold border-2 border-background",
                    "bg-gradient-primary text-white",
                    "animate-scale-in"
                  )}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
            </Button>

            {/* User Menu / Login */}
            {!mounted || isLoading ? (
              <Button variant="ghost" size="icon" disabled className="rounded-full">
                <User className="size-5" />
              </Button>
            ) : authUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "relative h-10 w-10 rounded-full p-0",
                      "ring-2 ring-transparent hover:ring-primary/30",
                      "transition-all duration-300"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.avatar_url || undefined}
                        alt={user?.full_name || "Avatar"}
                      />
                      <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-60 p-2 rounded-2xl border-0",
                    "bg-card/95 backdrop-blur-xl",
                    "shadow-elevated",
                    "animate-fade-in"
                  )}
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-semibold">
                          {user?.full_name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.phone}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2 bg-border/50" />
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Link href="/account" className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                        <User className="size-4" />
                      </div>
                      <span className="font-medium">Mon compte</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Link href="/orders" className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                        <Package className="size-4" />
                      </div>
                      <span className="font-medium">Mes commandes</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer">
                    <Link href="/wishlist" className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-pink-500/10 text-pink-500">
                        <Heart className="size-4" />
                      </div>
                      <span className="font-medium">Liste de souhaits</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 bg-border/50" />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10">
                        <LogOut className="size-4" />
                      </div>
                      <span className="font-medium">Déconnexion</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "hidden sm:flex rounded-full px-5 font-semibold",
                  "bg-gradient-primary hover:opacity-90",
                  "shadow-soft hover:shadow-glow-sm",
                  "transition-all duration-300",
                  "active:scale-95"
                )}
                onClick={openLogin}
              >
                Connexion
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "lg:hidden rounded-full",
                "hover:bg-primary/10 hover:text-primary",
                "transition-all duration-300"
              )}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search Command Dialog */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        user={user}
        authUser={authUser}
        onSignOut={signOut}
        hasPromotions={hasPromotions}
      />

      {/* Auth Dialog */}
      <AuthDialog />
    </>
  )
}
