// tests/components/search/search-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchFilters } from "@/components/search/search-filters";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams("q=iphone");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/recherche",
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("SearchFilters", () => {
  const categories = [
    { slug: "smartphones", name: "Smartphones" },
    { slug: "tablettes", name: "Tablettes" },
  ];
  const brands = ["Apple", "Samsung"];
  const current = {};

  it("renders sort options", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("Nouveautés")).toBeInTheDocument();
    expect(screen.getByText("Prix croissant")).toBeInTheDocument();
    expect(screen.getByText("Prix décroissant")).toBeInTheDocument();
  });

  it("renders brand buttons", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Samsung")).toBeInTheDocument();
  });

  it("renders category buttons", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
  });

  it("renders price tier buttons", () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    expect(screen.getByText("< 100 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("< 1 000 000 FCFA")).toBeInTheDocument();
  });

  it("pushes URL with filter param on click", async () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(mockPush).toHaveBeenCalledWith("/recherche?q=iphone&marque=Apple");
  });

  it("removes filter param on toggle off (click active filter)", async () => {
    mockSearchParams.set("marque", "Apple");
    render(
      <SearchFilters
        categories={categories}
        brands={brands}
        current={{ marque: "Apple" }}
      />
    );
    await userEvent.click(screen.getByText("Apple"));
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("marque=Apple");
    mockSearchParams.delete("marque");
  });

  it("pushes sort param on click", async () => {
    render(<SearchFilters categories={categories} brands={brands} current={current} />);
    await userEvent.click(screen.getByText("Prix croissant"));
    expect(mockPush).toHaveBeenCalledWith("/recherche?q=iphone&tri=prix_asc");
  });
});
