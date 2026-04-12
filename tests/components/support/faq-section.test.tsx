import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FaqSection } from "@/components/support/faq-section";
import { FAQ_DATA } from "@/lib/data/faq";

describe("FaqSection", () => {
  it("renders all FAQ category titles", () => {
    render(<FaqSection />);
    for (const category of FAQ_DATA) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });

  it("renders all questions as accordion triggers", () => {
    render(<FaqSection />);
    const allQuestions = FAQ_DATA.flatMap((c) => c.items.map((i) => i.question));
    for (const question of allQuestions) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });

  it("renders the correct number of accordion items", () => {
    render(<FaqSection />);
    const totalItems = FAQ_DATA.reduce((sum, c) => sum + c.items.length, 0);
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBe(totalItems);
  });
});
