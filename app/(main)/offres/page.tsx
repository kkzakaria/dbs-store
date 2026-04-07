// app/(main)/offres/page.tsx
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getPromoProductsFiltered } from "@/lib/data/products";
import type { PromoFilters as PromoFiltersType } from "@/lib/data/products";
import { getCachedTopLevelCategories, getCachedCategoryBySlug } from "@/lib/data/categories";
import { ProductCard } from "@/components/products/product-card";
import { PromoFilters } from "@/components/promo/promo-filters";

export const dynamic = "force-dynamic";

const VALID_TRI = ["remise_desc", "prix_asc", "prix_desc", "nouveau"] as const;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function OffresPage({ searchParams }: Props) {
  const raw = await searchParams;
  const categorieSlug = firstString(raw.categorie);
  const rawTri = firstString(raw.tri);

  const tri = (VALID_TRI as readonly string[]).includes(rawTri ?? "")
    ? (rawTri as PromoFiltersType["tri"])
    : undefined;

  let categoryId: string | undefined;
  let categoryNotFound = false;
  if (categorieSlug) {
    const resolved = await getCachedCategoryBySlug(categorieSlug);
    if (resolved) {
      categoryId = resolved.id;
    } else {
      categoryNotFound = true;
    }
  }

  const filters: PromoFiltersType = {
    category_id: categoryId,
    tri,
  };

  const categoriesPromise = getCachedTopLevelCategories();
  const products: Awaited<ReturnType<typeof getPromoProductsFiltered>> = categoryNotFound
    ? []
    : await getPromoProductsFiltered(await getDb(), filters);
  const categories = await categoriesPromise;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">Offres</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">Offres &amp; Promotions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {products.length} produit{products.length !== 1 ? "s" : ""} en promotion
      </p>

      <div className="mt-6">
        <PromoFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          current={{ categorie: categorieSlug, tri }}
        />
      </div>

      <div className="mt-8">
        {categoryNotFound ? (
          <div className="py-12 text-center">
            <p className="text-lg font-medium">Catégorie introuvable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La catégorie « {categorieSlug} » n&apos;existe pas. Essayez une autre catégorie.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg font-medium">Aucune promotion en cours</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenez bientôt pour découvrir nos prochaines offres.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
