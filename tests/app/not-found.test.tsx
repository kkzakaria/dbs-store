// tests/app/not-found.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("NotFound", () => {
  it("affiche le logo DBS Store", () => {
    render(<NotFound />);
    expect(screen.getByAltText("DBS Store")).toBeInTheDocument();
  });

  it("affiche le titre principal", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /page introuvable/i })).toBeInTheDocument();
  });

  it("affiche le sous-titre explicatif", () => {
    render(<NotFound />);
    expect(screen.getByText(/ce lien ne mène nulle part/i)).toBeInTheDocument();
  });

  it("contient un lien vers l'accueil", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /retour à l'accueil/i })).toHaveAttribute("href", "/");
  });

  it("affiche le code d'erreur discret", () => {
    render(<NotFound />);
    expect(screen.getByText("ERREUR 404")).toBeInTheDocument();
  });
});
