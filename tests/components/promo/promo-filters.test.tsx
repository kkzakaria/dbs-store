import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromoFilters } from "@/components/promo/promo-filters";

const pushMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/offres",
  useSearchParams: () => useSearchParamsMock(),
}));

const CATEGORIES = [
  { slug: "smartphones", name: "Smartphones" },
  { slug: "audio", name: "Audio" },
];

beforeEach(() => {
  pushMock.mockClear();
  useSearchParamsMock.mockReturnValue(new URLSearchParams());
});

describe("PromoFilters", () => {
  it("renders all tri options and categories", () => {
    render(<PromoFilters categories={CATEGORIES} current={{}} />);
    expect(screen.getByRole("button", { name: /Plus grosse remise/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nouveautés/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prix croissant/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prix décroissant/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Smartphones/i })).toBeInTheDocument();
  });

  it("clicking a non-default tri sets the URL param", async () => {
    const user = userEvent.setup();
    render(<PromoFilters categories={CATEGORIES} current={{}} />);
    await user.click(screen.getByRole("button", { name: /Nouveautés/i }));
    expect(pushMock).toHaveBeenCalledWith("/offres?tri=nouveau");
  });

  it("clicking the active default tri is a no-op", async () => {
    const user = userEvent.setup();
    render(<PromoFilters categories={CATEGORIES} current={{}} />);
    await user.click(screen.getByRole("button", { name: /Plus grosse remise/i }));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clicking an active non-default tri removes it", async () => {
    const user = userEvent.setup();
    useSearchParamsMock.mockReturnValue(new URLSearchParams("tri=prix_asc"));
    render(<PromoFilters categories={CATEGORIES} current={{ tri: "prix_asc" }} />);
    await user.click(screen.getByRole("button", { name: /Prix croissant/i }));
    expect(pushMock).toHaveBeenCalledWith("/offres");
  });

  it("clicking a category sets ?categorie=", async () => {
    const user = userEvent.setup();
    render(<PromoFilters categories={CATEGORIES} current={{}} />);
    await user.click(screen.getByRole("button", { name: /Smartphones/i }));
    expect(pushMock).toHaveBeenCalledWith("/offres?categorie=smartphones");
  });

  it("preserves existing query params when toggling tri", async () => {
    const user = userEvent.setup();
    useSearchParamsMock.mockReturnValue(new URLSearchParams("categorie=smartphones"));
    render(<PromoFilters categories={CATEGORIES} current={{ categorie: "smartphones" }} />);
    await user.click(screen.getByRole("button", { name: /Nouveautés/i }));
    expect(pushMock).toHaveBeenCalledWith("/offres?categorie=smartphones&tri=nouveau");
  });
});
