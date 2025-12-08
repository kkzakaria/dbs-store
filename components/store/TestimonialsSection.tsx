"use client"

import { AnimateOnScroll } from "@/components/animations"
import { Star, Quote } from "lucide-react"

interface Testimonial {
  id: string
  name: string
  location: string
  rating: number
  comment: string
  avatar?: string
  date?: string
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Kouamé Aka",
    location: "Abidjan, Cocody",
    rating: 5,
    comment: "Service exceptionnel ! Mon iPhone est arrivé en parfait état, livraison rapide en 24h. Je recommande vivement DBS Store !",
    date: "Il y a 2 jours"
  },
  {
    id: "2",
    name: "Fatou Diallo",
    location: "Abidjan, Plateau",
    rating: 5,
    comment: "Meilleurs prix sur le marché et produits 100% authentiques. Le service client est réactif et très professionnel.",
    date: "Il y a 1 semaine"
  },
  {
    id: "3",
    name: "Jean-Pierre Koffi",
    location: "Bouaké",
    rating: 5,
    comment: "J'ai commandé un MacBook Pro, livraison jusqu'à Bouaké en 48h. Packaging soigné et garantie constructeur incluse.",
    date: "Il y a 2 semaines"
  },
  {
    id: "4",
    name: "Marie Kouadio",
    location: "Abidjan, Marcory",
    rating: 5,
    comment: "Excellente expérience d'achat ! Les AirPods Pro commandés étaient exactement comme décrits. Je suis cliente fidèle maintenant.",
    date: "Il y a 3 semaines"
  },
]

export function TestimonialsSection({ testimonials = defaultTestimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="size-5 fill-accent text-accent" />
                ))}
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ce que disent nos clients
            </h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              Plus de 5000 clients satisfaits nous font confiance
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <AnimateOnScroll 
              key={testimonial.id} 
              animation="fade-up" 
              delay={index * 100}
            >
              <div className="relative h-full p-6 rounded-2xl bg-card border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Quote icon */}
                <Quote className="absolute top-4 right-4 size-8 text-primary/10" />

                {/* Rating */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < testimonial.rating
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-sm text-foreground/80 leading-relaxed mb-6 line-clamp-4">
                  "{testimonial.comment}"
                </p>

                {/* Author */}
                <div className="mt-auto pt-4 border-t">
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                  {testimonial.date && (
                    <p className="text-xs text-muted-foreground mt-2">{testimonial.date}</p>
                  )}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
