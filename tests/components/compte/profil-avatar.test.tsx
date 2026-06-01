// tests/components/compte/profil-avatar.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilAvatar, getInitials } from "@/components/compte/profil-avatar";

describe("getInitials", () => {
  it("prend les initiales de deux mots", () => {
    expect(getInitials("Jean Dupont")).toBe("JD");
  });
  it("prend une seule initiale pour un seul mot", () => {
    expect(getInitials("Madonna")).toBe("M");
  });
  it("retourne ? pour une chaîne vide", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});

describe("ProfilAvatar", () => {
  it("affiche les initiales sans image", () => {
    render(<ProfilAvatar name="Jean Dupont" image={null} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("affiche une image quand image est fourni", () => {
    render(<ProfilAvatar name="Jean Dupont" image="https://img/a.png" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img/a.png");
  });
});
