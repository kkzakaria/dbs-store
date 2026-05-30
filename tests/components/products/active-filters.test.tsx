// tests/components/products/active-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilters } from "@/components/products/active-filters";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
}));

beforeEach(() => mockPush.mockClear());

describe("ActiveFilters", () => {
  it("ne rend rien quand aucun filtre n'est actif", () => {
    const { container } = render(<ActiveFilters current={{ brands: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche une puce par marque et une pour le prix", () => {
    render(<ActiveFilters current={{ brands: ["Apple", "Samsung"], prixMin: 100000, prixMax: 500000 }} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
    expect(screen.getByText(/FCFA/)).toBeInTheDocument();
  });

  it("retirer une marque pousse une URL sans cette marque", async () => {
    render(<ActiveFilters current={{ brands: ["Apple", "Samsung"] }} />);
    await userEvent.click(screen.getByLabelText("Retirer Apple"));
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("marques=Samsung");
    expect(url).not.toContain("Apple");
  });

  it("« Tout effacer » conserve le tri mais vide marques et prix", async () => {
    render(<ActiveFilters current={{ brands: ["Apple"], prixMax: 500000, tri: "prix_asc" }} />);
    await userEvent.click(screen.getByText("Tout effacer"));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?tri=prix_asc");
  });
});
