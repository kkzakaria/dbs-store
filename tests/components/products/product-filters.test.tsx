// tests/components/products/product-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters } from "@/components/products/product-filters";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockPush.mockClear();
  mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
});

describe("ProductFilters", () => {
  const brands = ["Apple", "Samsung"];
  const current = { brand: undefined, prix_max: undefined, tri: undefined };

  it("affiche les options de tri", () => {
    render(<ProductFilters brands={brands} current={current} />);
    expect(screen.getByText("Nouveautés")).toBeInTheDocument();
    expect(screen.getByText("Prix croissant")).toBeInTheDocument();
    expect(screen.getByText("Prix décroissant")).toBeInTheDocument();
  });

  it("affiche les marques", () => {
    render(<ProductFilters brands={brands} current={current} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
  });

  it("n'affiche pas la section marque quand brands est vide", () => {
    render(<ProductFilters brands={[]} current={current} />);
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("appelle router.push avec le bon param au clic sur une marque", async () => {
    render(<ProductFilters brands={brands} current={current} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?marque=Apple");
  });

  it("supprime le param quand on reclique sur le filtre actif (toggle off)", async () => {
    mockSearchParams.set("marque", "Apple");
    render(<ProductFilters brands={brands} current={{ ...current, brand: "Apple" }} />);
    await userEvent.click(screen.getByText("Apple"));
    const calledUrl = mockPush.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("marque=Apple");
  });

  it("appelle router.push avec ?tri=prix_asc au clic sur Prix croissant", async () => {
    render(<ProductFilters brands={brands} current={current} />);
    await userEvent.click(screen.getByText("Prix croissant"));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?tri=prix_asc");
  });
});
