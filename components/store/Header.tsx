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
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-google-sm"
            : "bg-background/50 backdrop-blur-sm border-transparent"
        )}
      >
        <div className="container-google">
          <div className="flex h-16 md:h-18 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="relative flex items-center gap-3 shrink-0"
            >
              <Logo variant="default" className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav
              ref={megaMenuRef}
              className="hidden lg:flex items-center gap-1"
            >
              {/* Category Links */}
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
                        "flex items-center gap-1.5 px-4 py-2 rounded-full text-[15px] font-medium transition-google",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{category.name}</span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform duration-300",
                          activeCategory === category.name && "rotate-180"
                        )}
                      />
                    </Link>
                  </div>
                )
              })}

              {/* Mega Menu Dropdown */}
              {activeCategory && activeCategoryData && (
                <div
                  className={cn(
                    "absolute top-full left-0 right-0 mt-0",
                    "bg-background border-b border-border shadow-google-lg animate-slide-up"
                  )}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <div className="container-google py-10">
                    <div className="grid grid-cols-4 gap-12">
                      <div className="col-span-1">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-6">
                          Explorer
                        </h3>
                        <ul className="space-y-4">
                          {activeCategoryData.brands.map((brand) => (
                            <li key={brand}>
                              <Link
                                href={`${activeCategoryData.href}?brand=${brand.toLowerCase()}`}
                                className="text-[17px] font-medium text-foreground hover:text-primary transition-google"
                                onClick={() => setActiveCategory(null)}
                              >
                                {brand}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="col-span-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-6">
                          En vedette
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                          {activeCategoryData.featured.map((product) => (
                            <Link
                              key={product.href}
                              href={product.href}
                              className="group flex flex-col gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-google"
                              onClick={() => setActiveCategory(null)}
                            >
                              <div className="aspect-square relative rounded-xl overflow-hidden bg-muted">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-base">
                                  {product.name}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary">
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
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                <Search className="size-5" />
                <span className="sr-only">Rechercher</span>
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={openCart}
                className="relative rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                <ShoppingCart className="size-5" />
                {isHydrated && totalItems > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
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
                      className="relative h-10 w-10 rounded-full p-0 hover:bg-muted"
                    >
                      <Avatar className="h-8 w-8">
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
                  className="rounded-full px-6 bg-primary hover:bg-primary-hover text-white font-medium transition-google shadow-google-sm hover:shadow-google-md"
                >
                  Connexion
                </Button>
              )}

              {/* Mobile Menu */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden rounded-full"
              >
                <Menu className="size-5" />
              </Button>
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
