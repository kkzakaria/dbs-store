"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type SearchFiltersProps = {
  categories: { slug: string; name: string }[];
  brands: string[];
  current: {
    categorie?: string;
    marque?: string;
    prix_max?: string;
    tri?: string;
  };
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

export function SearchFilters({ categories, brands, current }: SearchFiltersProps) {
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
    <div className="flex flex-wrap items-center gap-6">
      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold">Tri</span>
        {TRI_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={current.tri === opt.value ? "default" : "ghost"}
            size="sm"
            onClick={() => toggle("tri", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Category */}
      {categories.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">Catégorie</span>
          {categories.map((cat) => (
            <Button
              key={cat.slug}
              variant={current.categorie === cat.slug ? "default" : "ghost"}
              size="sm"
              onClick={() => toggle("categorie", cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Brand */}
      {brands.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">Marque</span>
          {brands.map((brand) => (
            <Button
              key={brand}
              variant={current.marque === brand ? "default" : "ghost"}
              size="sm"
              onClick={() => toggle("marque", brand)}
            >
              {brand}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Price */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold">Prix max</span>
        {PRIX_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={current.prix_max === opt.value ? "default" : "ghost"}
            size="sm"
            onClick={() => toggle("prix_max", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
