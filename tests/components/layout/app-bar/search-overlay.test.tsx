import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchOverlay } from "@/components/layout/app-bar/search-overlay";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSearchSuggestions = vi.fn();
vi.mock("@/lib/actions/search", () => ({
  searchSuggestions: (...args: unknown[]) => mockSearchSuggestions(...args),
}));

describe("SearchOverlay", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    mockPush.mockClear();
    mockSearchSuggestions.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with dialog role", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<SearchOverlay onClose={onClose} />);
    expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    vi.useRealTimers();
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

  it("does not fetch suggestions when query is shorter than 3 characters", async () => {
    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "ip" } });
    await vi.advanceTimersByTimeAsync(400);
    expect(mockSearchSuggestions).not.toHaveBeenCalled();
  });

  it("fetches suggestions after debounce when query >= 3 chars", async () => {
    mockSearchSuggestions.mockResolvedValue([
      { id: "1", name: "iPhone 16 Pro", slug: "iphone-16-pro", brand: "Apple", price: 899000, image: "/img.jpg" },
    ]);

    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "iph" } });
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(mockSearchSuggestions).toHaveBeenCalledWith("iph");
    });
  });

  it("displays suggestion items", async () => {
    mockSearchSuggestions.mockResolvedValue([
      { id: "1", name: "iPhone 16 Pro", slug: "iphone-16-pro", brand: "Apple", price: 899000, image: "/img.jpg" },
    ]);

    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "iphone" } });
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
    });
  });

  it("navigates to /recherche on Enter without selected suggestion", () => {
    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.change(input, { target: { value: "iphone" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/recherche?q=iphone");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not navigate on Enter with empty query", () => {
    render(<SearchOverlay onClose={onClose} />);
    const input = screen.getByPlaceholderText(/rechercher/i);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
