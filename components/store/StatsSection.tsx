"use client"

import { AnimateOnScroll, AnimatedCounter } from "@/components/animations"
import { Users, Package, Star, Truck } from "lucide-react"

interface Stat {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
}

interface StatsSectionProps {
  stats?: Stat[]
}

const defaultStats: Stat[] = [
  {
    icon: <Users className="size-6 md:size-8" />,
    value: 5000,
    suffix: "+",
    label: "Clients satisfaits",
  },
  {
    icon: <Package className="size-6 md:size-8" />,
    value: 10000,
    suffix: "+",
    label: "Produits livrés",
  },
  {
    icon: <Star className="size-6 md:size-8" />,
    value: 4.9,
    suffix: "/5",
    label: "Note moyenne",
  },
  {
    icon: <Truck className="size-6 md:size-8" />,
    value: 24,
    suffix: "h",
    label: "Livraison express",
  },
]

export function StatsSection({ stats = defaultStats }: StatsSectionProps) {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary-light" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl translate-y-1/2" />
      </div>

      <div className="container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <AnimateOnScroll 
              key={stat.label} 
              animation="zoom-in" 
              delay={index * 100}
            >
              <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors">
                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 text-white mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.label === "Note moyenne" ? (
                    <AnimatedCounter 
                      end={stat.value} 
                      suffix={stat.suffix}
                      decimals={1}
                    />
                  ) : (
                    <AnimatedCounter 
                      end={stat.value} 
                      suffix={stat.suffix}
                    />
                  )}
                </div>
                <p className="text-white/80 text-sm md:text-base font-medium">
                  {stat.label}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
