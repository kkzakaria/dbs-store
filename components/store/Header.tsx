"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  X,
  Smartphone,
  Watch,
  Tablet,
  Laptop,
  Headphones,
  ChevronDown,
  ArrowRight,
} from "lucide-react"

const categories = [
  {
    name: "Smartphones",
    icon: Smartphone,
    href: "/categories/smartphones",
    color: "from-blue-500 to-cyan-400",
    featured: [
      { name: "iPhone 15 Pro", href: "/products/iphone-15-pro", image: "/images/products/iphone.jpg" },
      { name: "Samsung S24", href: "/products/samsung-s24", image: "/images/products/samsung.jpg" },
    ],
    brands: ["Apple", "Samsung", "Xiaomi", "Huawei"],
  },
  {
    name: "Montres",
    icon: Watch,
    href: "/categories/montres-connectees",
    color: "from-purple-500 to-pink-400",
    featured: [
      { name: "Apple Watch", href: "/products/apple-watch", image: "/images/products/watch.jpg" },
    ],
    brands: ["Apple", "Samsung", "Garmin"],
  },
  {
    name: "Tablettes",
    icon: Tablet,
    href: "/categories/tablettes",
    color: "from-orange-500 to-amber-400",
    featured: [
      { name: "iPad Pro", href: "/products/ipad-pro", image: "/images/products/ipad.jpg" },
    ],
    brands: ["Apple", "Samsung", "Lenovo"],
  },
  {
    name: "Ordinateurs",
    icon: Laptop,
    href: "/categories/ordinateurs",
    color: "from-green-500 to-emerald-400",
    featured: [
      { name: "MacBook Pro", href: "/products/macbook-pro", image: "/images/products/macbook.jpg" },
    ],
    brands: ["Apple", "Dell", "HP", "Lenovo"],
  },
  {
    name: "Accessoires",
    icon: Headphones,
    href: "/categories/accessoires",
    color: "from-rose-500 to-red-400",
    featured: [
      { name: "AirPods Pro", href: "/products/airpods-pro", image: "/images/products/airpods.jpg" },
    ],
    brands: ["Apple", "Samsung", "Sony", "JBL"],
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
  const [searchExpanded, setSearchExpanded] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const megaMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
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
      if (e.key === "Escape") {
        setSearchExpanded(false)
        setActiveCategory(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close mega menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setActiveCategory(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search input when expanded
  React.useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchExpanded])

  const userInitials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  const activeCategoryData = categories.find((c) => c.name === activeCategory)

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full",
          "transition-all duration-500 ease-out"
        )}
      >
        {/* Animated background blob */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              "absolute -top-20 -right-20 w-40 h-40 rounded-full",
              "bg-gradient-to-br from-primary/20 to-accent/10",
              "blob-slow opacity-50 blur-2xl",
              isScrolled ? "scale-150" : "scale-100"
            )}
          />
        </div>

        {/* Main header bar */}
        <div
          className={cn(
            "relative transition-all duration-500",
            isScrolled
              ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5"
              : "bg-transparent"
          )}
        >
          <div className="container">
            <div className="flex h-16 md:h-20 items-center justify-between gap-4">
              {/* Logo */}
              <Link
                href="/"
                className="relative flex items-center gap-3 group z-10"
              >
                <div className="relative">
                  <Logo variant="default" />
                  {/* Logo glow on hover */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full",
                      "bg-gradient-primary opacity-0 blur-xl",
                      "transition-opacity duration-500",
                      "group-hover:opacity-30"
                    )}
                  />
                </div>
              </Link>

              {/* Desktop Navigation - Floating Pill */}
              <nav
                ref={megaMenuRef}
                className="hidden lg:flex items-center"
              >
                <div
                  className={cn(
                    "relative flex items-center gap-1 px-2 py-1.5 rounded-full",
                    "bg-muted/50 backdrop-blur-sm",
                    "border border-border/50",
                    "transition-all duration-300",
                    isScrolled && "bg-muted/80"
                  )}
                >
                  {/* Promotions Link */}
                  {hasPromotions && (
                    <Link
                      href="/promotions"
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 rounded-full",
                        "text-sm font-semibold",
                        "transition-all duration-300",
                        pathname === "/promotions"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                          : "text-amber-600 hover:bg-amber-500/10"
                      )}
                    >
                      <Sparkles className="size-4" />
                      <span>Offres</span>
                      {pathname !== "/promotions" && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Category Links */}
                  {categories.map((category) => {
                    const Icon = category.icon
                    const isActive = pathname?.startsWith(category.href) || activeCategory === category.name

                    return (
                      <button
                        key={category.name}
                        onMouseEnter={() => setActiveCategory(category.name)}
                        onClick={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
                        className={cn(
                          "relative flex items-center gap-2 px-4 py-2 rounded-full",
                          "text-sm font-medium",
                          "transition-all duration-300",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="hidden xl:inline">{category.name}</span>
                        <ChevronDown
                          className={cn(
                            "size-3 transition-transform duration-300",
                            isActive && "rotate-180"
                          )}
                        />
                      </button>
                    )
                  })}
                </div>

                {/* Mega Menu */}
                {activeCategory && activeCategoryData && (
                  <div
                    className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px]",
                      "p-6 rounded-3xl",
                      "glass-card",
                      "shadow-2xl shadow-primary/10",
                      "animate-fade-in"
                    )}
                    onMouseLeave={() => setActiveCategory(null)}
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left side - Featured */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                          Produits populaires
                        </h3>
                        <div className="space-y-3">
                          {activeCategoryData.featured.map((product) => (
                            <Link
                              key={product.href}
                              href={product.href}
                              className={cn(
                                "group flex items-center gap-4 p-3 rounded-2xl",
                                "bg-muted/50 hover:bg-muted",
                                "transition-all duration-300",
                                "hover:translate-x-1"
                              )}
                              onClick={() => setActiveCategory(null)}
                            >
                              <div
                                className={cn(
                                  "relative w-12 h-12 rounded-xl overflow-hidden",
                                  "bg-gradient-to-br",
                                  activeCategoryData.color
                                )}
                              >
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <activeCategoryData.icon className="size-6 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Voir le produit
                                </p>
                              </div>
                              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Right side - Brands */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                          Marques
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {activeCategoryData.brands.map((brand) => (
                            <Link
                              key={brand}
                              href={`${activeCategoryData.href}?brand=${brand.toLowerCase()}`}
                              className={cn(
                                "px-4 py-2 rounded-full",
                                "text-sm font-medium",
                                "bg-muted/50 hover:bg-primary hover:text-primary-foreground",
                                "transition-all duration-300"
                              )}
                              onClick={() => setActiveCategory(null)}
                            >
                              {brand}
                            </Link>
                          ))}
                        </div>

                        {/* View all link */}
                        <Link
                          href={activeCategoryData.href}
                          className={cn(
                            "mt-6 flex items-center justify-center gap-2",
                            "w-full py-3 rounded-xl",
                            "bg-gradient-to-r",
                            activeCategoryData.color,
                            "text-white font-semibold text-sm",
                            "transition-all duration-300",
                            "hover:shadow-lg hover:scale-[1.02]",
                            "btn-shimmer"
                          )}
                          onClick={() => setActiveCategory(null)}
                        >
                          <span>Voir tous les {activeCategoryData.name.toLowerCase()}</span>
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {/* Search - Desktop Expandable */}
                <div className="hidden md:flex items-center">
                  {searchExpanded ? (
                    <div
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full",
                        "bg-muted border border-border/50",
                        "search-expand"
                      )}
                    >
                      <Search className="size-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Rechercher..."
                        className={cn(
                          "w-48 h-8 border-0 bg-transparent p-0",
                          "focus-visible:ring-0 focus-visible:ring-offset-0",
                          "placeholder:text-muted-foreground/60"
                        )}
                        onBlur={() => setSearchExpanded(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSearchExpanded(false)
                            setSearchOpen(true)
                          }
                        }}
                      />
                      <button
                        onClick={() => setSearchExpanded(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchExpanded(true)}
                      className={cn(
                        "relative rounded-full magnetic",
                        "hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <Search className="size-5" />
                      <span className="sr-only">Rechercher (Ctrl+K)</span>
                    </Button>
                  )}
                </div>

                {/* Search - Mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className={cn(
                    "md:hidden rounded-full magnetic",
                    "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Search className="size-5" />
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Cart */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openCart}
                  className={cn(
                    "relative rounded-full magnetic",
                    "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <ShoppingCart className="size-5" />
                  {isHydrated && totalItems > 0 && (
                    <Badge
                      className={cn(
                        "absolute -top-1 -right-1 size-5 p-0",
                        "flex items-center justify-center",
                        "text-[10px] font-bold",
                        "bg-gradient-to-r from-primary to-accent text-white",
                        "border-2 border-background",
                        "animate-scale-in"
                      )}
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </Badge>
                  )}
                </Button>

                {/* User Menu */}
                {!mounted || isLoading ? (
                  <div className="size-10 rounded-full bg-muted animate-pulse" />
                ) : authUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative h-10 w-10 rounded-full p-0",
                          "ring-2 ring-transparent",
                          "hover:ring-primary/30",
                          "transition-all duration-300"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user?.avatar_url || undefined}
                            alt={user?.full_name || "Avatar"}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-sm">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        "w-64 p-3 rounded-2xl",
                        "glass-card",
                        "animate-fade-in"
                      )}
                      align="end"
                    >
                      <DropdownMenuLabel className="font-normal p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {user?.full_name || "Utilisateur"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.phone}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer">
                        <Link href="/account" className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <User className="size-4" />
                          </div>
                          <span className="font-medium">Mon compte</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer">
                        <Link href="/orders" className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="size-4" />
                          </div>
                          <span className="font-medium">Mes commandes</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl p-3 cursor-pointer">
                        <Link href="/wishlist" className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Heart className="size-4" />
                          </div>
                          <span className="font-medium">Favoris</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem
                        onClick={signOut}
                        className="rounded-xl p-3 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <LogOut className="size-4" />
                          </div>
                          <span className="font-medium">Déconnexion</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={openLogin}
                    className={cn(
                      "hidden sm:flex rounded-full px-6 font-semibold",
                      "bg-gradient-to-r from-primary to-accent text-white",
                      "shadow-lg shadow-primary/25",
                      "hover:shadow-xl hover:shadow-primary/30",
                      "hover:scale-105 active:scale-95",
                      "transition-all duration-300",
                      "btn-shimmer"
                    )}
                  >
                    Connexion
                  </Button>
                )}

                {/* Mobile Menu */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(true)}
                  className={cn(
                    "lg:hidden rounded-full magnetic",
                    "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Menu className="size-5" />
                </Button>
              </div>
            </div>
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
