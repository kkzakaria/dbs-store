// tests/components/products/category-filters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilters } from "@/components/products/category-filters";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/smartphones",
}));

beforeEach(() => mockPush.mockClear());

describe("CategoryFilters", () => {
  it("pousse l'URL immédiatement au clic sur une marque (instantané desktop)", async () => {
    render(<CategoryFilters brands={["Apple", "Samsung"]} current={{ brands: [], tri: "prix_asc" }} />);
    await userEvent.click(screen.getByText("Apple"));
    expect(mockPush).toHaveBeenCalledWith("/smartphones?marques=Apple&tri=prix_asc");
  });
});
