// components/promo/promo-filters.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type PromoFiltersProps = {
  categories: { slug: string; name: string }[];
  current: {
    categorie?: string;
    tri?: string;
  };
};

const TRI_OPTIONS = [
  { label: "Plus grosse remise", value: "remise_desc" },
  { label: "Nouveautés", value: "nouveau" },
  { label: "Prix croissant", value: "prix_asc" },
  { label: "Prix décroissant", value: "prix_desc" },
];

export function PromoFilters({ categories, current }: PromoFiltersProps) {
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
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold">Tri</span>
        {TRI_OPTIONS.map((opt) => {
          const isActive = current.tri === opt.value || (!current.tri && opt.value === "remise_desc");
          return (
            <Button
              key={opt.value}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (isActive && opt.value === "remise_desc" && !current.tri) return;
                toggle("tri", opt.value);
              }}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
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
    </div>
  );
}
