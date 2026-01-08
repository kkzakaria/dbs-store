"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CountdownTimer, AnimateOnScroll } from "@/components/animations"
import { ArrowRight, Flame } from "lucide-react"
import { ProductCard, type Product } from "../products/ProductCard"

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


  return (
    <section className="py-20 md:py-16 bg-[#f8f9fa] dark:bg-muted/10 relative overflow-hidden">
      <div className="container-google relative">
        <AnimateOnScroll animation="fade-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-12 mb-12 md:mb-16 px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-primary text-white shadow-google-sm">
                  <Flame className="size-5" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-primary">
                  Offres à durée limitée
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 leading-tight">
                Économisez sur la technologie que vous aimez.
              </h2>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">
                Des réductions exceptionnelles sur une sélection de nos produits les plus populaires.
              </p>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-4 p-8 rounded-[32px] bg-white dark:bg-card border border-border/40 shadow-google-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">L&apos;offre se termine dans :</span>
              <CountdownTimer targetDate={promoEndDate} />
            </div>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 px-4">
          {products.slice(0, 4).map((product, index) => {
            // Adapt local product to ProductCard's expected type
            const adaptedProduct = {
              ...product,
              price: product.salePrice,
              compare_price: product.originalPrice,
              images: [{ url: product.image, is_primary: true, id: "primary", alt: product.name, position: 0 }],
            } as unknown as Product;

            return (
              <AnimateOnScroll key={product.id} animation="fade-up" delay={index * 100}>
                <ProductCard product={adaptedProduct} />
              </AnimateOnScroll>
            );
          })}
        </div>

        <AnimateOnScroll animation="fade-up" delay={400}>
          <div className="flex justify-center mt-12 md:mt-16">
            <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full border-border hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md">
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
