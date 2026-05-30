// components/products/filter-drawer.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductFilters, type FilterValue } from "./product-filters";
import { buildCategoryHref, type CategoryFilterState } from "@/lib/category-filters";
import { countCategoryProducts } from "@/lib/actions/category-filters";

const DEBOUNCE_MS = 300;

export function FilterDrawer({
  brands,
  current,
  categoryId,
  initialCount,
}: {
  brands: string[];
  current: CategoryFilterState;
  categoryId: string;
  initialCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValue>({
    brands: current.brands,
    prixMin: current.prixMin,
    prixMax: current.prixMax,
  });
  const [count, setCount] = useState<number | null>(initialCount);

  const activeCount =
    current.brands.length + (current.prixMin !== undefined || current.prixMax !== undefined ? 1 : 0);

  // Réinitialiser le brouillon sur l'état appliqué à chaque ouverture
  useEffect(() => {
    if (open) {
      setDraft({ brands: current.brands, prixMin: current.prixMin, prixMax: current.prixMax });
      setCount(initialCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Compteur vivant (debounce) tant que le tiroir est ouvert
  useEffect(() => {
    if (!open) return;
    let stale = false;
    const id = setTimeout(async () => {
      const c = await countCategoryProducts({
        categoryId,
        brands: draft.brands,
        prixMin: draft.prixMin,
        prixMax: draft.prixMax,
      });
      if (!stale) setCount(c);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
      stale = true;
    };
  }, [draft, open, categoryId]);

  function apply() {
    router.push(buildCategoryHref(pathname, { ...draft, tri: current.tri }));
    setOpen(false);
  }

  const label =
    count === null ? "Voir les produits" : `Voir les ${count} produit${count !== 1 ? "s" : ""}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Filtres{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filtres</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <ProductFilters brands={brands} value={draft} onChange={setDraft} />
        </div>
        <SheetFooter className="flex-row gap-2">
          <Button variant="ghost" onClick={() => setDraft({ brands: [], prixMin: undefined, prixMax: undefined })} className="flex-1">
            Réinitialiser
          </Button>
          <Button onClick={apply} className="flex-1">
            {label}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
