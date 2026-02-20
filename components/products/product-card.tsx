"use client";
// components/products/product-card.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/db/schema";

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR");
}

function discountPercent(price: number, oldPrice: number) {
  return Math.round((1 - price / oldPrice) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const images = JSON.parse(product.images) as string[];
  const isOutOfStock = product.stock === 0;

  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      {product.badge ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          {product.badge}
        </span>
      ) : null}
      {product.old_price ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">
          -{discountPercent(product.price, product.old_price)}%
        </span>
      ) : null}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/50 transition-colors group-hover:bg-muted">
        <Image
          src={images[0] ?? "/images/products/placeholder.svg"}
          alt={product.name}
          fill
          className="object-contain p-4"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-lg font-bold">{formatPrice(product.price)} FCFA</p>
          {product.old_price ? (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(product.old_price)}
            </p>
          ) : null}
        </div>
        <div className="mt-3">
          {isOutOfStock ? (
            <p className="text-center text-xs font-medium text-muted-foreground">
              Rupture de stock
            </p>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => e.preventDefault()}
            >
              Ajouter au panier
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
