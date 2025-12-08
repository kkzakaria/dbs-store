"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimateOnScroll } from "@/components/animations"
import { ArrowRight, Sparkles, Star } from "lucide-react"

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
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-accent/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="container relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-primary to-primary-light">
                <Sparkles className="size-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-sm font-semibold bg-primary/10 text-primary border-primary/20">
                Nouveautés
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Derniers arrivages
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              Découvrez les derniers produits ajoutés à notre catalogue
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {products.slice(0, 5).map((product, index) => (
            <AnimateOnScroll 
              key={product.id} 
              animation="fade-up" 
              delay={index * 80}
            >
              <Link
                href={`/products/${product.slug}`}
                className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* New badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-primary-light text-white border-0 shadow-lg">
                    <Sparkles className="size-3 mr-1" />
                    Nouveau
                  </Badge>
                </div>

                {/* Image container */}
                <div className="relative aspect-square bg-muted/30 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  
                  {/* Hover overlay with quick view */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                      Voir le produit
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 md:p-4 flex flex-col gap-2">
                  {product.category && (
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {product.category}
                    </span>
                  )}
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="size-3.5 fill-accent text-accent" />
                        <span className="text-xs text-muted-foreground">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={500}>
          <div className="flex justify-center mt-10">
            <Button asChild size="lg" variant="outline" className="rounded-full group">
              <Link href="/products?sort=newest">
                Découvrir toutes les nouveautés
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
