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
    <section className="py-32 md:py-48 bg-white dark:bg-background relative overflow-hidden">
      <div className="container-google relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-20 md:mb-32 px-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-secondary text-primary shadow-google-sm font-bold">
                <CheckCircle2 className="size-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-primary">
                L&apos;engagement DBS Store
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight max-w-3xl mx-auto">
              Une expérience d&apos;achat pensée pour vous.
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Nous combinons innovation et service de proximité pour vous offrir le meilleur de la technologie en Côte d&apos;Ivoire.
            </p>
          </div>
        </AnimateOnScroll>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {features.map((feature, index) => (
            <AnimateOnScroll
              key={feature.title}
              animation="fade-up"
              delay={index * 100}
            >
              <div
                className="group relative h-full p-10 rounded-[40px] bg-[#f8f9fa] dark:bg-muted/10 transition-google hover-google-rise shadow-google-sm"
              >
                <div className="relative">
                  {/* Icon */}
                  <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8 bg-white dark:bg-card text-primary shadow-google-sm transition-google group-hover:scale-110"
                  >
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-display font-bold mb-4 group-hover:text-primary transition-google">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  {feature.highlights && (
                    <ul className="space-y-3">
                      {feature.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-start gap-3 text-sm text-foreground/80 font-semibold"
                        >
                          <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
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
          <div className="flex justify-center mt-20">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-10 rounded-full border-border hover:bg-muted dark:hover:bg-muted/50 text-base font-semibold transition-google shadow-google-sm hover:shadow-google-md"
            >
              <Link href="/about" className="flex items-center gap-3">
                En savoir plus sur DBS Store
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
