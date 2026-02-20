// app/(main)/produits/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";
import { categories } from "@/lib/data/categories";
import { getDb } from "@/lib/db";
import { getProductCached, getRelatedProducts } from "@/lib/data/products";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductSpecs } from "@/components/products/product-specs";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductCached(slug);
  if (!product) return {};
  return {
    title: `${product.name} — DBS Store`,
    description: product.description,
  };
}

async function RelatedProducts({ productId, subcategoryId }: { productId: string; subcategoryId: string }) {
  const db = getDb();
  const related = await getRelatedProducts(db, productId, subcategoryId);
  if (related.length === 0) return null;
  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold tracking-tight">Produits similaires</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function formatPrice(p: number) {
  return p.toLocaleString("fr-FR");
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductCached(slug); // cache hit si generateMetadata a déjà appelé
  if (!product) notFound();

  const images = JSON.parse(product.images) as string[];
  const specs = JSON.parse(product.specs) as Record<string, string>;

  const category = categories.find((c) => c.id === product.category_id);
  const subcategory = product.subcategory_id
    ? categories.find((c) => c.id === product.subcategory_id)
    : null;

  const isOutOfStock = product.stock === 0;
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        {category ? (
          <>
            <Link href={`/${category.slug}`} className="hover:text-foreground">{category.name}</Link>
            <span>/</span>
          </>
        ) : null}
        {subcategory ? (
          <>
            <Link href={`/${subcategory.slug}`} className="hover:text-foreground">{subcategory.name}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={images} name={product.name} />

        <div className="flex flex-col">
          {product.badge ? (
            <span className="mb-3 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {product.badge}
            </span>
          ) : null}

          <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)} FCFA</span>
            {product.old_price ? (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.old_price)} FCFA
                </span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-600">
                  -{discount}%
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-2 text-sm">
            {isOutOfStock ? (
              <span className="font-medium text-red-500">Rupture de stock</span>
            ) : (
              <span className="font-medium text-green-600">
                En stock ({product.stock} disponible{product.stock > 1 ? "s" : ""})
              </span>
            )}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 flex gap-3">
            <Button size="lg" className="flex-1 gap-2" disabled={isOutOfStock}>
              <ShoppingCart className="size-4" />
              {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
            </Button>
          </div>

          {Object.keys(specs).length > 0 ? (
            <div className="mt-8">
              <h2 className="mb-3 text-base font-semibold">Caractéristiques techniques</h2>
              <ProductSpecs specs={specs} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Produits similaires — streamés indépendamment */}
      {product.subcategory_id ? (
        <Suspense>
          <RelatedProducts productId={product.id} subcategoryId={product.subcategory_id} />
        </Suspense>
      ) : null}
    </div>
  );
}
