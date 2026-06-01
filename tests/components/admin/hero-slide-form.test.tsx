import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/actions/admin-upload", () => ({
  generateBannerPresignedUrl: vi.fn(),
}));

import { render, screen } from "@testing-library/react";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";

const noop = vi.fn().mockResolvedValue({});

describe("HeroSlideForm", () => {
  it("ne propose plus de champ URL d'image", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.queryByPlaceholderText("https://...")).toBeNull();
  });

  it("affiche un bouton d'ajout d'image (upload)", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.getByRole("button", { name: /ajouter une image/i })).toBeDefined();
  });

  it("affiche l'aperçu live de la bannière", () => {
    render(<HeroSlideForm action={noop} submitLabel="Créer la bannière" />);
    expect(screen.getByText("Aperçu")).toBeDefined();
  });
});
