// app/(main)/recherche/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { searchProducts, getPromoProducts, getSearchBrands } from "@/lib/data/products";
import type { SearchFilters } from "@/lib/data/products";
import { getCachedTopLevelCategories, getCachedCategoryBySlug } from "@/lib/data/categories";
import type { Db } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { SearchFilters as SearchFiltersBar } from "@/components/search/search-filters";
import { SearchLoadMore } from "@/components/search/search-load-more";

export const dynamic = "force-dynamic";

const VALID_TRI = ["prix_asc", "prix_desc", "nouveau"] as const;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return parseInt(value, 10);
}

async function resolveCategorySlug(slug: string): Promise<string | undefined> {
  const category = await getCachedCategoryBySlug(slug);
  return category?.id;
}

export default async function RecherchePage({ searchParams }: Props) {
  const raw = await searchParams;
  const q = firstString(raw.q)?.trim()?.slice(0, 200) ?? "";
  const categorie = firstString(raw.categorie);
  const marque = firstString(raw.marque);
  const rawPrixMin = firstString(raw.prix_min);
  const rawPrixMax = firstString(raw.prix_max);
  const rawTri = firstString(raw.tri);

  const db = await getDb();

  if (!q) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>
        <p className="mt-2 text-muted-foreground">
          Tapez un terme dans la barre de recherche pour trouver des produits.
        </p>
      </div>
    );
  }

  const tri = (VALID_TRI as readonly string[]).includes(rawTri ?? "")
    ? (rawTri as SearchFilters["tri"])
    : undefined;

  const filters: SearchFilters = {
    category_id: categorie ? await resolveCategorySlug(categorie) : undefined,
    brand: marque,
    prix_min: parsePositiveInt(rawPrixMin),
    prix_max: parsePositiveInt(rawPrixMax),
    tri,
  };

  const filtersWithoutBrand = { ...filters, brand: undefined };
  const [{ products, hasMore, total }, categories, brands] = await Promise.all([
    searchProducts(db, q, filters, 0, 12),
    getCachedTopLevelCategories(),
    getSearchBrands(db, q, filtersWithoutBrand),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">Recherche</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        Résultats pour &laquo;{q}&raquo;
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} résultat{total !== 1 ? "s" : ""}
      </p>

      {/* Filters */}
      <div className="mt-6">
        <SearchFiltersBar
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          brands={brands}
          current={{
            categorie,
            marque,
            prix_max: rawPrixMax,
            tri: rawTri,
          }}
        />
      </div>

      {/* Results */}
      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState query={q} db={db} />
        ) : (
          <SearchLoadMore
            key={`${q}-${categorie}-${marque}-${rawPrixMin}-${rawPrixMax}-${rawTri}`}
            initialProducts={products}
            initialHasMore={hasMore}
            query={q}
            filters={filters}
          />
        )}
      </div>
    </div>
  );
}

async function EmptyState({ query, db }: { query: string; db: Db }) {
  const popularProducts = await getPromoProducts(db, 8);

  return (
    <div>
      <div className="py-12 text-center">
        <p className="text-lg font-medium">Aucun résultat pour &laquo;{query}&raquo;</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Essayez avec d&apos;autres termes ou parcourez nos catégories.
        </p>
      </div>

      {popularProducts.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Produits populaires</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
