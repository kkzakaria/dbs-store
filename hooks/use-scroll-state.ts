"use client";

import { useState, useEffect } from "react";

export function useScrollState(threshold = 50) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      setScrollY(y);
      setIsScrolled(y > threshold);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { scrollY, isScrolled };
}
