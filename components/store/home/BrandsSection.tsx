import { AnimateOnScroll } from "@/components/animations"
import { LogoMarquee } from "./LogoMarquee"

export function BrandsSection() {

  return (
    <section className="py-4 md:py-16 bg-white dark:bg-background border-y border-border/10">
      <div className="container-google">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Les plus grandes marques nous font confiance.
            </h2>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll animation="fade-up" delay={100}>
          <div className="relative">
            {/* Gradient Mask for smooth fade */}
            <div className="absolute inset-y-0 left-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <LogoMarquee speed={30} className="py-4" />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
