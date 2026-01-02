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
    <section className="py-20 md:py-32 bg-white dark:bg-background border-y border-border/10">
      <div className="container-google">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Les plus grandes marques nous font confiance.
            </h2>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={100}>
          <div className="relative overflow-hidden group">
            {/* Scrolling container */}
            <div className="flex animate-marquee gap-20 md:gap-32 py-8 items-center">
              {/* First set */}
              {brands.map((brand, index) => (
                <div
                  key={`${brand.name}-1-${index}`}
                  className="flex-shrink-0 flex items-center justify-center grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-google"
                >
                  <span className="text-xl md:text-2xl font-display font-bold text-foreground/40 select-none tracking-tight">
                    {brand.name}
                  </span>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {brands.map((brand, index) => (
                <div
                  key={`${brand.name}-2-${index}`}
                  className="flex-shrink-0 flex items-center justify-center grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-google"
                >
                  <span className="text-xl md:text-2xl font-display font-bold text-foreground/40 select-none tracking-tight">
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
