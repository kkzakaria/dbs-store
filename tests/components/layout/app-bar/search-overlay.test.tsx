import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchOverlay } from "@/components/layout/app-bar/search-overlay";

describe("SearchOverlay", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it("renders with dialog role", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByRole("button", { name: /fermer/i })).toBeInTheDocument();
  });

  it("renders DBS logo", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByText("DBS")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    render(<SearchOverlay onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /fermer/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    render(<SearchOverlay onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const { container } = render(<SearchOverlay onClose={onClose} />);
    const backdrop = container.querySelector("[aria-hidden='true']") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
