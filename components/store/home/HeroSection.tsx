"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  image: string
  price?: number
  category?: string
}

interface HeroAction {
  label: string
  href: string
}

interface HeroSectionProps {
  featuredProducts?: FeaturedProduct[]
  action?: HeroAction
  subheadline?: string
}

export function HeroSection({
  featuredProducts = [],
  action,
  subheadline = "Découvrez notre collection exclusive d'appareils électroniques haut de gamme",
}: HeroSectionProps) {
  const [currentProduct, setCurrentProduct] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)


  // Navigate products
  const nextProduct = useCallback(() => {
    setCurrentProduct((prev) => (prev + 1) % Math.max(featuredProducts.length, 1))
  }, [featuredProducts.length])


  // Auto-rotate products
  useEffect(() => {
    if (featuredProducts.length <= 1) return

    const interval = setInterval(() => {
      nextProduct()
    }, 4000)

    return () => clearInterval(interval)
  }, [featuredProducts.length, nextProduct])

  // Set loaded state after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const activeProduct = featuredProducts[currentProduct]

  return (
    <section
      ref={heroRef}
      className="relative h-auto lg:h-[420px] flex items-center lg:items-start overflow-hidden"
    >
      {/* Tech Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-900" />
        
        {/* Ambient Glows - Reduced on mobile to prevent "all blue" effect */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[500px] sm:h-[500px] bg-primary/5 sm:bg-primary/20 dark:bg-primary/10 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] sm:w-[500px] sm:h-[500px] bg-blue-400/5 sm:bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[80px] sm:blur-[120px] translate-y-1/2 -translate-x-1/3" />
        
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.4] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>
      <div className="container-google relative z-10 w-full px-3 py-4 sm:px-8 lg:pt-2 lg:pb-6">
        <div className="grid grid-cols-2 items-stretch sm:items-center gap-2 sm:gap-4 lg:gap-12">
          
          {/* Text Content */}
          <div className="flex flex-col text-left justify-end sm:justify-center pb-1 sm:pb-0">
            <h1
              className={cn(
                "font-bold font-display leading-tight tracking-tight mb-2 sm:mb-4",
                "transition-all duration-1000",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
            >
              {activeProduct ? (
                <>
                  <span className="block text-foreground text-[10px] min-[375px]:text-xs sm:text-3xl md:text-4xl lg:text-5xl">{activeProduct.name}</span>
                  <span className="block text-primary mt-0.5 sm:mt-2 text-[8px] min-[375px]:text-[10px] sm:text-3xl md:text-4xl lg:text-5xl">La puissance réinventée.</span>
                </>
              ) : (
                <>
                  <span className="block text-foreground text-[10px] min-[375px]:text-xs sm:text-3xl md:text-4xl lg:text-5xl">La technologie</span>
                  <span className="block text-primary mt-0.5 sm:mt-2 text-[8px] min-[375px]:text-[10px] sm:text-3xl md:text-4xl lg:text-5xl">au service de l&apos;élégance.</span>
                </>
              )}
            </h1>

            <p
              className={cn(
                "hidden sm:block text-sm md:text-lg text-muted-foreground max-w-lg mb-4 sm:mb-6 leading-tight",
                "transition-all duration-1000 delay-200",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
            >
              {subheadline}
            </p>

            <div
              className={cn(
                "flex flex-col sm:flex-row items-start gap-2 sm:gap-4 justify-start w-full",
                "transition-all duration-1000 delay-300",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
            >
              <Button
                asChild
                size="sm"
                className="w-auto h-8 sm:h-12 px-4 sm:px-8 rounded-full bg-primary hover:bg-primary-hover text-white text-[11px] sm:text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md whitespace-nowrap"
              >
                <Link href={activeProduct ? `/products/${activeProduct.slug}` : (action?.href || "/products")}>
                  {activeProduct ? "Acheter" : (action?.label || "Explorer")}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex w-full sm:w-auto h-9 sm:h-12 px-3 sm:px-8 rounded-full border-border hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-xs sm:text-base font-semibold transition-google whitespace-nowrap"
              >
                <Link href="/products">
                  Plus d&apos;infos
                </Link>
              </Button>
            </div>

            {/* Pagination Dots */}
            {featuredProducts.length > 1 && (
              <div
                className={cn(
                  "flex items-center gap-2 mt-4 justify-start",
                  "transition-all duration-1000 delay-500",
                  isLoaded ? "opacity-100" : "opacity-0"
                )}
              >
                {featuredProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentProduct(idx)}
                    className={cn(
                      "size-1.5 sm:size-2.5 rounded-full transition-all duration-300",
                      currentProduct === idx
                        ? "w-4 sm:w-8 bg-primary"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Image */}
          <div
            className={cn(
              "relative h-[150px] min-[375px]:h-[180px] sm:h-[350px] lg:h-[350px] w-full max-w-none transition-all duration-1000 delay-400",
              isLoaded ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-10"
            )}
          >
            {activeProduct && (
              <div className="relative h-full w-full flex items-center justify-center">
                {/* Background Shadow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 rounded-full blur-[100px]" />
                
                <Image
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  width={800}
                  height={800}
                  className="relative z-10 w-full h-full object-cover lg:object-contain drop-shadow-2xl lg:animate-float"
                  priority
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
