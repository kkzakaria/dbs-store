"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  image: string
}

interface HeroSectionProps {
  featuredProducts?: FeaturedProduct[]
  mainProduct?: FeaturedProduct
  headline?: string
  backgroundWord?: string
}

export function HeroSection({
  featuredProducts = [],
  mainProduct,
  headline = "DÉCOUVREZ NOS",
  backgroundWord = "TECH",
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1))
  }

  // Main featured product (first one or provided)
  const heroProduct = mainProduct || featuredProducts[0]

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

      {/* Main Product - Center/Right (positioned behind carousel) */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end md:pr-[10%] pointer-events-none">
        {heroProduct ? (
          <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]">
            {/* Glow Effect */}
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/20 to-accent/20 rounded-full scale-90" />

            <Image
              src={heroProduct.image}
              alt={heroProduct.name}
              fill
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 768px) 300px, 500px"
              priority
            />
          </div>
        ) : (
          <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-6xl">📱</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="container relative z-10 h-full py-12 md:py-16 flex flex-col justify-between min-h-[600px] md:min-h-[700px]">
        {/* Top Content - Headline */}
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {headline}
          </h1>
          <p className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mt-2">
            APPAREILS
          </p>
        </div>

        {/* Bottom Content */}
        <div className="flex items-end justify-between gap-8">
          {/* Product Carousel - Bottom Left */}
          {featuredProducts.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Left Arrow */}
              {totalSlides > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm shrink-0"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              {/* Product Cards */}
              <div className="flex gap-3">
                {getCurrentProducts().map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group relative w-[140px] md:w-[160px] shrink-0"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:border-primary/50">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="160px"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Product Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-[10px] text-white/60 line-clamp-1 mb-2">
                          {product.name}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-white text-xs font-medium bg-white/10 backdrop-blur-sm rounded-full py-1.5 px-3 border border-white/10">
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
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm shrink-0"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {/* CTA Button - Bottom Right */}
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 px-6 shrink-0"
          >
            <Link href="/products">
              Explorer tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
