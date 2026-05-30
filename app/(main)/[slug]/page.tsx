// app/(main)/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCachedCategoryBySlug, getCategoryById, getCachedSubcategories } from "@/lib/data/categories";
import { getDb } from "@/lib/db";
import { getProductsByCategory, getCategoryBrands } from "@/lib/data/products";
import { parseCategoryParams } from "@/lib/category-filters";
import { ProductCard } from "@/components/products/product-card";
import { CategoryFilters } from "@/components/products/category-filters";
import { FilterDrawer } from "@/components/products/filter-drawer";
import { SortSelect } from "@/components/products/sort-select";
import { ActiveFilters } from "@/components/products/active-filters";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marques?: string; prix_min?: string; prix_max?: string; tri?: string }>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, rawFilters] = await Promise.all([params, searchParams]);

  const db = await getDb();
  const category = await getCachedCategoryBySlug(slug);
  if (!category) notFound();

  const parent = category.parent_id
    ? await getCategoryById(db, category.parent_id)
    : null;

  const current = parseCategoryParams(rawFilters);
  const [items, brands, subcategories] = await Promise.all([
    getProductsByCategory(db, category.id, {
      brands: current.brands.length > 0 ? current.brands : undefined,
      prix_min: current.prixMin,
      prix_max: current.prixMax,
      tri: current.tri,
    }),
    getCategoryBrands(db, category.id),
    getCachedSubcategories(category.id),
  ]);

  const hasActiveFilters =
    current.brands.length > 0 || current.prixMin !== undefined || current.prixMax !== undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        {parent ? (
          <>
            <Link href={`/${parent.slug}`} className="hover:text-foreground">{parent.name}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} produit{items.length !== 1 ? "s" : ""}
      </p>

      {/* Subcategory pills */}
      {subcategories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {subcategories.map((sub) => (
            <Link
              key={sub.slug}
              href={`/${sub.slug}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ) : null}

      {/* Barre d'outils : tiroir mobile + tri */}
      <div className="mt-6 flex items-center gap-4">
        <div className="lg:hidden">
          <FilterDrawer
            brands={brands}
            current={current}
            categoryId={category.id}
            initialCount={items.length}
          />
        </div>
        <div className="ml-auto">
          <SortSelect current={current.tri} />
        </div>
      </div>

      {/* Puces de filtres actifs */}
      {hasActiveFilters ? (
        <div className="mt-4">
          <ActiveFilters current={current} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <div className="hidden lg:block">
          <CategoryFilters brands={brands} current={current} />
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier les filtres.</p>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
