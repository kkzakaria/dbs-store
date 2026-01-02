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

  // Handle scroll effect - detect when to transform to pill
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
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
      {/* Floating Menu Button - Mobile only, appears when scrolled */}
      <button
        onClick={() => setMobileNavOpen(true)}
        className={cn(
          "fixed left-4 z-[51] flex lg:hidden items-center justify-center",
          "w-12 h-12 rounded-full bg-primary text-primary-foreground",
          "shadow-google-lg hover:shadow-google-lg hover:scale-105",
          "transition-all duration-500 ease-out",
          isScrolled
            ? "top-4 opacity-100 translate-y-0"
            : "top-4 opacity-0 -translate-y-4 pointer-events-none"
        )}
        aria-label="Menu"
      >
        <Menu className="size-5" />
      </button>

      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500 ease-out"
        )}
      >
        {/* Outer wrapper for positioning */}
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            isScrolled ? "py-3 px-4" : "py-0 px-0"
          )}
        >
          {/* The actual header bar that transforms to pill */}
          <div
            ref={megaMenuRef}
            className={cn(
              "transition-all duration-500 ease-out mx-auto",
              isScrolled
                ? "max-w-6xl bg-background/95 backdrop-blur-xl rounded-full shadow-google-md border border-border/40"
                : "max-w-none bg-background border-b border-border/30"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-2 transition-all duration-500 ease-out",
                isScrolled
                  ? "h-14 px-2 lg:px-4"
                  : "h-16 md:h-18 container-google"
              )}
            >
              {/* Left section: Menu (mobile) + Logo */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Mobile Menu Button - visible only on mobile when not scrolled */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(true)}
                  className={cn(
                    "lg:hidden rounded-full transition-all duration-300",
                    isScrolled ? "opacity-0 w-0 p-0 overflow-hidden" : "opacity-100"
                  )}
                >
                  <Menu className="size-5" />
                </Button>

                {/* Logo */}
                <Link
                  href="/"
                  className="relative flex items-center shrink-0"
                >
                  <Logo variant="default" className={cn(
                    "transition-all duration-300",
                    isScrolled ? "h-6 w-auto" : "h-7 w-auto"
                  )} />
                </Link>
              </div>

              {/* Center: Desktop Navigation - Always visible on desktop */}
              <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
                {categories.map((category) => {
                  const isActive = pathname?.startsWith(category.href) || activeCategory === category.name

                  return (
                    <div
                      key={category.name}
                      className="relative"
                      onMouseEnter={() => setActiveCategory(category.name)}
                    >
                      <Link
                        href={category.href}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-google whitespace-nowrap",
                          isScrolled ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-[14px]",
                          isActive
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <span>{category.name}</span>
                        <ChevronDown
                          className={cn(
                            "size-3 transition-transform duration-300",
                            activeCategory === category.name && "rotate-180"
                          )}
                        />
                      </Link>
                    </div>
                  )
                })}
              </nav>

              {/* Right section: Actions */}
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                {/* Search */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className={cn(
                    "rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5",
                    isScrolled ? "h-9 w-9" : "h-10 w-10"
                  )}
                >
                  <Search className={cn(isScrolled ? "size-4" : "size-5")} />
                  <span className="sr-only">Rechercher</span>
                </Button>

                {/* Theme Toggle - hidden on smaller screens when scrolled */}
                <div className={cn(
                  "transition-all duration-300",
                  isScrolled ? "hidden lg:block" : ""
                )}>
                  <ThemeToggle />
                </div>

                {/* Cart */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openCart}
                  className={cn(
                    "relative rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5",
                    isScrolled ? "h-9 w-9" : "h-10 w-10"
                  )}
                >
                  <ShoppingCart className={cn(isScrolled ? "size-4" : "size-5")} />
                  {isHydrated && totalItems > 0 && (
                    <span className={cn(
                      "absolute flex items-center justify-center rounded-full bg-primary text-white font-bold",
                      isScrolled 
                        ? "top-0.5 right-0.5 h-4 w-4 text-[9px]" 
                        : "top-1 right-1 h-4 w-4 text-[10px]"
                    )}>
                      {totalItems > 99 ? "99+" : totalItems}
                    </span>
                  )}
                </Button>

                {/* User Menu */}
                {!mounted || isLoading ? (
                  <div className={cn(
                    "rounded-full bg-muted animate-pulse",
                    isScrolled ? "h-8 w-8" : "h-9 w-9"
                  )} />
                ) : authUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative rounded-full p-0 hover:bg-muted",
                          isScrolled ? "h-8 w-8" : "h-9 w-9"
                        )}
                      >
                        <Avatar className={cn(isScrolled ? "h-7 w-7" : "h-8 w-8")}>
                          <AvatarImage src={user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 p-2 rounded-xl shadow-google-lg animate-slide-up"
                      align="end"
                    >
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href="/account" className="flex items-center gap-2 p-2">
                          <User className="size-4" />
                          <span>Mon compte</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href="/orders" className="flex items-center gap-2 p-2">
                          <Package className="size-4" />
                          <span>Mes commandes</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href="/wishlist" className="flex items-center gap-2 p-2 text-rose-500">
                          <Heart className="size-4" />
                          <span>Favoris</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={signOut}
                        className="rounded-lg cursor-pointer text-destructive p-2"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="size-4" />
                          <span>Déconnexion</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={openLogin}
                    className={cn(
                      "rounded-full bg-primary hover:bg-primary-hover text-white font-medium transition-google shadow-google-sm hover:shadow-google-md",
                      isScrolled ? "px-4 py-1.5 text-sm h-8" : "px-5 py-2 h-10"
                    )}
                  >
                    Connexion
                  </Button>
                )}
              </div>
            </div>

            {/* Mega Menu Dropdown - Desktop only */}
            {activeCategory && activeCategoryData && (
              <div
                className={cn(
                  "hidden lg:block absolute left-0 right-0 z-50",
                  isScrolled ? "top-[calc(100%+0.75rem)]" : "top-full",
                  "bg-background border border-border/50 shadow-google-lg animate-slide-up",
                  isScrolled ? "mx-4 rounded-2xl" : "border-t-0"
                )}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <div className={cn(
                  isScrolled ? "p-6" : "container-google py-10"
                )}>
                  <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-4">
                        Explorer
                      </h3>
                      <ul className="space-y-3">
                        {activeCategoryData.brands.map((brand) => (
                          <li key={brand}>
                            <Link
                              href={`${activeCategoryData.href}?brand=${brand.toLowerCase()}`}
                              className="text-base font-medium text-foreground hover:text-primary transition-google"
                              onClick={() => setActiveCategory(null)}
                            >
                              {brand}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="col-span-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-4">
                        En vedette
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {activeCategoryData.featured.map((product) => (
                          <Link
                            key={product.href}
                            href={product.href}
                            className="group flex flex-col gap-3 p-3 rounded-xl hover:bg-muted/50 transition-google"
                            onClick={() => setActiveCategory(null)}
                          >
                            <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 group-hover:text-primary">
                                En savoir plus <ArrowRight className="size-3" />
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
