"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelCategories,
  getSubcategories,
} from "@/lib/data/categories";
import { CategoryTray } from "./category-tray";
import { useState } from "react";

export function DesktopNav() {
  const topLevel = getTopLevelCategories();
  const [openTray, setOpenTray] = useState<string | null>(null);

  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-1">
      {topLevel.map((category) => {
        const subcategories = getSubcategories(category.id);
        const hasSubcategories = subcategories.length > 0;

        if (!hasSubcategories) {
          return (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {category.name}
            </Link>
          );
        }

        return (
          <div key={category.id} className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-sm font-medium text-foreground/80"
              aria-label={category.name}
              aria-expanded={openTray === category.id}
              onClick={() =>
                setOpenTray((prev) => (prev === category.id ? null : category.id))
              }
            >
              {category.name}
              <ChevronDown className="size-3.5" />
            </Button>

            {openTray === category.id && (
              <CategoryTray
                categoryId={category.id}
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
