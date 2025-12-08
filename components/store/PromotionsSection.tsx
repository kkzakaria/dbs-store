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
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-yellow-500/5 dark:from-red-500/10 dark:via-orange-500/10 dark:to-yellow-500/10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="container relative">
        <AnimateOnScroll animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-pulse">
                  <Flame className="size-5 text-white" />
                </div>
                <Badge variant="destructive" className="text-sm font-semibold">
                  Offre limitée
                </Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Promotions Flash
              </h2>
              <p className="mt-2 text-muted-foreground text-lg">
                Profitez de réductions exceptionnelles sur une sélection de produits
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <span className="text-sm text-muted-foreground">Se termine dans :</span>
              <CountdownTimer targetDate={promoEndDate} />
            </div>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product, index) => (
            <AnimateOnScroll key={product.id} animation="fade-up" delay={index * 100}>
              <Link
                href={`/products/${product.slug}`}
                className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Discount badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-lg">
                    <Percent className="size-3 mr-1" />
                    -{product.discountPercent}%
                  </Badge>
                </div>

                {/* Image container */}
                <div className="relative aspect-square bg-muted/30 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(product.salePrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={400}>
          <div className="flex justify-center mt-10">
            <Button asChild size="lg" className="rounded-full group">
              <Link href="/products?promo=true">
                Voir toutes les promotions
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
