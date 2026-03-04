"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/db/schema";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

function HeroFallback() {
  return (
    <section className="bg-gradient-to-b from-muted/50 to-background">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-6 lg:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          La tech au meilleur prix en Afrique de l&apos;Ouest
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Bienvenue sur DBS Store
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Découvrez notre sélection de smartphones, tablettes, ordinateurs et accessoires.
          Livraison rapide en Côte d&apos;Ivoire et dans toute la zone UEMOA.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/smartphones">Voir les smartphones</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/offres">Offres du moment</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const ALIGN_CLASSES: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

const CTA_JUSTIFY: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [slides.length, paused, next]);

  if (slides.length === 0) return <HeroFallback />;

  const slide = slides[current];

  return (
    <section
      className="relative h-[480px] overflow-hidden sm:h-[560px] lg:h-[640px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Images de fond avec fade */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={s.image_url}
            alt={s.title}
            fill
            className="object-cover"
            priority={i === 0}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: s.overlay_color, opacity: s.overlay_opacity / 100 }}
          />
        </div>
      ))}

      {/* Contenu de la slide courante */}
      <div
        className={cn(
          "relative z-10 flex h-full flex-col justify-center px-6 lg:px-16",
          ALIGN_CLASSES[slide.text_align]
        )}
      >
        <div className="max-w-2xl">
          {slide.badge ? (
            <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {slide.badge}
            </span>
          ) : null}
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          {slide.subtitle ? (
            <p className="mt-4 text-lg text-white/80 sm:text-xl">{slide.subtitle}</p>
          ) : null}
          {(slide.cta_primary_label && slide.cta_primary_href) ||
          (slide.cta_secondary_label && slide.cta_secondary_href) ? (
            <div
              className={cn(
                "mt-8 flex flex-wrap gap-4",
                CTA_JUSTIFY[slide.text_align]
              )}
            >
              {slide.cta_primary_label && slide.cta_primary_href ? (
                <Button size="lg" asChild>
                  <Link href={slide.cta_primary_href}>{slide.cta_primary_label}</Link>
                </Button>
              ) : null}
              {slide.cta_secondary_label && slide.cta_secondary_href ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href={slide.cta_secondary_href}>{slide.cta_secondary_label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Flèches de navigation */}
      {slides.length > 1 ? (
        <>
          <button
            onClick={prev}
            aria-label="Slide précédente"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            aria-label="Slide suivante"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}

      {/* Dots de navigation */}
      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "size-2 rounded-full transition-all",
                i === current ? "w-6 bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
