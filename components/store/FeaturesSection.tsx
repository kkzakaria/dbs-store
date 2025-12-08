"use client"

import Link from "next/link"
import { AnimateOnScroll } from "@/components/animations"
import { Button } from "@/components/ui/button"
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
    icon: <Truck className="size-6 md:size-8" />,
    title: "Livraison rapide",
    description: "Livraison dans toute la Côte d'Ivoire",
    highlights: ["Abidjan en 24h", "Intérieur en 48-72h", "Suivi en temps réel"],
  },
  {
    icon: <Shield className="size-6 md:size-8" />,
    title: "Garantie qualité",
    description: "Produits 100% authentiques garantis",
    highlights: ["Garantie constructeur", "Produits scellés", "SAV réactif"],
  },
  {
    icon: <CreditCard className="size-6 md:size-8" />,
    title: "Paiement sécurisé",
    description: "Plusieurs modes de paiement disponibles",
    highlights: ["Wave & Orange Money", "MTN Mobile Money", "Paiement à la livraison"],
  },
  {
    icon: <Headphones className="size-6 md:size-8" />,
    title: "Support 24/7",
    description: "Une équipe à votre écoute",
    highlights: ["WhatsApp disponible", "Réponse rapide", "Conseils personnalisés"],
  },
]

export function FeaturesSection({ features = defaultFeatures }: FeaturesSectionProps) {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-transparent to-transparent" />

      <div className="container relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Pourquoi nous choisir
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">
              L'expérience DBS Store
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Nous nous engageons à vous offrir la meilleure expérience d'achat tech en Côte d'Ivoire
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <AnimateOnScroll 
              key={feature.title} 
              animation="fade-up" 
              delay={index * 100}
            >
              <div className="group relative h-full p-6 md:p-8 rounded-2xl bg-card border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Gradient accent on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary to-primary-light text-white mb-5 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  {feature.highlights && (
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight) => (
                        <li 
                          key={highlight}
                          className="flex items-center gap-2 text-sm text-foreground/80"
                        >
                          <CheckCircle2 className="size-4 text-primary shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={500}>
          <div className="flex justify-center mt-12">
            <Button asChild size="lg" variant="outline" className="rounded-full group">
              <Link href="/about">
                En savoir plus sur DBS Store
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
