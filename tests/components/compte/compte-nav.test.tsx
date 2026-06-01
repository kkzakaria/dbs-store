import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompteNav } from "@/components/compte/compte-nav";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CompteNav", () => {
  it("affiche Mon profil avant Mes commandes", () => {
    usePathname.mockReturnValue("/compte/profil");
    render(<CompteNav />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("Mon profil");
    expect(links[1]).toHaveTextContent("Mes commandes");
  });

  it("marque Mon profil comme actif sur /compte/profil", () => {
    usePathname.mockReturnValue("/compte/profil");
    render(<CompteNav />);
    expect(screen.getByRole("link", { name: "Mon profil" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      screen.getByRole("link", { name: "Mes commandes" })
    ).not.toHaveAttribute("aria-current");
  });

  it("marque Mes commandes comme actif sur une page de détail commande", () => {
    usePathname.mockReturnValue("/compte/commandes/abc123");
    render(<CompteNav />);
    expect(
      screen.getByRole("link", { name: "Mes commandes" })
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Mon profil" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
