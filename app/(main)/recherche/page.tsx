// app/(main)/recherche/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { searchProducts, getPromoProducts, getSearchBrands } from "@/lib/data/products";
import type { SearchFilters } from "@/lib/data/products";
import { getTopLevelCategories, getCategoryBySlug } from "@/lib/data/categories";
import type { Db } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { SearchFilters as SearchFiltersBar } from "@/components/search/search-filters";
import { SearchLoadMore } from "@/components/search/search-load-more";

export const dynamic = "force-dynamic";

const VALID_TRI = ["prix_asc", "prix_desc", "nouveau"] as const;

type Props = {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    marque?: string;
    prix_min?: string;
    prix_max?: string;
    tri?: string;
  }>;
};

async function resolveCategorySlug(db: Db, slug: string): Promise<string | undefined> {
  const category = await getCategoryBySlug(db, slug);
  return category?.id;
}

export default async function RecherchePage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q?.trim() ?? "").slice(0, 200);
  const db = await getDb();

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>
        <p className="mt-2 text-muted-foreground">
          Tapez un terme dans la barre de recherche pour trouver des produits.
        </p>
      </div>
    );
  }

  const tri = (VALID_TRI as readonly string[]).includes(params.tri ?? "")
    ? (params.tri as SearchFilters["tri"])
    : undefined;
  const prixMin = params.prix_min ? parseInt(params.prix_min, 10) : undefined;
  const prixMax = params.prix_max ? parseInt(params.prix_max, 10) : undefined;

  const filters: SearchFilters = {
    category_id: params.categorie ? await resolveCategorySlug(db, params.categorie) : undefined,
    brand: params.marque,
    prix_min: prixMin !== undefined && Number.isFinite(prixMin) ? prixMin : undefined,
    prix_max: prixMax !== undefined && Number.isFinite(prixMax) ? prixMax : undefined,
    tri,
  };

  const filtersWithoutBrand = { ...filters, brand: undefined };
  const [{ products, hasMore, total }, categories, brands] = await Promise.all([
    searchProducts(db, query, filters, 0, 12),
    getTopLevelCategories(db),
    getSearchBrands(db, query, filtersWithoutBrand),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <span className="font-medium text-foreground">Recherche</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        Résultats pour &laquo;{query}&raquo;
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
            categorie: params.categorie,
            marque: params.marque,
            prix_max: params.prix_max,
            tri: params.tri,
          }}
        />
      </div>

      {/* Results */}
      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState query={query} db={db} />
        ) : (
          <SearchLoadMore
            key={`${query}-${params.categorie}-${params.marque}-${params.prix_min}-${params.prix_max}-${params.tri}`}
            initialProducts={products}
            initialHasMore={hasMore}
            query={query}
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
