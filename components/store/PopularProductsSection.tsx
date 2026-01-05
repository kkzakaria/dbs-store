"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProductCard } from "./products/ProductCard"
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
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  if (products.length === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
  }

  const getSavings = (price: number, comparePrice?: number | null) => {
    if (!comparePrice || comparePrice <= price) return null
    return comparePrice - price
  }

  return (
    <section className="py-24 md:py-32 bg-white dark:bg-background overflow-hidden">
      <div className="container-google">
        <AnimateOnScroll animation="fade-up">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-center mb-12 md:mb-20 text-foreground">
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
                      ...product as any,
                      images: [{ url: product.image, is_primary: true }],
                    }} 
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
