"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CountdownTimer, AnimateOnScroll } from "@/components/animations"
import { ArrowRight, Flame, Percent } from "lucide-react"

interface PromoProduct {
  id: string
  name: string
  slug: string
  image: string
  originalPrice: number
  salePrice: number
  discountPercent: number
}

interface PromotionsSectionProps {
  products: PromoProduct[]
  promoEndDate?: Date
}

export function PromotionsSection({ 
  products, 
  promoEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
}: PromotionsSectionProps) {
  if (products.length === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
  }


  return (
    <section className="py-24 md:py-32 bg-[#f8f9fa] dark:bg-muted/10 relative overflow-hidden">
      <div className="container-google relative">
        <AnimateOnScroll animation="fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 mb-16 px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-primary text-white shadow-google-sm">
                  <Flame className="size-5" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-primary">
                  Offres à durée limitée
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                Économisez sur la technologie que vous aimez.
              </h2>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">
                Des réductions exceptionnelles sur une sélection de nos produits les plus populaires.
              </p>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-4 p-8 rounded-[32px] bg-white dark:bg-card border border-border/40 shadow-google-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">L'offre se termine dans :</span>
              <CountdownTimer targetDate={promoEndDate} />
            </div>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {products.slice(0, 4).map((product, index) => (
            <AnimateOnScroll key={product.id} animation="fade-up" delay={index * 100}>
              <Link
                href={`/products/${product.slug}`}
                className="group relative flex flex-col rounded-[32px] bg-white dark:bg-card overflow-hidden transition-google hover-google-rise shadow-google-sm"
              >
                {/* Discount badge */}
                <div className="absolute top-5 left-5 z-10">
                  <div className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-google-sm">
                    -{product.discountPercent}%
                  </div>
                </div>

                {/* Image container */}
                <div className="relative aspect-square bg-[#f8f9fa] dark:bg-muted/10 m-4 rounded-[24px] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                {/* Content */}
                <div className="p-6 pt-2 flex flex-col gap-3">
                  <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-google">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-primary">
                      {formatPrice(product.salePrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/40 font-medium">
                      {formatPrice(product.originalPrice)}
                    </span>
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={400}>
          <div className="flex justify-center mt-20">
            <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full border-border hover:bg-white dark:hover:bg-muted text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md">
              <Link href="/products?promo=true" className="flex items-center gap-3">
                Voir toutes les promotions
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
