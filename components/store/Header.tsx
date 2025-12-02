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
import { useUser } from "@/hooks/use-user"
import { useCart } from "@/hooks/use-cart"
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Package,
  Heart,
  Smartphone,
  Watch,
  Tablet,
  Laptop,
  Headphones,
  Menu,
  Percent,
} from "lucide-react"

type NavigationItem = {
  name: string
  href?: string
  submenu?: boolean
  items?: { name: string; href: string; description?: string }[]
}

const navigation: NavigationItem[] = [
  { name: "Offre", href: "/promotions" },
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
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

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

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow",
          isScrolled && "shadow-sm"
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-4 ml-2">
            <Logo variant="default" />
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex" viewport={false}>
            <NavigationMenuList className="gap-1">
              {navigation.map((item) => (
                <NavigationMenuItem key={item.name}>
                  {item.submenu ? (
                    <>
                      <NavigationMenuTrigger
                        className={cn(
                          "relative !bg-transparent text-base font-semibold transition-colors px-3 py-2",
                          "hover:!bg-primary/10 hover:!text-primary focus:!bg-primary/10 focus:!text-primary",
                          "data-[state=open]:!bg-primary/10 data-[state=open]:!text-primary data-[state=open]:hover:!bg-primary/15 data-[state=open]:focus:!bg-primary/15",
                          "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
                          pathname?.startsWith("/categories/" + item.name.toLowerCase().replace(/ /g, "-"))
                            ? "!text-primary after:w-full"
                            : "text-foreground/80"
                        )}
                      >
                        {item.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="p-2">
                        <ul className="grid w-[280px] gap-0.5">
                          {item.items?.map((subItem) => (
                            <li key={subItem.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "block select-none rounded-md px-3 py-2 no-underline outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary",
                                    pathname === subItem.href && "bg-primary/10 text-primary"
                                  )}
                                >
                                  <div className="text-sm font-semibold">
                                    {subItem.name}
                                  </div>
                                  {subItem.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {subItem.description}
                                    </p>
                                  )}
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
                        "relative text-base font-semibold transition-colors hover:text-primary hover:bg-primary/10 rounded-md px-3 py-2 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
                        pathname === item.href
                          ? "text-primary after:w-full"
                          : "text-foreground/80 hover:text-foreground"
                      )}
                    >
                      {item.name}
                    </Link>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
            >
              <Search className="size-5" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
              aria-label="Panier"
            >
              <ShoppingCart className="size-5" />
              {isHydrated && totalItems > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
            </Button>

            {/* User Menu / Login */}
            {isLoading ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="size-5" />
              </Button>
            ) : authUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.avatar_url || undefined}
                        alt={user?.full_name || "Avatar"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.phone}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <User className="mr-2 size-4" />
                      Mon compte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <Package className="mr-2 size-4" />
                      Mes commandes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">
                      <Heart className="mr-2 size-4" />
                      Liste de souhaits
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm" className="hidden sm:flex">
                <Link href="/login">Connexion</Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
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
      />
    </>
  )
}
