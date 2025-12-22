"use client"

import Link from "next/link"
import { AnimateOnScroll } from "@/components/animations"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Truck,
  Shield,
  CreditCard,
  Headphones,
  ArrowRight,
  CheckCircle2
} from "lucide-react"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  highlights?: string[]
}

interface FeaturesSectionProps {
  features?: Feature[]
}

const defaultFeatures: Feature[] = [
  {
    icon: <Truck className="size-6" />,
    title: "Livraison rapide",
    description: "Livraison dans toute la Côte d'Ivoire",
    highlights: ["Abidjan en 24h", "Intérieur en 48-72h", "Suivi en temps réel"],
  },
  {
    icon: <Shield className="size-6" />,
    title: "Garantie qualité",
    description: "Produits 100% authentiques garantis",
    highlights: ["Garantie constructeur", "Produits scellés", "SAV réactif"],
  },
  {
    icon: <CreditCard className="size-6" />,
    title: "Paiement sécurisé",
    description: "Plusieurs modes de paiement disponibles",
    highlights: ["Wave & Orange Money", "MTN Mobile Money", "Paiement à la livraison"],
  },
  {
    icon: <Headphones className="size-6" />,
    title: "Support 24/7",
    description: "Une équipe à votre écoute",
    highlights: ["WhatsApp disponible", "Réponse rapide", "Conseils personnalisés"],
  },
]

export function FeaturesSection({ features = defaultFeatures }: FeaturesSectionProps) {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider px-4 py-1.5 bg-primary/10 rounded-full mb-4">
              Pourquoi nous choisir
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight font-display">
              L'expérience <span className="text-gradient-primary">DBS Store</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
              Nous nous engageons à vous offrir la meilleure expérience d'achat tech en Côte d'Ivoire
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <AnimateOnScroll
              key={feature.title}
              animation="fade-up"
              delay={index * 100}
            >
              <div
                className={cn(
                  "group relative h-full p-6 rounded-2xl",
                  "bg-card/80 backdrop-blur-sm",
                  "border border-border/50",
                  "transition-all duration-500",
                  "hover:border-primary/30 hover:shadow-card-hover",
                  "hover:-translate-y-1"
                )}
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className={cn(
                      "inline-flex items-center justify-center",
                      "w-12 h-12 rounded-xl mb-5",
                      "bg-gradient-primary text-white",
                      "shadow-soft shadow-primary/25",
                      "transition-transform duration-500",
                      "group-hover:scale-110 group-hover:rotate-3"
                    )}
                  >
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  {feature.highlights && (
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <li
                          key={highlight}
                          className={cn(
                            "flex items-center gap-2 text-sm text-foreground/80",
                            "transition-all duration-300",
                            "group-hover:translate-x-1"
                          )}
                          style={{ transitionDelay: `${idx * 50}ms` }}
                        >
                          <CheckCircle2 className="size-4 text-primary shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Decorative corner */}
                <div
                  className={cn(
                    "absolute top-0 right-0 w-20 h-20",
                    "bg-gradient-to-br from-primary/10 to-transparent",
                    "rounded-bl-[80px] rounded-tr-2xl",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-500"
                  )}
                />
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={500}>
          <div className="flex justify-center mt-12">
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                "rounded-full group px-8",
                "border-primary/30 hover:border-primary",
                "hover:bg-primary/5",
                "transition-all duration-300"
              )}
            >
              <Link href="/about">
                En savoir plus sur DBS Store
                <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
