"use client"

import Link from "next/link"
import { AnimateOnScroll } from "@/components/animations"
import { Button } from "@/components/ui/button"
import { ArrowRight, Gift, Zap } from "lucide-react"

interface CTASectionProps {
  title?: string
  description?: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function CTASection({
  title = "Prêt à découvrir nos produits ?",
  description = "Rejoignez des milliers de clients satisfaits et profitez de nos offres exclusives sur les meilleurs produits tech.",
  primaryAction = { label: "Commencer mes achats", href: "/products" },
  secondaryAction = { label: "Voir les promotions", href: "/products?promo=true" },
}: CTASectionProps) {

  return (
    <section className="py-24 md:py-32 bg-white dark:bg-background overflow-hidden px-4">
      <div className="container-google">
        <AnimateOnScroll animation="scale-in">
          <div className="relative rounded-[48px] bg-primary overflow-hidden p-12 md:p-20 lg:p-24 text-center shadow-google-lg">
            {/* Background elements - very subtle */}
            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] max-w-4xl mx-auto">
                {title}
              </h2>
              <p className="text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                <Button
                  asChild
                  size="lg"
                  className="h-16 px-10 rounded-full bg-white text-primary hover:bg-[#f8f9fa] shadow-google-sm hover:shadow-google-md transition-google text-lg font-bold min-w-[240px]"
                >
                  <Link href={primaryAction.href} className="flex items-center gap-3">
                    {primaryAction.label}
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-16 px-10 rounded-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-google text-lg font-bold min-w-[240px]"
                >
                  <Link href={secondaryAction.href} className="flex items-center gap-3">
                    <Gift className="size-5" />
                    {secondaryAction.label}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
