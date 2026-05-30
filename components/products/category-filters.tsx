// components/products/category-filters.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { ProductFilters, type FilterValue } from "./product-filters";
import { buildCategoryHref, type CategoryFilterState } from "@/lib/category-filters";

export function CategoryFilters({
  brands,
  current,
}: {
  brands: string[];
  current: CategoryFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: FilterValue) {
    router.push(buildCategoryHref(pathname, { ...next, tri: current.tri }));
  }

  return (
    <aside className="w-full shrink-0 lg:w-52">
      <ProductFilters
        brands={brands}
        value={{ brands: current.brands, prixMin: current.prixMin, prixMax: current.prixMax }}
        onChange={handleChange}
      />
    </aside>
  );
}
