"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { categories, type Category } from "../data/categories"

interface MegaMenuProps {
  activeCategory: string | null
  isScrolled: boolean
  onClose: () => void
}

export function MegaMenu({ activeCategory, isScrolled, onClose }: MegaMenuProps) {
  const activeCategoryData = categories.find((c) => c.name === activeCategory)

  if (!activeCategory || !activeCategoryData) {
    return null
  }

  return (
    <div
      className={cn(
        "hidden lg:block absolute left-0 right-0 z-50",
        isScrolled ? "top-[calc(100%+0.75rem)]" : "top-full",
        "bg-background border border-border/50 shadow-google-lg animate-slide-up",
        isScrolled ? "mx-4 rounded-2xl" : "border-t-0"
      )}
      onMouseLeave={onClose}
    >
      <div className={cn(isScrolled ? "p-6" : "container-google py-10")}>
        <div className="grid grid-cols-4 gap-8">
          {/* Brands column */}
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
                    onClick={onClose}
                  >
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured products column */}
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
                  onClick={onClose}
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
                    <p className="font-medium text-sm">{product.name}</p>
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
  )
}
