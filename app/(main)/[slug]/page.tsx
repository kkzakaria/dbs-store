// app/(main)/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { categories, getSubcategories } from "@/lib/data/categories";
import { getDb } from "@/lib/db";
import { getProductsByCategory } from "@/lib/data/products";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marque?: string; prix_max?: string; tri?: string }>;
};

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, filters] = await Promise.all([params, searchParams]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const parent = category.parent_id
    ? categories.find((c) => c.id === category.parent_id)
    : null;

  const db = getDb();
  const items = await getProductsByCategory(db, category.id, {
    brand: filters.marque,
    prix_max: filters.prix_max ? parseInt(filters.prix_max) : undefined,
    tri: filters.tri as "prix_asc" | "prix_desc" | "nouveau" | undefined,
  });

  const brands = [...new Set(items.map((p) => p.brand))].sort();
  const subcategories = getSubcategories(category.id);

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

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <ProductFilters
            brands={brands}
            current={{ brand: filters.marque, prix_max: filters.prix_max, tri: filters.tri }}
          />
        </Suspense>

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
