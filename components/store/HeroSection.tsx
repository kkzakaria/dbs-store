"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  image: string
}

interface HeroSectionProps {
  featuredProducts?: FeaturedProduct[]
  headline?: string
  backgroundWord?: string
}

export function HeroSection({
  featuredProducts = [],
  headline = "DÉCOUVREZ NOS",
  backgroundWord = "TECH",
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeProduct, setActiveProduct] = useState(0)

  // Products to show in carousel (max 3 visible at a time)
  const visibleProducts = featuredProducts.slice(0, 6)
  const carouselProducts = visibleProducts.slice(0, 3)

  // Main featured product
  const mainProduct = featuredProducts[activeProduct] || featuredProducts[0]

  const nextSlide = useCallback(() => {
    if (visibleProducts.length > 3) {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(visibleProducts.length / 3))
    }
  }, [visibleProducts.length])

  const prevSlide = useCallback(() => {
    if (visibleProducts.length > 3) {
      setCurrentSlide((prev) =>
        prev === 0 ? Math.ceil(visibleProducts.length / 3) - 1 : prev - 1
      )
    }
  }, [visibleProducts.length])

  // Auto-rotate main product
  useEffect(() => {
    if (featuredProducts.length <= 1) return

    const interval = setInterval(() => {
      setActiveProduct((prev) => (prev + 1) % featuredProducts.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [featuredProducts.length])

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Word */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span className="text-[20vw] md:text-[18vw] font-black text-white/[0.03] tracking-tighter whitespace-nowrap">
          {backgroundWord}
        </span>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-transparent to-slate-900/50" />

      {/* Content Container */}
      <div className="container relative z-10 h-full py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            {/* Headline */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {headline}
              </h1>
              <p className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mt-2">
                APPAREILS
              </p>
            </div>

            {/* Description */}
            <p className="text-lg text-slate-300 max-w-md mb-8">
              Découvrez notre collection premium de produits électroniques.
              Qualité garantie, livraison rapide partout en Côte d&apos;Ivoire.
            </p>

            {/* Product Carousel */}
            {carouselProducts.length > 0 && (
              <div className="relative">
                {/* Navigation Arrows */}
                {visibleProducts.length > 3 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                      onClick={prevSlide}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                      onClick={nextSlide}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Product Cards */}
                <div className="flex gap-4 overflow-hidden">
                  {carouselProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group relative flex-1 min-w-0"
                      onMouseEnter={() => setActiveProduct(index)}
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:border-primary/50 group-hover:scale-[1.02]">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 33vw, 200px"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        {/* Product Name */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-xs text-white/70 line-clamp-1 mb-1">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-1 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Explorer</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Content - Main Product Image */}
          <div className="relative flex items-center justify-center">
            {mainProduct ? (
              <div className="relative w-full max-w-md lg:max-w-lg">
                {/* Glow Effect */}
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 to-accent/30 rounded-full scale-75" />

                {/* Product Image */}
                <div className="relative aspect-square">
                  <Image
                    src={mainProduct.image}
                    alt={mainProduct.name}
                    fill
                    className="object-contain drop-shadow-2xl transition-all duration-700 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>

                {/* Product Name Badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-white text-sm font-medium text-center line-clamp-1">
                      {mainProduct.name}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder when no products */
              <div className="relative w-full max-w-md lg:max-w-lg">
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 to-accent/30 rounded-full scale-75" />
                <div className="relative aspect-square flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-6xl">📱</span>
                    </div>
                    <p className="text-white/60">Bientôt disponible</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div className="absolute bottom-8 right-8">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 px-6"
          >
            <Link href="/products">
              Explorer tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Slide Indicators */}
        {featuredProducts.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {featuredProducts.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveProduct(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  activeProduct === index
                    ? "w-8 bg-primary"
                    : "bg-white/30 hover:bg-white/50"
                )}
                aria-label={`Voir produit ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
