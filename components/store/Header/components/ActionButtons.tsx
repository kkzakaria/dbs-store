"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { ShoppingCart } from "lucide-react"

interface ActionButtonsProps {
  isScrolled: boolean
  totalItems: number
  isHydrated: boolean
  onCartOpen: () => void
}

export function ActionButtons({
  isScrolled,
  totalItems,
  isHydrated,
  onCartOpen,
}: ActionButtonsProps) {
  return (
    <>
      {/* Theme Toggle */}
      <div className="hidden md:block">
        <ThemeToggle isScrolled={isScrolled} />
      </div>

      {/* Cart */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onCartOpen}
        className={cn(
          "relative rounded-full text-foreground hover:text-primary hover:bg-primary/5",
          isScrolled ? "h-10 w-10" : "h-10 w-10"
        )}
      >
        <ShoppingCart className={cn(isScrolled ? "size-[18px]" : "size-5")} />
        {isHydrated && totalItems > 0 && (
          <span
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-primary text-white font-bold",
              isScrolled
                ? "top-1 right-1 h-4 w-4 text-[10px]"
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
