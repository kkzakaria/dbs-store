"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "../../theme-toggle"
import { Search, ShoppingCart } from "lucide-react"

interface ActionButtonsProps {
  isScrolled: boolean
  totalItems: number
  isHydrated: boolean
  onSearchOpen: () => void
  onCartOpen: () => void
}

export function ActionButtons({
  isScrolled,
  totalItems,
  isHydrated,
  onSearchOpen,
  onCartOpen,
}: ActionButtonsProps) {
  return (
    <>
      {/* Search */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSearchOpen}
        className={cn(
          "rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5",
          isScrolled ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <Search className={cn(isScrolled ? "size-4" : "size-5")} />
        <span className="sr-only">Rechercher</span>
      </Button>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Cart */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onCartOpen}
        className={cn(
          "relative rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5",
          isScrolled ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <ShoppingCart className={cn(isScrolled ? "size-4" : "size-5")} />
        {isHydrated && totalItems > 0 && (
          <span
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-primary text-white font-bold",
              isScrolled
                ? "top-0.5 right-0.5 h-4 w-4 text-[9px]"
                : "top-1 right-1 h-4 w-4 text-[10px]"
            )}
          >
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Button>
    </>
  )
}
