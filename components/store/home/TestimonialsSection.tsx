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
    <section className="py-32 md:py-48 bg-[#f8f9fa] dark:bg-muted/10 relative overflow-hidden">
      <div className="container-google relative">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-20 md:mb-32 px-4">
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="size-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight max-w-3xl mx-auto">
              La parole est à vous.
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Rejoignez plus de 5000 clients qui nous font confiance pour leur équipement technologique.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
          {testimonials.map((testimonial, index) => (
            <AnimateOnScroll 
              key={testimonial.id} 
              animation="fade-up" 
              delay={index * 100}
            >
              <div className="group relative flex flex-col h-full p-8 md:p-10 rounded-[40px] bg-white dark:bg-card transition-google hover-google-rise shadow-google-sm">
                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < testimonial.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-lg text-foreground/80 leading-relaxed mb-8 font-medium italic">
                  "{testimonial.comment}"
                </p>

                {/* Author */}
                <div className="mt-auto pt-6 border-t border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-secondary text-primary flex items-center justify-center font-display font-bold text-lg shadow-google-sm transition-google group-hover:scale-110">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-display font-bold text-base leading-tight">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mt-1">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
                {testimonial.date && (
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-4 opacity-60">
                    {testimonial.date}
                  </p>
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
