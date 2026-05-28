// tests/app/offres-page.test.tsx
import { describe, it, expect, vi } from "vitest";
import OffresPage from "@/app/(main)/offres/page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound() called");
  }),
}));

describe("OffresPage", () => {
  it("calls notFound() to return 404", () => {
    expect(() => {
      OffresPage();
    }).toThrow("notFound() called");
  });
});
