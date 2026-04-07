"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/db/schema";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type MobileMenuProps = {
  categories: Category[];
  onClose: () => void;
};

export function MobileMenu({ categories, onClose }: MobileMenuProps) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const topLevel = categories.filter((c) => c.parent_id === null);
  const focusTrapRef = useFocusTrap();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveCategory(null);
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function handleCategoryClick(category: Category) {
    const subs = categories.filter((c) => c.parent_id === category.id);
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
    <div
      ref={focusTrapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="flex h-15 items-center justify-between px-4">
        {activeCategory ? (
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Retour">
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <Image src="/images/dbs-store-logo.png" alt="DBS Store" width={70} height={32} />
        )}

        {activeCategory ? (
          <span className="text-lg font-semibold">{activeCategory.name}</span>
        ) : null}

        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Fermer le menu">
          <X className="size-5" />
        </Button>
      </div>

      <div className="overflow-y-auto px-4 pb-8">
        {!activeCategory ? (
          <div className="grid gap-2 pt-2">
            <Link
              href="/offres"
              className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-4 text-base font-medium text-red-600 transition-colors hover:bg-red-100"
              onClick={handleClose}
            >
              Offres &amp; Promotions
            </Link>
            {topLevel.map((category) => {
              const subs = categories.filter((c) => c.parent_id === category.id);
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
              href={`/${activeCategory.slug}`}
              className="rounded-lg px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              onClick={handleClose}
            >
              Tout voir {activeCategory.name}
            </Link>
            {categories.filter((c) => c.parent_id === activeCategory.id).map((sub) => (
              <Link
                key={sub.id}
                href={`/${sub.slug}`}
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
