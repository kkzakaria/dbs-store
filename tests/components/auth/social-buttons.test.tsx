import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialButtons } from "@/components/auth/social-buttons";

vi.mock("@/lib/auth-client", () => ({
  signIn: { social: vi.fn() },
}));

describe("SocialButtons", () => {
  it("renders Google button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders Facebook button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /facebook/i })).toBeInTheDocument();
  });

  it("renders Apple button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
  });
});
