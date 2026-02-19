import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PasswordStrength, getPasswordStrength } from "@/components/auth/password-strength";

describe("getPasswordStrength", () => {
  it("returns 0 for empty password", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("returns 1 for short password", () => {
    expect(getPasswordStrength("abc")).toBe(1);
  });

  it("returns 2 for 8+ char password without variety", () => {
    expect(getPasswordStrength("abcdefgh")).toBe(2);
  });

  it("returns 3 for password with uppercase and number", () => {
    expect(getPasswordStrength("Abcdefg1")).toBe(3);
  });

  it("returns 4 for strong password", () => {
    expect(getPasswordStrength("Abcdefg1!")).toBe(4);
  });
});

describe("PasswordStrength", () => {
  it("renders nothing for empty password", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 4 segments", () => {
    render(<PasswordStrength password="test" />);
    expect(screen.getByText(/faible/i)).toBeInTheDocument();
  });

  it("shows 'Fort' for strong password", () => {
    render(<PasswordStrength password="Abcdefg1!" />);
    expect(screen.getByText(/fort/i)).toBeInTheDocument();
  });
});
