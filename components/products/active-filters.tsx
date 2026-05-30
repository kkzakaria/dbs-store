// components/products/active-filters.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildCategoryHref, type CategoryFilterState } from "@/lib/category-filters";
import { formatPrice } from "@/lib/utils";

function priceLabel(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${formatPrice(min)} – ${formatPrice(max)} FCFA`;
  if (min !== undefined) return `≥ ${formatPrice(min)} FCFA`;
  return `≤ ${formatPrice(max as number)} FCFA`;
}

export function ActiveFilters({ current }: { current: CategoryFilterState }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasPrice = current.prixMin !== undefined || current.prixMax !== undefined;

  if (current.brands.length === 0 && !hasPrice) return null;

  const go = (next: CategoryFilterState) => router.push(buildCategoryHref(pathname, next));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {current.brands.map((b) => (
        <Badge key={b} variant="secondary" className="gap-1 pr-1">
          {b}
          <button
            type="button"
            aria-label={`Retirer ${b}`}
            onClick={() => go({ ...current, brands: current.brands.filter((x) => x !== b) })}
            className="rounded-full hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {hasPrice ? (
        <Badge variant="secondary" className="gap-1 pr-1">
          {priceLabel(current.prixMin, current.prixMax)}
          <button
            type="button"
            aria-label="Retirer le filtre de prix"
            onClick={() => go({ ...current, prixMin: undefined, prixMax: undefined })}
            className="rounded-full hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ) : null}

      <Button variant="ghost" size="sm" onClick={() => go({ brands: [], tri: current.tri })}>
        Tout effacer
      </Button>
    </div>
  );
}
