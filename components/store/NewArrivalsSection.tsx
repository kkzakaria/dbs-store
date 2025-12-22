"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimateOnScroll } from "@/components/animations"
import { cn } from "@/lib/utils"
import { ArrowRight, Sparkles, Star, Eye } from "lucide-react"

interface NewProduct {
  id: string
  name: string
  slug: string
  image: string
  price: number
  category?: string
  rating?: number
}

interface NewArrivalsSectionProps {
  products: NewProduct[]
}

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  if (products.length === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
  }

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial opacity-20 translate-x-1/3 translate-y-1/3" />

      <div className="container relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <div
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-gradient-primary",
                  "shadow-soft shadow-primary/30"
                )}
              >
                <Sparkles className="size-5 text-white" />
              </div>
              <Badge
                className={cn(
                  "text-sm font-semibold px-4 py-1.5",
                  "bg-primary/10 text-primary border-primary/20",
                  "hover:bg-primary/15"
                )}
              >
                Nouveautés
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-display">
              Derniers <span className="text-gradient-primary">arrivages</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
              Découvrez les derniers produits ajoutés à notre catalogue
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {products.slice(0, 5).map((product, index) => (
            <AnimateOnScroll
              key={product.id}
              animation="fade-up"
              delay={index * 80}
            >
              <Link
                href={`/products/${product.slug}`}
                className="group relative flex flex-col"
              >
                <div
                  className={cn(
                    "relative rounded-2xl overflow-hidden",
                    "bg-card border border-border/50",
                    "transition-all duration-500",
                    "hover:border-primary/30 hover:shadow-card-hover",
                    "hover:-translate-y-1"
                  )}
                >
                  {/* New badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge
                      className={cn(
                        "px-2.5 py-1",
                        "bg-gradient-primary text-white border-0",
                        "shadow-soft shadow-primary/30",
                        "flex items-center gap-1"
                      )}
                    >
                      <Sparkles className="size-3" />
                      <span className="text-xs font-semibold">Nouveau</span>
                    </Badge>
                  </div>

                  {/* Image container */}
                  <div className="relative aspect-square bg-muted/20 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />

                    {/* Hover overlay */}
                    <div
                      className={cn(
                        "absolute inset-0",
                        "bg-gradient-to-t from-black/60 via-black/20 to-transparent",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-300",
                        "flex items-center justify-center"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full",
                          "bg-white/90 backdrop-blur-sm text-foreground",
                          "font-medium text-sm",
                          "transform transition-all duration-300",
                          "translate-y-4 group-hover:translate-y-0"
                        )}
                      >
                        <Eye className="size-4" />
                        <span>Voir</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col gap-2">
                    {product.category && (
                      <span className="text-[10px] text-primary/80 uppercase tracking-wider font-semibold">
                        {product.category}
                      </span>
                    )}
                    <h3
                      className={cn(
                        "font-semibold text-sm leading-snug line-clamp-2",
                        "text-foreground/90 group-hover:text-foreground",
                        "transition-colors duration-300"
                      )}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-base font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.rating && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600">{product.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={500}>
          <div className="flex justify-center mt-12">
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                "rounded-full group px-8",
                "border-primary/30 hover:border-primary",
                "hover:bg-primary/5",
                "transition-all duration-300"
              )}
            >
              <Link href="/products?sort=newest">
                Découvrir toutes les nouveautés
                <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
