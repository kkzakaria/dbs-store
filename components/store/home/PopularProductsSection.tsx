"use client"

import * as React from "react"
import { ProductCard, type Product } from "../products/ProductCard"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { AnimateOnScroll } from "@/components/animations"

interface PopularProduct {
  id: string
  name: string
  slug: string
  image: string
  price: number
  compare_price?: number | null
  status?: string // 'New', 'Coming Soon', etc.
}

interface PopularProductsSectionProps {
  products: PopularProduct[]
}

export function PopularProductsSection({ products }: PopularProductsSectionProps) {
  const [api, setApi] = React.useState<CarouselApi>()

  if (products.length === 0) return null

  return (
    <section className="py-12 md:py-20 bg-white dark:bg-background overflow-hidden">
      <div className="container-google">
        <AnimateOnScroll animation="fade-up">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-10 md:mb-14 text-foreground">
            Populaires sur DBS Store.
          </h2>
        </AnimateOnScroll>

        <div className="relative px-4 md:px-0">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {products.map((product) => (
                <CarouselItem key={product.id} className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <ProductCard 
                    product={{
                      ...product,
                      images: [{ url: product.image, is_primary: true, id: "primary", alt: product.name, position: 0 }],
                    } as unknown as Product} 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Buttons */}
            <div className="hidden md:block">
              <CarouselPrevious className="absolute -left-16 top-1/2 -translate-y-1/2 size-12 rounded-full border-border bg-white dark:bg-card shadow-google-sm hover:shadow-google-md transition-google" />
              <CarouselNext className="absolute -right-16 top-1/2 -translate-y-1/2 size-12 rounded-full border-border bg-white dark:bg-card shadow-google-sm hover:shadow-google-md transition-google" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}
