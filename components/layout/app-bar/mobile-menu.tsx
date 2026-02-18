"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTopLevelCategories,
  getSubcategories,
  type Category,
} from "@/lib/data/categories";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const topLevel = getTopLevelCategories();

  if (!open) return null;

  function handleCategoryClick(category: Category) {
    const subs = getSubcategories(category.id);
    if (subs.length > 0) {
      setActiveCategory(category);
    }
  }

  function handleBack() {
    setActiveCategory(null);
  }

  function handleClose() {
    setActiveCategory(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex h-15 items-center justify-between px-4">
        {activeCategory ? (
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Retour">
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <span className="text-xl font-bold">DBS</span>
        )}

        {activeCategory && (
          <span className="text-lg font-semibold">{activeCategory.name}</span>
        )}

        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Fermer le menu">
          <X className="size-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-4 pb-8">
        {!activeCategory ? (
          <div className="grid gap-2 pt-2">
            {topLevel.map((category) => {
              const subs = getSubcategories(category.id);
              const hasSubcategories = subs.length > 0;

              if (!hasSubcategories) {
                return (
                  <Link
                    key={category.id}
                    href={`/${category.slug}`}
                    className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-4 text-base font-medium transition-colors hover:bg-muted"
                    onClick={handleClose}
                  >
                    {category.name}
                  </Link>
                );
              }

              return (
                <button
                  key={category.id}
                  className="flex w-full items-center justify-between rounded-xl bg-muted/50 px-4 py-4 text-left text-base font-medium transition-colors hover:bg-muted"
                  onClick={() => handleCategoryClick(category)}
                >
                  {category.name}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-1 pt-2">
            <Link
              href={`/categorie/${activeCategory.slug}`}
              className="rounded-lg px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              onClick={handleClose}
            >
              Tout voir {activeCategory.name}
            </Link>
            {getSubcategories(activeCategory.id).map((sub) => (
              <Link
                key={sub.id}
                href={`/categorie/${activeCategory.slug}/${sub.slug}`}
                className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                onClick={handleClose}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
