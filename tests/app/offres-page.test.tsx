// tests/app/offres-page.test.tsx
import { describe, it, expect, vi } from "vitest";
import OffresPage from "@/app/(main)/offres/page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    const error = new Error("NEXT_NOT_FOUND");
    (error as any).code = "NEXT_NOT_FOUND";
    throw error;
  }),
}));

describe("OffresPage", () => {
  it("calls notFound() to return 404", async () => {
    // TODO: Re-enable this test when "Offres" feature is ready for launch
    // For now, the page is disabled and returns 404
    try {
      await OffresPage({ searchParams: Promise.resolve({}) });
      expect.fail("Should have thrown NEXT_NOT_FOUND");
    } catch (error) {
      expect((error as Error).message).toBe("NEXT_NOT_FOUND");
    }
  });
});
