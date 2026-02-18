"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Category } from "@/lib/data/categories";

type CategoryTrayProps = {
  categorySlug: string;
  subcategories: Category[];
  onClose: () => void;
};

export function CategoryTray({
  categorySlug,
  subcategories,
  onClose,
}: CategoryTrayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target;
      if (ref.current && target instanceof Node && !ref.current.contains(target)) {
        onCloseRef.current();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-50 mt-2 min-w-72 rounded-xl border bg-background p-4 shadow-lg"
    >
      <div className="grid gap-1">
        {subcategories.map((sub) => (
          <Link
            key={sub.id}
            href={`/categorie/${categorySlug}/${sub.slug}`}
            className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            onClick={onClose}
          >
            {sub.name}
          </Link>
        ))}
      </div>
      <div className="mt-3 border-t pt-3">
        <Link
          href={`/categorie/${categorySlug}`}
          className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          onClick={onClose}
        >
          Tout voir
        </Link>
      </div>
    </div>
  );
}
