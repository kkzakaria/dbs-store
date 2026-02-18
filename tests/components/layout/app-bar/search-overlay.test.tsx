import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchOverlay } from "@/components/layout/app-bar/search-overlay";

describe("SearchOverlay", () => {
  const onClose = vi.fn();

  it("renders search input when open", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<SearchOverlay open={false} onClose={onClose} />);
    expect(screen.queryByPlaceholderText(/rechercher/i)).not.toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByRole("button", { name: /fermer/i })).toBeInTheDocument();
  });

  it("renders DBS logo", () => {
    render(<SearchOverlay open onClose={onClose} />);
    expect(screen.getByText("DBS")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const closeFn = vi.fn();
    render(<SearchOverlay open onClose={closeFn} />);

    await user.click(screen.getByRole("button", { name: /fermer/i }));
    expect(closeFn).toHaveBeenCalled();
  });
});
