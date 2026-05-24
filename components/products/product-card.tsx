"use client";
// components/products/product-card.tsx
// Carte produit "Soft Editorial" (V1) — image teintée + zoom au survol,
// favori en overlay, libellé marque, indicateur stock faible, ligne note + coloris,
// prix + bouton Ajouter + bouton WhatsApp. État rupture géré (badge + "Me prévenir").
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/db/schema";

// Seuil en dessous duquel on affiche "Plus que N" (stock faible).
const LOW_STOCK_THRESHOLD = 5;
// Numéro WhatsApp business — câblé plus tard via l'env. Sans numéro, wa.me ouvre
// le sélecteur de contact (comportement actuel du design).
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR");
}

function discountPercent(price: number, oldPrice: number) {
  return Math.round((1 - price / oldPrice) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [liked, setLiked] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const image = product.images[0] ?? "/images/products/placeholder.svg";

  // Badge unique en haut à gauche : rupture > promo (remise) > badge produit.
  const badge = isOutOfStock
    ? { label: "Rupture", variant: "out" as const }
    : product.old_price
      ? { label: `-${discountPercent(product.price, product.old_price)}%`, variant: "promo" as const }
      : product.badge
        ? { label: product.badge, variant: product.badge === "Promo" ? ("promo" as const) : ("soft" as const) }
        : null;

  const whatsappText = `Bonjour, je suis intéressé par : ${product.name} (${formatPrice(product.price)} FCFA)`;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Image */}
      {/* Mobile : pleine largeur + simple trait de séparation (image maximisée).
          ≥ sm : cadre complet avec léger retrait. */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl border-b bg-muted/40 transition-colors group-hover:bg-muted sm:m-3 sm:mb-0 sm:rounded-lg sm:border">
        <Image
          src={image}
          alt={product.name}
          fill
          className={cn(
            "object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105",
            isOutOfStock && "opacity-60 grayscale"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {badge ? (
          <span
            className={cn(
              "absolute left-1.5 top-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:left-3 sm:top-3",
              badge.variant === "promo" && "bg-primary text-primary-foreground",
              badge.variant === "out" && "border border-red-300 bg-background text-red-700",
              badge.variant === "soft" && "border bg-background text-foreground"
            )}
          >
            {badge.label}
          </span>
        ) : null}

        <button
          type="button"
          aria-label="Ajouter aux favoris"
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-background/80 backdrop-blur-sm transition-transform hover:scale-110 sm:right-3 sm:top-3"
        >
          <Heart className={cn("size-4", liked ? "fill-primary text-primary" : "text-foreground")} />
        </button>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {product.brand}
          </p>
          {isLowStock ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-600">
              <span className="size-1.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
              Plus que {product.stock}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {product.name}
        </h3>

        {product.rating != null || product.colors.length > 0 ? (
          <div className="flex items-center justify-between gap-2">
            {product.rating != null ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-foreground text-foreground" />
                <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
                <span className="font-mono text-[11px]">({formatPrice(product.reviews)})</span>
              </span>
            ) : (
              <span />
            )}
            {product.colors.length > 0 ? (
              <span className="flex gap-1.5">
                {product.colors.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={i === colorIdx}
                    onClick={(e) => {
                      e.preventDefault();
                      setColorIdx(i);
                    }}
                    className="size-3.5 rounded-full border transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.hex,
                      borderColor: i === colorIdx ? "var(--primary)" : "rgba(0,0,0,0.15)",
                      boxShadow: i === colorIdx ? "0 0 0 2px var(--card) inset" : undefined,
                    }}
                  />
                ))}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Prix + actions (prix au-dessus pour absorber les montants FCFA longs) */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-base font-bold tracking-tight",
                isOutOfStock && "text-muted-foreground"
              )}
            >
              {formatPrice(product.price)} FCFA
            </span>
            {product.old_price ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {isOutOfStock ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="flex-1 rounded-full"
                onClick={(e) => e.preventDefault()}
              >
                Me prévenir
              </Button>
            ) : (
              <Button
                size="sm"
                aria-label="Ajouter au panier"
                className="flex-1 rounded-full"
                onClick={(e) => {
                  e.preventDefault();
                  addItem({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    image,
                  });
                }}
              >
                Ajouter
              </Button>
            )}

            <button
              type="button"
              aria-label="Demander sur WhatsApp"
              title="Demander sur WhatsApp"
              onClick={(e) => {
                e.preventDefault();
                window.open(whatsappHref, "_blank", "noopener,noreferrer");
              }}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1ebd5a]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
