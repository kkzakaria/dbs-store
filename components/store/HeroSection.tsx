"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  image: string
}

interface HeroSectionProps {
  backgroundImage: string
  featuredProducts?: FeaturedProduct[]
}

export function HeroSection({
  backgroundImage,
  featuredProducts = [],
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Products for carousel (3 per slide)
  const productsPerSlide = 3
  const totalSlides = Math.ceil(featuredProducts.length / productsPerSlide)

  // Get current slide products
  const getCurrentProducts = () => {
    const start = currentSlide * productsPerSlide
    return featuredProducts.slice(start, start + productsPerSlide)
  }

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))
  }, [totalSlides])

  // Auto-scroll carousel
  useEffect(() => {
    if (totalSlides <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(interval)
  }, [totalSlides, nextSlide])

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden">
      {/* Background Image */}
      <Image
        src={backgroundImage}
        alt="Hero"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Gradient overlay for better readability at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content Container */}
      <div className="container relative z-10 h-full flex flex-col justify-end min-h-[500px] md:min-h-[600px] lg:min-h-[700px] pb-8 md:pb-12">
        {/* Bottom Content */}
        <div className="flex items-end justify-between gap-4 md:gap-8">
          {/* Product Carousel - Bottom Left */}
          {featuredProducts.length > 0 && (
            <div className="flex items-center gap-2 md:gap-3">
              {/* Left Arrow */}
              {totalSlides > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm shrink-0"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              )}

              {/* Product Cards */}
              <div className="flex gap-3 md:gap-4">
                {getCurrentProducts().map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group relative w-[130px] md:w-[170px] lg:w-[190px] shrink-0"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:border-primary/50">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="190px"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Product Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                        <p className="text-[10px] md:text-xs text-white/70 line-clamp-1 mb-1.5 md:mb-2">
                          {product.name}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-white text-xs md:text-sm font-medium bg-white/10 backdrop-blur-sm rounded-full py-1.5 md:py-2 px-3 md:px-4 border border-white/10">
                          <span>Explorer</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right Arrow */}
              {totalSlides > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm shrink-0"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              )}
            </div>
          )}

          {/* CTA Button - Bottom Right */}
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 px-4 md:px-6 shrink-0"
          >
            <Link href="/products">
              <span className="hidden md:inline">Explorer tout</span>
              <span className="md:hidden">Explorer</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
