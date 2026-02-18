"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelCategories,
  getSubcategories,
} from "@/lib/data/categories";
import { CategoryTray } from "./category-tray";
import { useState, useRef, useEffect } from "react";

export function DesktopNav() {
  const topLevel = getTopLevelCategories();
  const [openTray, setOpenTray] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  function handleMouseEnter(categoryId: string) {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenTray(categoryId);
  }

  function handleMouseLeave() {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenTray(null);
      closeTimeoutRef.current = null;
    }, 150);
  }

  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-0.5">
      {topLevel.map((category) => {
        const subcategories = getSubcategories(category.id);
        const hasSubcategories = subcategories.length > 0;

        if (!hasSubcategories) {
          return (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {category.name}
            </Link>
          );
        }

        return (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => handleMouseEnter(category.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 rounded-full text-sm font-medium text-foreground"
              aria-label={category.name}
              aria-expanded={openTray === category.id}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenTray((prev) => (prev === category.id ? null : category.id));
                }
              }}
            >
              {category.name}
              <ChevronDown className="size-3.5" />
            </Button>

            {openTray === category.id && (
              <CategoryTray
                categorySlug={category.slug}
                subcategories={subcategories}
                onClose={() => setOpenTray(null)}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
