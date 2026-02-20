// components/products/product-filters.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type Filters = {
  brand?: string;
  prix_max?: string;
  tri?: string;
};

const PRIX_OPTIONS = [
  { label: "< 100 000 FCFA", value: "100000" },
  { label: "< 300 000 FCFA", value: "300000" },
  { label: "< 500 000 FCFA", value: "500000" },
  { label: "< 1 000 000 FCFA", value: "1000000" },
];

const TRI_OPTIONS = [
  { label: "Nouveautés", value: "nouveau" },
  { label: "Prix croissant", value: "prix_asc" },
  { label: "Prix décroissant", value: "prix_desc" },
];

export function ProductFilters({
  brands,
  current,
}: {
  brands: string[];
  current: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-52">
      <div>
        <p className="mb-2 text-sm font-semibold">Trier par</p>
        <div className="flex flex-wrap gap-1.5 lg:flex-col">
          {TRI_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={current.tri === opt.value ? "default" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => toggle("tri", opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {brands.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Marque</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={current.brand === brand ? "default" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => toggle("marque", brand)}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold">Prix max</p>
        <div className="flex flex-wrap gap-1.5 lg:flex-col">
          {PRIX_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={current.prix_max === opt.value ? "default" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => toggle("prix_max", opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
