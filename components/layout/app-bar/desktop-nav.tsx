"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelCategories,
  getSubcategories,
  type Category,
} from "@/lib/data/categories";
import { CategoryTray } from "./category-tray";
import { useState, useRef, useEffect } from "react";

// Catégories affichées directement dans la barre
const MAX_VISIBLE = 6;

function NavItem({
  category,
  openTray,
  onMouseEnter,
  onMouseLeave,
  onKeyToggle,
  onClose,
}: {
  category: Category;
  openTray: string | null;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onKeyToggle: (id: string) => void;
  onClose: () => void;
}) {
  const subcategories = getSubcategories(category.id);
  if (subcategories.length === 0) {
    return (
      <Link
        href={`/${category.slug}`}
        className="rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        {category.name}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => onMouseEnter(category.id)}
      onMouseLeave={onMouseLeave}
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
            onKeyToggle(category.id);
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
          onClose={onClose}
        />
      )}
    </div>
  );
}

export function DesktopNav() {
  const topLevel = getTopLevelCategories();
  const [openTray, setOpenTray] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = topLevel.slice(0, MAX_VISIBLE);
  const overflow = topLevel.slice(MAX_VISIBLE);

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

  function handleKeyToggle(categoryId: string) {
    setOpenTray((prev) => (prev === categoryId ? null : categoryId));
  }

  const navItemProps = {
    openTray,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onKeyToggle: handleKeyToggle,
    onClose: () => setOpenTray(null),
  };

  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-0.5">
      {visible.map((category) => (
        <NavItem key={category.id} category={category} {...navItemProps} />
      ))}

      {overflow.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => handleMouseEnter("__more__")}
          onMouseLeave={handleMouseLeave}
        >
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 rounded-full text-sm font-medium text-foreground"
            aria-expanded={openTray === "__more__"}
            aria-label="Plus de catégories"
          >
            Plus
            <ChevronDown className="size-3.5" />
          </Button>

          {openTray === "__more__" && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border bg-background p-1.5 shadow-lg">
              {overflow.map((category) => {
                const subcategories = getSubcategories(category.id);
                return (
                  <Link
                    key={category.id}
                    href={`/${category.slug}`}
                    className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpenTray(null)}
                  >
                    {category.name}
                    {subcategories.length > 0 && (
                      <ChevronDown className="ml-auto size-3.5 -rotate-90 opacity-40" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
