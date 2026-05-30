// tests/components/products/sort-select.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SortSelect } from "@/components/products/sort-select";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/smartphones",
  useSearchParams: () => new URLSearchParams(),
}));

describe("SortSelect", () => {
  it("affiche le libellé du tri courant", () => {
    render(<SortSelect current="prix_asc" />);
    expect(screen.getByText("Prix croissant")).toBeInTheDocument();
  });

  it("affiche le placeholder quand aucun tri n'est défini", () => {
    render(<SortSelect current={undefined} />);
    expect(screen.getByText("Trier par")).toBeInTheDocument();
  });
});
