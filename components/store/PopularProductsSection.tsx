"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
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
                  <div className="group flex flex-col h-full bg-white dark:bg-card border border-border/40 rounded-3xl sm:rounded-[32px] overflow-hidden transition-all duration-300 hover:border-border/80">
                    {/* Image Container with Floating Effect */}
                    <Link
                      href={`/products/${product.slug}`}
                      className={cn(
                        "relative aspect-square overflow-hidden bg-[#f8f9fa] dark:bg-muted/10 rounded-2xl sm:rounded-[24px]",
                        "transition-all duration-500 ease-out",
                        "group-hover:shadow-google-md"
                      )}
                    >
                      {product.status && (
                        <div className="absolute left-6 top-6 z-10">
                          <span className="px-3 py-1 rounded-full bg-[#e8f0fe] dark:bg-primary/20 text-[#1967d2] dark:text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                            {product.status}
                          </span>
                        </div>
                      )}
                      
                      <div className="relative w-full h-full p-10 sm:p-14 transition-transform duration-700 ease-out group-hover:scale-105">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>
                    </Link>

                    {/* Content Section - Clean & Typography Focused */}
                    <div className="flex flex-col px-6 sm:px-8 pt-6 sm:pt-8 pb-8 flex-grow">
                      <div className="space-y-2 mb-4">
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-display font-medium text-lg sm:text-xl text-foreground line-clamp-2 transition-colors duration-300">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      <div className="mt-auto space-y-4">
                        {/* Price Row */}
                        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                          {product.compare_price ? (
                            <>
                              <span className="text-lg font-medium text-foreground">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-sm text-muted-foreground line-through opacity-60">
                                {formatPrice(product.compare_price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-medium text-foreground">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>

                        {getSavings(product.price, product.compare_price) && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e6f4ea] dark:bg-green-500/10 text-[#137333] dark:text-green-400 text-[11px] font-bold self-start">
                             Économisez {formatPrice(getSavings(product.price, product.compare_price)!)}
                          </div>
                        )}

                        {/* Minimalist Action Link */}
                        <div className="pt-2">
                          <Link
                            href={`/products/${product.slug}`}
                            className="inline-flex items-center text-[#1a73e8] dark:text-[#8ab4f8] font-bold text-sm tracking-wide group-hover:underline"
                          >
                            Acheter
                            <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
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
