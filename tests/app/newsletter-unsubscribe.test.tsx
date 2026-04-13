import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUnsubscribe = vi.fn();

vi.mock("@/lib/actions/newsletter", () => ({
  unsubscribeNewsletter: (...args: unknown[]) => mockUnsubscribe(...args),
}));

const { default: UnsubscribePage } = await import(
  "@/app/(main)/newsletter/unsubscribe/page"
);

describe("UnsubscribePage", () => {
  it("shows error when no token is provided", async () => {
    const page = await UnsubscribePage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByText(/invalide/i)).toBeInTheDocument();
  });

  it("shows success message for valid token", async () => {
    mockUnsubscribe.mockResolvedValue({ success: true });
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "valid-token" }),
    });
    render(page);
    expect(screen.getByText(/desinscrit/i)).toBeInTheDocument();
  });

  it("shows error message for invalid token", async () => {
    mockUnsubscribe.mockResolvedValue({ error: "Lien invalide" });
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "bad-token" }),
    });
    render(page);
    expect(screen.getByText(/invalide/i)).toBeInTheDocument();
  });

  it("shows a link back to homepage", async () => {
    mockUnsubscribe.mockResolvedValue({ success: true });
    const page = await UnsubscribePage({
      searchParams: Promise.resolve({ token: "valid-token" }),
    });
    render(page);
    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
  });
});
