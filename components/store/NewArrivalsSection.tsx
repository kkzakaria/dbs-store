"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimateOnScroll } from "@/components/animations"
import { cn } from "@/lib/utils"
import { ArrowRight, Sparkles } from "lucide-react"
import { ProductCard } from "./products/ProductCard"
import type { Product, Category } from "@/types"

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

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 px-4">
          {products.slice(0, 5).map((product, index) => {
            // Adapt local product to ProductCard's expected type
            const adaptedProduct: any = {
              ...product,
              images: [{ url: product.image, is_primary: true }],
              category: product.category ? { name: product.category } : null
            };

            return (
              <AnimateOnScroll
                key={product.id}
                animation="fade-up"
                delay={index * 80}
              >
                <ProductCard product={adaptedProduct} />
              </AnimateOnScroll>
            );
          })}
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
