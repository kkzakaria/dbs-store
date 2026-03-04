import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroCarousel } from "@/components/hero/hero-carousel";
import type { HeroSlide } from "@/lib/db/schema";

const makeSlide = (overrides: Partial<HeroSlide> = {}): HeroSlide => ({
  id: "s1",
  title: "iPhone 16 Pro",
  subtitle: "La puissance de la tech",
  badge: "Nouveau",
  image_url: "https://example.com/img.jpg",
  text_align: "center",
  overlay_color: "#000000",
  overlay_opacity: 40,
  cta_primary_label: "Voir les smartphones",
  cta_primary_href: "/smartphones",
  cta_secondary_label: null,
  cta_secondary_href: null,
  is_active: true,
  sort_order: 0,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe("HeroCarousel", () => {
  it("affiche le titre de la première slide", () => {
    render(<HeroCarousel slides={[makeSlide()]} />);
    expect(screen.getByText("iPhone 16 Pro")).toBeDefined();
  });

  it("affiche le badge si présent", () => {
    render(<HeroCarousel slides={[makeSlide({ badge: "Promo -20%" })]} />);
    expect(screen.getByText("Promo -20%")).toBeDefined();
  });

  it("affiche le CTA primaire", () => {
    render(<HeroCarousel slides={[makeSlide()]} />);
    expect(screen.getByText("Voir les smartphones")).toBeDefined();
  });

  it("affiche le fallback si aucune slide", () => {
    render(<HeroCarousel slides={[]} />);
    expect(screen.getByText("Bienvenue sur DBS Store")).toBeDefined();
  });

  it("affiche les dots de navigation si plusieurs slides", () => {
    const slides = [makeSlide({ id: "s1" }), makeSlide({ id: "s2", title: "Slide 2" })];
    render(<HeroCarousel slides={slides} />);
    const dots = screen.getAllByRole("button", { name: /slide/i });
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });
});
