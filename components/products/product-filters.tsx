// components/products/product-filters.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FilterValue = {
  brands: string[];
  prixMin?: number;
  prixMax?: number;
};

export function ProductFilters({
  brands,
  value,
  onChange,
}: {
  brands: string[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
}) {
  const [minStr, setMinStr] = useState(value.prixMin?.toString() ?? "");
  const [maxStr, setMaxStr] = useState(value.prixMax?.toString() ?? "");

  // Resynchroniser les champs si l'état appliqué change en dehors du composant
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMinStr(value.prixMin?.toString() ?? ""), [value.prixMin]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMaxStr(value.prixMax?.toString() ?? ""), [value.prixMax]);

  function toggleBrand(brand: string) {
    const next = value.brands.includes(brand)
      ? value.brands.filter((b) => b !== brand)
      : [...value.brands, brand];
    onChange({ ...value, brands: next });
  }

  function commitPrice() {
    const parse = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    onChange({ ...value, prixMin: parse(minStr), prixMax: parse(maxStr) });
  }

  return (
    <div className="space-y-6">
      {brands.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Marque</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={value.brands.includes(brand) ? "default" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => toggleBrand(brand)}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold">Prix (FCFA)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Prix minimum"
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); }}
            className="w-24"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Prix maximum"
            value={maxStr}
            onChange={(e) => setMaxStr(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); }}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
