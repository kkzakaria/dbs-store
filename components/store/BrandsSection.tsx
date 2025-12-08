"use client"

import Image from "next/image"
import { AnimateOnScroll } from "@/components/animations"

interface Brand {
  name: string
  logo: string
}

interface BrandsSectionProps {
  brands?: Brand[]
}

const defaultBrands: Brand[] = [
  { name: "Apple", logo: "/images/brands/apple.svg" },
  { name: "Samsung", logo: "/images/brands/samsung.svg" },
  { name: "Sony", logo: "/images/brands/sony.svg" },
  { name: "LG", logo: "/images/brands/lg.svg" },
  { name: "Huawei", logo: "/images/brands/huawei.svg" },
  { name: "Xiaomi", logo: "/images/brands/xiaomi.svg" },
  { name: "HP", logo: "/images/brands/hp.svg" },
  { name: "Dell", logo: "/images/brands/dell.svg" },
]

export function BrandsSection({ brands = defaultBrands }: BrandsSectionProps) {
  return (
    <section className="py-12 md:py-16 border-y bg-muted/20">
      <div className="container">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-10">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              Nos partenaires de confiance
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">
              Marques officielles
            </h2>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={100}>
          <div className="relative overflow-hidden">
            {/* Gradient overlays for seamless scroll effect */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Scrolling container */}
            <div className="flex animate-marquee gap-12 md:gap-16 py-4">
              {/* First set */}
              {brands.map((brand, index) => (
                <div
                  key={`${brand.name}-1-${index}`}
                  className="flex-shrink-0 flex items-center justify-center w-24 h-12 md:w-32 md:h-16 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Fallback text if logo doesn't load */}
                    <span className="text-lg md:text-xl font-bold text-muted-foreground/50 select-none">
                      {brand.name}
                    </span>
                  </div>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {brands.map((brand, index) => (
                <div
                  key={`${brand.name}-2-${index}`}
                  className="flex-shrink-0 flex items-center justify-center w-24 h-12 md:w-32 md:h-16 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span className="text-lg md:text-xl font-bold text-muted-foreground/50 select-none">
                      {brand.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
