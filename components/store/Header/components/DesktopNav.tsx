"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { categories, type Category } from "../data/categories"

interface DesktopNavProps {
  pathname: string | null
  activeCategory: string | null
  isScrolled: boolean
  onCategoryHover: (name: string) => void
}

export function DesktopNav({
  pathname,
  activeCategory,
  isScrolled,
  onCategoryHover,
}: DesktopNavProps) {
  return (
    <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
      {categories.map((category) => {
        const isActive = pathname?.startsWith(category.href) || activeCategory === category.name

        return (
          <div
            key={category.name}
            className="relative"
            onMouseEnter={() => onCategoryHover(category.name)}
          >
            <Link
              href={category.href}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-google whitespace-nowrap",
                isScrolled ? "px-3 py-2 text-[13.5px]" : "px-3 py-2 text-[14px]",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-foreground hover:text-primary hover:bg-muted/50"
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
  )
}
