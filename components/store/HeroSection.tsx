"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  backgroundImage?: string
  featuredProducts?: FeaturedProduct[]
  action?: HeroAction
  headline?: string
  subheadline?: string
}

// Format price in FCFA
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

// Feature badges for hero
const features = [
  { icon: Zap, label: "Livraison Express" },
  { icon: Shield, label: "Garantie Premium" },
  { icon: Truck, label: "Retour Gratuit" },
]

export function HeroSection({
  backgroundImage,
  featuredProducts = [],
  action,
  headline = "La Technologie Premium",
  subheadline = "Découvrez notre collection exclusive d'appareils électroniques haut de gamme",
}: HeroSectionProps) {
  const [currentProduct, setCurrentProduct] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  // Handle mouse move for parallax effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height
    setMousePosition({ x: x * 20, y: y * 20 })
  }, [])

  // Navigate products
  const nextProduct = useCallback(() => {
    setCurrentProduct((prev) => (prev + 1) % Math.max(featuredProducts.length, 1))
  }, [featuredProducts.length])

  const prevProduct = useCallback(() => {
    setCurrentProduct((prev) =>
      prev === 0 ? Math.max(featuredProducts.length - 1, 0) : prev - 1
    )
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
      className="relative h-[420px] flex items-start overflow-hidden bg-secondary/30"
    >
      <div className="container-google relative z-10 w-full pt-2 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
          
          {/* Text Content */}
          <div className="flex flex-col text-center lg:text-left">
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold font-display leading-[1.05] tracking-tight mb-4",
                "transition-all duration-1000",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
            >
              {activeProduct ? (
                <>
                  <span className="block text-foreground">{activeProduct.name}</span>
                  <span className="block text-primary mt-2">La puissance réinventée.</span>
                </>
              ) : (
                <>
                  <span className="block text-foreground">La technologie</span>
                  <span className="block text-primary mt-2">au service de l'élégance.</span>
                </>
              )}
            </h1>

            <p
              className={cn(
                "text-base md:text-lg text-muted-foreground max-w-lg mb-6 mx-auto lg:mx-0",
                "transition-all duration-1000 delay-200",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
            >
              {subheadline}
            </p>

            <div
              className={cn(
                "flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start",
                "transition-all duration-1000 delay-300",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
            >
              <Button
                asChild
                size="lg"
                className="h-14 px-10 rounded-full bg-primary hover:bg-primary-hover text-white text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md"
              >
                <Link href={activeProduct ? `/products/${activeProduct.slug}` : (action?.href || "/products")}>
                  {activeProduct ? "Acheter maintenant" : (action?.label || "Explorer la boutique")}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-10 rounded-full border-border hover:bg-muted text-base font-semibold transition-google"
              >
                <Link href="/products">
                  En savoir plus
                </Link>
              </Button>
            </div>

            {/* Pagination Dots */}
            {featuredProducts.length > 1 && (
              <div
                className={cn(
                  "flex items-center gap-2 mt-6 justify-center lg:justify-start",
                  "transition-all duration-1000 delay-500",
                  isLoaded ? "opacity-100" : "opacity-0"
                )}
              >
                {featuredProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentProduct(idx)}
                    className={cn(
                      "size-2.5 rounded-full transition-all duration-300",
                      currentProduct === idx
                        ? "w-8 bg-primary"
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
              "relative aspect-square lg:aspect-auto lg:h-[350px] w-full max-w-xl mx-auto lg:max-w-none transition-all duration-1000 delay-400",
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
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
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
