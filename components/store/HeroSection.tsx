"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  image: string
}

interface HeroAction {
  label: string
  href: string
}

interface HeroSectionProps {
  backgroundImage?: string
  backgroundVideo?: string
  featuredProducts?: FeaturedProduct[]
  action?: HeroAction
}

export function HeroSection({
  backgroundImage,
  backgroundVideo,
  featuredProducts = [],
  action,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Products for carousel
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

  // Toggle video playback
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Auto-scroll carousel
  useEffect(() => {
    if (totalSlides <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [totalSlides, nextSlide])

  // Set loaded state after mount for animations
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="pt-2 pb-4">
      <div className="container">
        <div className="relative min-h-[480px] sm:min-h-[520px] md:min-h-[600px] lg:min-h-[700px] overflow-hidden rounded-2xl md:rounded-3xl">
          {/* Background Video or Image */}
          {backgroundVideo ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0077b6] to-[#023e8a]">
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-1000",
                  isLoaded ? "opacity-100" : "opacity-0"
                )}
              >
                <source src={backgroundVideo} type="video/mp4" />
              </video>
              {/* Video Controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayback}
                className={cn(
                  "absolute top-4 right-4 z-20",
                  "h-10 w-10 rounded-full",
                  "bg-white/10 hover:bg-white/20 text-white",
                  "backdrop-blur-md border border-white/10",
                  "transition-all duration-300 hover:scale-105"
                )}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
            </div>
          ) : backgroundImage ? (
            <Image
              src={backgroundImage}
              alt="Hero"
              fill
              className={cn(
                "object-cover transition-all duration-1000",
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
              priority
              sizes="100vw"
              onLoad={() => setIsLoaded(true)}
            />
          ) : (
            // Default gradient background
            <div className="absolute inset-0 bg-gradient-hero animate-gradient" />
          )}

          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-right glow */}
            <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-radial opacity-30" />
            {/* Bottom-left glow */}
            <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-radial opacity-20" />
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
          </div>

          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

          {/* Content Container */}
          <div className="relative z-10 h-full flex flex-col justify-end min-h-[480px] sm:min-h-[520px] md:min-h-[600px] lg:min-h-[700px] p-4 sm:p-6 lg:p-8">
            {/* Main Content Area */}
            <div
              className={cn(
                "flex flex-col lg:flex-row items-end justify-between gap-6 lg:gap-8",
                "transition-all duration-700 delay-300",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              {/* Product Carousel */}
              {featuredProducts.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto overflow-x-auto hide-scrollbar pb-2">
                  {/* Left Arrow */}
                  {totalSlides > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0",
                        "bg-white/10 hover:bg-white/20 text-white",
                        "backdrop-blur-md border border-white/10",
                        "transition-all duration-300 hover:scale-105 active:scale-95"
                      )}
                      onClick={prevSlide}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  )}

                  {/* Product Cards */}
                  <div className="flex gap-3 sm:gap-4">
                    {getCurrentProducts().map((product, idx) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group relative w-[120px] sm:w-[150px] md:w-[170px] lg:w-[180px] shrink-0"
                        style={{
                          animationDelay: `${idx * 100}ms`,
                        }}
                      >
                        <div
                          className={cn(
                            "relative aspect-square rounded-2xl overflow-hidden",
                            "bg-white/5 backdrop-blur-md",
                            "border border-white/10",
                            "transition-all duration-500",
                            "group-hover:border-primary-light/50 group-hover:scale-[1.02]",
                            "group-hover:shadow-glow-sm"
                          )}
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 640px) 120px, (max-width: 768px) 150px, 180px"
                          />

                          {/* Shine effect on hover */}
                          <div
                            className={cn(
                              "absolute inset-0 opacity-0 group-hover:opacity-100",
                              "bg-gradient-to-tr from-transparent via-white/10 to-transparent",
                              "transition-opacity duration-500"
                            )}
                          />

                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                          {/* Product Info */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                            <p className="text-[10px] sm:text-xs text-white/80 line-clamp-1 mb-2 font-medium">
                              {product.name}
                            </p>
                            <div
                              className={cn(
                                "flex items-center justify-center gap-1.5",
                                "text-white text-xs sm:text-sm font-semibold",
                                "bg-white/10 backdrop-blur-md rounded-full",
                                "py-1.5 sm:py-2 px-3 sm:px-4",
                                "border border-white/20",
                                "transition-all duration-300",
                                "group-hover:bg-primary group-hover:border-primary"
                              )}
                            >
                              <span>Explorer</span>
                              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
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
                      className={cn(
                        "h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0",
                        "bg-white/10 hover:bg-white/20 text-white",
                        "backdrop-blur-md border border-white/10",
                        "transition-all duration-300 hover:scale-105 active:scale-95"
                      )}
                      onClick={nextSlide}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Right Side - CTA and Indicators */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Slide Indicators */}
                {totalSlides > 1 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    {Array.from({ length: totalSlides }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          currentSlide === idx
                            ? "w-6 bg-white"
                            : "w-1.5 bg-white/40 hover:bg-white/60"
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "rounded-full px-6 sm:px-8 h-11 sm:h-12",
                    "bg-white text-[#0077b6] font-semibold",
                    "hover:bg-white/90",
                    "shadow-elevated hover:shadow-glow",
                    "transition-all duration-300",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  <Link href={action?.href || "/products"}>
                    <span className="hidden sm:inline">{action?.label || "Explorer la boutique"}</span>
                    <span className="sm:hidden">{action?.label || "Explorer"}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Mobile Slide Indicators */}
            {totalSlides > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-1.5 mt-4">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentSlide === idx
                        ? "w-5 bg-white"
                        : "w-1.5 bg-white/40"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
