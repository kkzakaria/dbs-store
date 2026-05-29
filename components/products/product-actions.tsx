"use client";
import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import type { Product } from "@/lib/db/schema";

export function ProductActions({ product }: { product: Product }) {
  const { variants } = product;
  const firstInStock = variants.findIndex((v) => v.stock > 0);
  const [selectedIdx, setSelectedIdx] = useState(firstInStock >= 0 ? firstInStock : 0);

  if (variants.length === 0) {
    return (
      <div className="flex gap-3">
        <AddToCartButton product={product} variant={null} />
      </div>
    );
  }

  const selected = variants[selectedIdx];
  const effectivePrice = selected.price_override ?? product.price;
  const effectiveStock = selected.stock;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">
          Coloris :{" "}
          <span className="font-normal text-muted-foreground">{selected.color_name}</span>
        </p>
        <div className="flex gap-2">
          {variants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={v.color_name}
              aria-pressed={i === selectedIdx}
              disabled={v.stock === 0}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "size-7 rounded-full border-2 transition-transform",
                v.stock === 0 && "cursor-not-allowed opacity-40",
                i === selectedIdx
                  ? "scale-110 border-primary"
                  : "border-transparent hover:scale-110"
              )}
              style={{
                backgroundColor: v.color_hex,
                boxShadow: i === selectedIdx ? "0 0 0 2px var(--card) inset" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-3xl font-bold">{formatPrice(effectivePrice)} FCFA</p>
        <p className="mt-1 text-sm">
          {effectiveStock === 0 ? (
            <span className="font-medium text-red-500">Rupture de stock</span>
          ) : (
            <span className="font-medium text-green-600">
              En stock ({effectiveStock} disponible{effectiveStock > 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        <AddToCartButton product={product} variant={selected} />
      </div>
    </div>
  );
}
