"use client";

import { useState, useEffect, useRef } from "react";

export function useScrollState(threshold = 50) {
  const scrollYRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      scrollYRef.current = y;
      setIsScrolled(y > threshold);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { scrollY: scrollYRef, isScrolled };
}
