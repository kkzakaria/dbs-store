"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { loadMoreSearchResults } from "@/lib/actions/search";
import type { Product } from "@/lib/db/schema";
import type { SearchFilters } from "@/lib/data/products";

type SearchLoadMoreProps = {
  initialProducts: Product[];
  initialHasMore: boolean;
  query: string;
  filters: SearchFilters;
};

export function SearchLoadMore({
  initialProducts,
  initialHasMore,
  query,
  filters,
}: SearchLoadMoreProps) {
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadMoreSearchResults(query, filters, products.length);
      setProducts((prev) => [...prev, ...result.products]);
      setHasMore(result.hasMore);
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? "Chargement..." : "Charger plus"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
