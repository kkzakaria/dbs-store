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
    <section className="py-32 md:py-48 bg-primary relative overflow-hidden">
      <div className="container-google relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 md:gap-24">
          {stats.map((stat, index) => (
            <AnimateOnScroll 
              key={stat.label} 
              animation="fade-up" 
              delay={index * 100}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-8 flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 text-white shadow-google-sm transition-google hover:scale-110">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 tracking-tight">
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
                <p className="text-white/70 text-base md:text-lg font-bold uppercase tracking-widest">
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
