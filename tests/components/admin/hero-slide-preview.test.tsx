import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSlidePreview } from "@/components/admin/hero-slide-preview";

const baseProps = {
  title: "iPhone 16 Pro",
  subtitle: "La puissance de la tech",
  badge: "Nouveau",
  imageUrl: "https://example.com/img.jpg",
  textAlign: "center" as const,
  overlayColor: "#000000",
  overlayOpacity: 40,
  ctaPrimaryLabel: "Voir les smartphones",
  ctaSecondaryLabel: "Nos offres",
};

describe("HeroSlidePreview", () => {
  it("affiche le titre", () => {
    render(<HeroSlidePreview {...baseProps} />);
    expect(screen.getByText("iPhone 16 Pro")).toBeDefined();
  });

  it("affiche le badge quand il est présent", () => {
    render(<HeroSlidePreview {...baseProps} badge="Promo -20%" />);
    expect(screen.getByText("Promo -20%")).toBeDefined();
  });

  it("n'affiche pas de badge quand il est vide", () => {
    render(<HeroSlidePreview {...baseProps} badge="" />);
    expect(screen.queryByText("Nouveau")).toBeNull();
  });

  it("affiche les libellés des CTA primaire et secondaire", () => {
    render(<HeroSlidePreview {...baseProps} />);
    expect(screen.getByText("Voir les smartphones")).toBeDefined();
    expect(screen.getByText("Nos offres")).toBeDefined();
  });

  it("affiche l'image quand une URL est fournie", () => {
    render(<HeroSlidePreview {...baseProps} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toBe("https://example.com/img.jpg");
  });

  it("affiche un placeholder quand aucune image n'est fournie", () => {
    render(<HeroSlidePreview {...baseProps} imageUrl={undefined} />);
    expect(screen.getByText(/aucune image/i)).toBeDefined();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("applique la couleur et l'opacité de l'overlay", () => {
    const { container } = render(
      <HeroSlidePreview {...baseProps} overlayColor="#ff0000" overlayOpacity={60} />
    );
    const overlay = container.querySelector('[data-testid="preview-overlay"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(overlay.style.opacity).toBe("0.6");
  });

  it("applique l'alignement du texte", () => {
    const { container } = render(
      <HeroSlidePreview {...baseProps} textAlign="right" />
    );
    const content = container.querySelector('[data-testid="preview-content"]') as HTMLElement;
    expect(content.className).toContain("text-right");
  });
});
