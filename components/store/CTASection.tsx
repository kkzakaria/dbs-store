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
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="container relative">
        <AnimateOnScroll animation="zoom-in">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-light animate-gradient" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-soft" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
              
              {/* Floating icons */}
              <div className="absolute top-8 right-8 md:top-12 md:right-12 p-3 rounded-full bg-white/10 backdrop-blur-sm animate-float">
                <Zap className="size-6 text-accent" />
              </div>
              <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 p-3 rounded-full bg-white/10 backdrop-blur-sm animate-float" style={{ animationDelay: "0.5s" }}>
                <Gift className="size-6 text-white" />
              </div>
            </div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />

            {/* Content */}
            <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 lg:py-20 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white max-w-3xl mx-auto leading-tight">
                {title}
              </h2>
              <p className="mt-4 md:mt-6 text-white/80 text-base md:text-lg max-w-xl mx-auto">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:mt-10">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all group min-w-[200px]"
                >
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all group min-w-[200px]"
                >
                  <Link href={secondaryAction.href}>
                    <Gift className="mr-2 size-4" />
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
