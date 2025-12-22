"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
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
  backgroundVideo?: string
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
  backgroundVideo,
  featuredProducts = [],
  action,
  headline = "La Technologie Premium",
  subheadline = "Découvrez notre collection exclusive d'appareils électroniques haut de gamme",
}: HeroSectionProps) {
  const [currentProduct, setCurrentProduct] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
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
      onMouseMove={handleMouseMove}
      className="relative min-h-[100svh] lg:min-h-[90vh] overflow-hidden"
    >
      {/* === Background Layer === */}
      <div className="absolute inset-0">
        {backgroundVideo ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#023e8a] via-[#0077b6] to-[#4dc4e8]">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className={cn(
                "w-full h-full object-cover transition-opacity duration-1000",
                isLoaded ? "opacity-60" : "opacity-0"
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
                "absolute top-6 right-6 z-30",
                "h-12 w-12 rounded-full",
                "bg-white/10 hover:bg-white/20 text-white",
                "backdrop-blur-xl border border-white/20",
                "transition-all duration-300 hover:scale-110"
              )}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
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
              isLoaded ? "opacity-40 scale-100" : "opacity-0 scale-110"
            )}
            priority
            sizes="100vw"
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#f0f7ff] to-[#e0f2fe] dark:from-[#06090f] dark:via-[#0f1629] dark:to-[#0c2447]" />
        )}

        {/* Animated Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Primary blob - top right */}
          <div
            className={cn(
              "absolute -top-1/4 -right-1/4 w-[800px] h-[800px]",
              "bg-gradient-to-br from-[#4dc4e8]/40 to-[#0077b6]/30",
              "blob blur-3xl",
              "transition-transform duration-1000"
            )}
            style={{
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            }}
          />
          {/* Secondary blob - bottom left */}
          <div
            className={cn(
              "absolute -bottom-1/3 -left-1/4 w-[600px] h-[600px]",
              "bg-gradient-to-tr from-[#0077b6]/30 to-[#023e8a]/20",
              "blob-slow blur-3xl",
              "transition-transform duration-1000"
            )}
            style={{
              transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`,
            }}
          />
          {/* Accent blob - center */}
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[500px] h-[500px]",
              "bg-gradient-radial from-[#7dd3fc]/20 to-transparent",
              "blob-glow"
            )}
          />
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,119,182,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,119,182,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                "bg-gradient-to-r from-[#4dc4e8] to-[#0077b6]",
                "opacity-40 float-gentle"
              )}
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* === Main Content === */}
      <div className="container relative z-10 h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 min-h-[100svh] lg:min-h-[90vh] py-24 lg:py-16">

          {/* Left Side - Text Content */}
          <div className="flex-1 flex flex-col justify-center text-center lg:text-left max-w-2xl lg:max-w-xl">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 mb-6 mx-auto lg:mx-0",
                "transition-all duration-700 delay-100",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              <Badge
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  "bg-gradient-to-r from-[#4dc4e8]/10 to-[#0077b6]/10",
                  "border border-[#4dc4e8]/30",
                  "text-[#0077b6] dark:text-[#4dc4e8]",
                  "backdrop-blur-sm"
                )}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Collection 2025
              </Badge>
            </div>

            {/* Main Headline */}
            <h1
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold",
                "font-display tracking-tight leading-[1.1]",
                "mb-6",
                "transition-all duration-700 delay-200",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              <span className="block text-foreground">
                {headline.split(" ")[0]}
              </span>
              <span className="block gradient-text-animated">
                {headline.split(" ").slice(1).join(" ")}
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-lg md:text-xl text-muted-foreground",
                "max-w-lg mx-auto lg:mx-0 mb-8",
                "text-balance",
                "transition-all duration-700 delay-300",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              {subheadline}
            </p>

            {/* CTA Buttons */}
            <div
              className={cn(
                "flex flex-col sm:flex-row items-center gap-4 mb-10",
                "justify-center lg:justify-start",
                "transition-all duration-700 delay-400",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              <Button
                asChild
                size="lg"
                className={cn(
                  "h-14 px-8 text-base font-semibold rounded-full",
                  "bg-gradient-to-r from-[#0077b6] to-[#4dc4e8]",
                  "hover:from-[#005f92] hover:to-[#0077b6]",
                  "text-white shadow-lg shadow-[#0077b6]/25",
                  "transition-all duration-300",
                  "hover:scale-105 hover:shadow-xl hover:shadow-[#0077b6]/30",
                  "btn-shimmer group"
                )}
              >
                <Link href={action?.href || "/products"}>
                  {action?.label || "Explorer la boutique"}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className={cn(
                  "h-14 px-8 text-base font-semibold rounded-full",
                  "border-2 border-[#0077b6]/30 dark:border-[#4dc4e8]/30",
                  "text-[#0077b6] dark:text-[#4dc4e8]",
                  "hover:bg-[#0077b6]/5 hover:border-[#0077b6]",
                  "transition-all duration-300",
                  "group"
                )}
              >
                <Link href="/categories">
                  Nos catégories
                  <ChevronRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Feature Pills */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-3",
                "justify-center lg:justify-start",
                "transition-all duration-700 delay-500",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              {features.map((feature, idx) => (
                <div
                  key={feature.label}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2",
                    "bg-white/60 dark:bg-white/5",
                    "backdrop-blur-sm rounded-full",
                    "border border-[#0077b6]/10 dark:border-[#4dc4e8]/10",
                    "text-sm text-muted-foreground"
                  )}
                  style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                >
                  <feature.icon className="w-4 h-4 text-[#0077b6] dark:text-[#4dc4e8]" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - 3D Product Showcase */}
          {featuredProducts.length > 0 && (
            <div
              className={cn(
                "flex-1 relative perspective-1000",
                "w-full max-w-lg lg:max-w-xl",
                "transition-all duration-700 delay-300",
                isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
            >
              {/* Product Display Container */}
              <div
                className="relative preserve-3d"
                style={{
                  transform: `rotateY(${mousePosition.x * 0.3}deg) rotateX(${-mousePosition.y * 0.3}deg)`,
                  transition: 'transform 0.1s ease-out',
                }}
              >
                {/* Glow Ring Behind Product */}
                <div
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "w-[90%] aspect-square rounded-full",
                    "bg-gradient-to-r from-[#4dc4e8]/30 to-[#0077b6]/30",
                    "blur-3xl opacity-60"
                  )}
                />

                {/* Main Product Card */}
                <div
                  className={cn(
                    "relative mx-auto",
                    "w-full aspect-square max-w-[400px] lg:max-w-[450px]",
                    "rounded-3xl overflow-hidden",
                    "glass-card",
                    "float-card",
                    "group"
                  )}
                >
                  {activeProduct && (
                    <Link href={`/products/${activeProduct.slug}`} className="block h-full">
                      {/* Product Image */}
                      <div className="relative h-full p-6 lg:p-8">
                        <Image
                          src={activeProduct.image}
                          alt={activeProduct.name}
                          fill
                          className={cn(
                            "object-contain p-8 lg:p-12",
                            "transition-transform duration-700",
                            "group-hover:scale-110"
                          )}
                          sizes="(max-width: 768px) 100vw, 450px"
                          priority
                        />

                        {/* Shine Effect */}
                        <div
                          className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-100",
                            "bg-gradient-to-tr from-transparent via-white/20 to-transparent",
                            "transition-opacity duration-500"
                          )}
                        />
                      </div>

                      {/* Product Info Overlay */}
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0",
                          "p-6 lg:p-8",
                          "bg-gradient-to-t from-white/90 via-white/70 to-transparent",
                          "dark:from-[#0f1629]/90 dark:via-[#0f1629]/70",
                          "backdrop-blur-sm"
                        )}
                      >
                        {activeProduct.category && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#0077b6] dark:text-[#4dc4e8] mb-1 block">
                            {activeProduct.category}
                          </span>
                        )}
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2 line-clamp-1">
                          {activeProduct.name}
                        </h3>
                        {activeProduct.price && (
                          <p className="text-lg font-bold text-[#0077b6] dark:text-[#4dc4e8]">
                            {formatPrice(activeProduct.price)}
                          </p>
                        )}
                      </div>

                      {/* View Button */}
                      <div
                        className={cn(
                          "absolute top-6 right-6",
                          "opacity-0 group-hover:opacity-100",
                          "transition-all duration-300",
                          "translate-y-2 group-hover:translate-y-0"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-4 py-2",
                            "bg-[#0077b6] text-white",
                            "rounded-full text-sm font-semibold",
                            "shadow-lg shadow-[#0077b6]/30"
                          )}
                        >
                          <span>Voir</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Floating Product Thumbnails */}
                {featuredProducts.length > 1 && (
                  <div
                    className={cn(
                      "absolute -bottom-4 left-1/2 -translate-x-1/2",
                      "flex items-center gap-3",
                      "p-2 rounded-2xl",
                      "glass-card",
                      "z-20"
                    )}
                  >
                    {/* Previous Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevProduct}
                      className={cn(
                        "h-10 w-10 rounded-xl",
                        "bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20",
                        "text-[#0077b6] dark:text-[#4dc4e8]",
                        "transition-all duration-300"
                      )}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    {/* Product Thumbnails */}
                    <div className="flex items-center gap-2">
                      {featuredProducts.slice(0, 5).map((product, idx) => (
                        <button
                          key={product.id}
                          onClick={() => setCurrentProduct(idx)}
                          className={cn(
                            "relative w-12 h-12 rounded-xl overflow-hidden",
                            "transition-all duration-300",
                            "border-2",
                            currentProduct === idx
                              ? "border-[#0077b6] dark:border-[#4dc4e8] scale-110 shadow-lg"
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextProduct}
                      className={cn(
                        "h-10 w-10 rounded-xl",
                        "bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20",
                        "text-[#0077b6] dark:text-[#4dc4e8]",
                        "transition-all duration-300"
                      )}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Decorative Elements Around Product */}
                <div
                  className={cn(
                    "absolute -top-6 -left-6 w-24 h-24",
                    "border-2 border-dashed border-[#4dc4e8]/30 rounded-3xl",
                    "float-gentle",
                    "pointer-events-none"
                  )}
                  style={{ animationDelay: '0.5s' }}
                />
                <div
                  className={cn(
                    "absolute -bottom-8 -right-8 w-32 h-32",
                    "border-2 border-dashed border-[#0077b6]/20 rounded-full",
                    "float-gentle",
                    "pointer-events-none"
                  )}
                  style={{ animationDelay: '1s' }}
                />
              </div>

              {/* Product Counter */}
              {featuredProducts.length > 1 && (
                <div
                  className={cn(
                    "absolute -bottom-16 left-1/2 -translate-x-1/2",
                    "flex items-center gap-2",
                    "text-sm text-muted-foreground"
                  )}
                >
                  <span className="font-bold text-[#0077b6] dark:text-[#4dc4e8]">
                    {String(currentProduct + 1).padStart(2, '0')}
                  </span>
                  <span>/</span>
                  <span>{String(featuredProducts.length).padStart(2, '0')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === Bottom Gradient Fade === */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
