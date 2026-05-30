// tests/components/products/product-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters, type FilterValue } from "@/components/products/product-filters";

const brands = ["Apple", "Samsung"];
const empty: FilterValue = { brands: [] };

let onChange: ReturnType<typeof vi.fn<(next: FilterValue) => void>>;
beforeEach(() => { onChange = vi.fn<(next: FilterValue) => void>(); });

describe("ProductFilters", () => {
  it("affiche les marques", () => {
    render(<ProductFilters brands={brands} value={empty} onChange={onChange} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
  });

  it("n'affiche pas la section marque quand brands est vide", () => {
    render(<ProductFilters brands={[]} value={empty} onChange={onChange} />);
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("ajoute une marque à la sélection au clic", async () => {
    render(<ProductFilters brands={brands} value={empty} onChange={onChange} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith({ brands: ["Apple"] });
  });

  it("retire une marque déjà sélectionnée (toggle off)", async () => {
    render(<ProductFilters brands={brands} value={{ brands: ["Apple"] }} onChange={onChange} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith({ brands: [] });
  });

  it("conserve les autres marques en ajoutant une deuxième", async () => {
    render(<ProductFilters brands={brands} value={{ brands: ["Apple"] }} onChange={onChange} />);
    await userEvent.click(screen.getByText("Samsung"));
    expect(onChange).toHaveBeenCalledWith({ brands: ["Apple", "Samsung"] });
  });

  it("émet les bornes de prix au blur du champ", async () => {
    render(<ProductFilters brands={brands} value={empty} onChange={onChange} />);
    const min = screen.getByLabelText("Prix minimum");
    await userEvent.type(min, "100000");
    await userEvent.tab(); // blur
    expect(onChange).toHaveBeenLastCalledWith({ brands: [], prixMin: 100000, prixMax: undefined });
  });
});
