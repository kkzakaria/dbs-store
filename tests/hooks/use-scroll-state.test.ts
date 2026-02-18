import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollState } from "@/hooks/use-scroll-state";

describe("useScrollState", () => {
  it("returns isScrolled false initially", () => {
    const { result } = renderHook(() => useScrollState());
    expect(result.current.isScrolled).toBe(false);
  });

  it("returns isScrolled true after scrolling past threshold", () => {
    const { result } = renderHook(() => useScrollState(50));

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.isScrolled).toBe(true);
  });

  it("returns scrollY value", () => {
    const { result } = renderHook(() => useScrollState());

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 200, writable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.scrollY).toBe(200);
  });
});
