// tests/components/products/filter-drawer.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterDrawer } from "@/components/products/filter-drawer";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
}));

const mockCount = vi.fn();
vi.mock("@/lib/actions/category-filters", () => ({
  countCategoryProducts: (...a: unknown[]) => mockCount(...a),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockCount.mockReset();
  mockCount.mockResolvedValue(3);
});

describe("FilterDrawer", () => {
  it("affiche le nombre de filtres actifs sur le bouton déclencheur", () => {
    render(<FilterDrawer brands={["Apple"]} current={{ brands: ["Apple"], prixMax: 500000 }} categoryId="smartphones" initialCount={10} />);
    expect(screen.getByText("Filtres (2)")).toBeInTheDocument();
  });

  it("ouvre le tiroir, modifie un brouillon et applique sans recharger avant le clic", async () => {
    render(<FilterDrawer brands={["Apple", "Samsung"]} current={{ brands: [] }} categoryId="smartphones" initialCount={10} />);
    await userEvent.click(screen.getByRole("button", { name: /Filtres/ }));
    // sélection d'une marque dans le tiroir
    await userEvent.click(screen.getByText("Apple"));
    // aucune navigation tant qu'on n'a pas appliqué
    expect(mockPush).not.toHaveBeenCalled();
    // appliquer
    await userEvent.click(screen.getByRole("button", { name: /Voir les/ }));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?marques=Apple");
  });

  it("met à jour le libellé avec le compteur vivant", async () => {
    mockCount.mockResolvedValue(3);
    render(<FilterDrawer brands={["Apple", "Samsung"]} current={{ brands: [] }} categoryId="smartphones" initialCount={10} />);
    await userEvent.click(screen.getByRole("button", { name: /Filtres/ }));
    // le compteur vivant (debounce 300ms) finit par afficher 3 produits
    expect(await screen.findByRole("button", { name: /Voir les 3 produits/ }, { timeout: 2000 })).toBeInTheDocument();
  });
});
