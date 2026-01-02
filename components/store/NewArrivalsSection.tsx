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
    <section className="py-32 md:py-48 bg-white dark:bg-background relative overflow-hidden">
      <div className="container-google relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-16 md:mb-24 px-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-secondary text-primary shadow-google-sm font-bold">
                <Sparkles className="size-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-primary">
                Derniers arrivages
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight max-w-3xl mx-auto">
              Le meilleur de l'innovation, disponible dès maintenant.
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Découvrez les produits les plus récents sélectionnés pour leur excellence et leur performance.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 px-4">
          {products.slice(0, 5).map((product, index) => (
            <AnimateOnScroll
              key={product.id}
              animation="fade-up"
              delay={index * 80}
            >
              <Link
                href={`/products/${product.slug}`}
                className="group relative flex flex-col rounded-[32px] bg-white dark:bg-card overflow-hidden transition-google hover-google-rise shadow-google-sm"
              >
                {/* New badge */}
                <div className="absolute top-5 left-5 z-10">
                  <div className="px-3 py-1 rounded-full bg-secondary text-primary text-[10px] font-bold uppercase tracking-widest shadow-google-sm">
                    Nouveau
                  </div>
                </div>

                {/* Image container */}
                <div className="relative aspect-square bg-[#f8f9fa] dark:bg-muted/10 m-4 rounded-[24px] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  />
                </div>

                {/* Content */}
                <div className="p-6 pt-2 flex flex-col gap-3">
                  {product.category && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {product.category}
                    </span>
                  )}
                  <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-google">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-foreground">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={500}>
          <div className="flex justify-center mt-28">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-10 rounded-full border-border hover:bg-muted dark:hover:bg-muted/50 text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md"
            >
              <Link href="/products?sort=newest" className="flex items-center gap-3">
                Découvrir toutes les nouveautés
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
