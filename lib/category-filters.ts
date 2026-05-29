// lib/category-filters.ts
export type Tri = "nouveau" | "prix_asc" | "prix_desc";

export type CategoryFilterState = {
  brands: string[];
  prixMin?: number;
  prixMax?: number;
  tri?: Tri;
};

const VALID_TRI = ["nouveau", "prix_asc", "prix_desc"] as const;

export type RawCategoryParams = {
  marques?: string;
  prix_min?: string;
  prix_max?: string;
  tri?: string;
};

export function parseCategoryParams(raw: RawCategoryParams): CategoryFilterState {
  const brands = [
    ...new Set(
      (raw.marques ?? "")
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b.length > 0)
    ),
  ];

  const toPrice = (v?: string): number | undefined => {
    if (v === undefined) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  let prixMin = toPrice(raw.prix_min);
  const prixMax = toPrice(raw.prix_max);
  if (prixMin !== undefined && prixMax !== undefined && prixMin > prixMax) {
    prixMin = undefined; // borne min fautive : on l'ignore (jamais de fourchette vide)
  }

  const tri = VALID_TRI.includes(raw.tri as Tri) ? (raw.tri as Tri) : undefined;

  return { brands, prixMin, prixMax, tri };
}

export function buildCategoryHref(pathname: string, state: CategoryFilterState): string {
  const params = new URLSearchParams();
  if (state.brands.length > 0) params.set("marques", state.brands.join(","));
  if (state.prixMin !== undefined) params.set("prix_min", String(state.prixMin));
  if (state.prixMax !== undefined) params.set("prix_max", String(state.prixMax));
  if (state.tri) params.set("tri", state.tri);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
