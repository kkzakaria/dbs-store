"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Truck, RotateCcw } from "lucide-react"
import {
  ProductGallery,
  ProductGalleryHorizontal,
  PriceDisplay,
} from "@/components/store/products"
import { VariantSelector } from "@/components/store/products/VariantSelector"
import { AddToCartButton } from "./AddToCartButton"

interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number | null
  is_primary: boolean | null
  variant_id?: string | null
}

interface ProductOption {
  id: string
  name: string
  values: unknown
  position: number | null
}

interface ProductVariant {
  id: string
  sku: string
  price: number
  compare_price: number | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  options: unknown
  position: number | null
  is_active: boolean | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_price: number | null
  brand: string | null
  sku: string | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  is_featured: boolean | null
  has_variants: boolean | null
  category: Category | null
  images: ProductImage[]
  options?: ProductOption[]
  variants?: ProductVariant[]
}

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const hasVariants = product.has_variants === true && (product.variants?.length ?? 0) > 0
  const options = product.options || []
  const variants = product.variants || []

  // Parse options to get their string[] values
  const parsedOptions = useMemo(() => {
    return options.map((opt) => ({
      ...opt,
      values: Array.isArray(opt.values) ? (opt.values as string[]) : [],
    }))
  }, [options])

  // Initialize selected options (pre-select first value of each option)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const opt of parsedOptions) {
      if (opt.values.length > 0) {
        initial[opt.name] = opt.values[0]
      }
    }
    return initial
  })

  // Find matching variant based on selected options
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null

    for (const variant of variants) {
      const variantOptions =
        typeof variant.options === "object" && variant.options !== null
          ? (variant.options as Record<string, string>)
          : {}

      // Check if all selected options match
      let matches = true
      for (const [key, value] of Object.entries(selectedOptions)) {
        if (variantOptions[key] !== value) {
          matches = false
          break
        }
      }

      if (matches) return variant
    }

    return null
  }, [hasVariants, variants, selectedOptions])

  // Determine current price, stock, etc. based on variant or product
  const currentPrice = selectedVariant?.price ?? product.price
  const currentComparePrice = selectedVariant?.compare_price ?? product.compare_price
  const currentStock = selectedVariant?.stock_quantity ?? product.stock_quantity ?? 0
  const currentSku = selectedVariant?.sku ?? product.sku
  const lowStockThreshold = selectedVariant?.low_stock_threshold ?? product.low_stock_threshold ?? 5

  const isOutOfStock = currentStock <= 0
  const isLowStock = currentStock > 0 && currentStock <= lowStockThreshold

  // Filter images for selected variant (or show all if no variant)
  const displayImages = useMemo(() => {
    if (!hasVariants || !selectedVariant) {
      // Show all product-level images (no variant_id)
      return product.images.filter((img) => !img.variant_id)
    }

    // Show variant-specific images + product-level images
    const variantImages = product.images.filter(
      (img) => img.variant_id === selectedVariant.id
    )
    const productImages = product.images.filter((img) => !img.variant_id)

    // Prefer variant images, fall back to product images
    return variantImages.length > 0 ? variantImages : productImages
  }, [hasVariants, selectedVariant, product.images])

  // Handle option selection
  const handleSelectOption = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }))
  }

  // Requires variant selection if has_variants but no variant selected
  const requiresVariant = hasVariants && !selectedVariant


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
      {/* Gallery - Desktop: vertical thumbnails, Mobile: horizontal */}
      <div className="space-y-6">
        <div className="hidden md:block">
          <ProductGallery
            images={displayImages.length > 0 ? displayImages : product.images}
            productName={product.name}
          />
        </div>
        <div className="md:hidden">
          <ProductGalleryHorizontal
            images={displayImages.length > 0 ? displayImages : product.images}
            productName={product.name}
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-16 lg:sticky lg:top-32 h-fit">
        <div className="space-y-8">
          {/* Brand/Category */}
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
            {product.brand && <span>{product.brand}</span>}
            {product.brand && product.category && <span className="text-border">•</span>}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:underline"
              >
                {product.category.name}
              </Link>
            )}
          </div>
 
          {/* Name */}
          <h1 className="text-4xl lg:text-6xl font-display font-bold leading-[1.1] text-foreground">
            {product.name}
          </h1>
 
          {/* Price */}
          <div className="flex items-baseline gap-4 pt-4">
            <PriceDisplay
              price={currentPrice}
              comparePrice={currentComparePrice}
              size="xl"
            />
            {hasVariants && !selectedVariant && (
              <span className="text-sm font-medium text-muted-foreground">
                À partir de
              </span>
            )}
          </div>
        </div>
 
        {/* Description */}
        {product.description && (
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Présentation</h3>
            <p className="text-xl text-muted-foreground leading-relaxed font-light">
              {product.description}
            </p>
          </div>
        )}
 
        {/* Stock Status & Badges */}
        <div className="flex items-center gap-4 flex-wrap">
          {isOutOfStock ? (
            <div className="px-5 py-2.5 rounded-full border border-destructive/20 bg-destructive/5 text-destructive text-xs font-bold uppercase tracking-widest">
              Bientôt disponible
            </div>
          ) : isLowStock ? (
            <div className="px-5 py-2.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-600 text-xs font-bold uppercase tracking-widest">
              Seulement {currentStock} restants
            </div>
          ) : (
            <div className="px-5 py-2.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-600 text-xs font-bold uppercase tracking-widest">
              Disponible en stock
            </div>
          )}
          {product.is_featured && (
            <div className="px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest">
              Exclusivité DBS
            </div>
          )}
        </div>
 
        {/* Variant Selector */}
        {hasVariants && (
          <div className="pt-8">
            <VariantSelector
              options={options}
              variants={variants}
              selectedOptions={selectedOptions}
              onSelectOption={handleSelectOption}
              selectedVariant={selectedVariant}
            />
          </div>
        )}
 
        {/* Add to Cart */}
        <div className="pt-12">
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: currentPrice,
              slug: product.slug,
              image:
                displayImages[0]?.url ||
                product.images?.[0]?.url ||
                "/images/placeholder-product.png",
              stock_quantity: currentStock,
            }}
            variant={
              selectedVariant
                ? {
                    id: selectedVariant.id,
                    sku: selectedVariant.sku,
                    price: selectedVariant.price,
                    stock_quantity: selectedVariant.stock_quantity ?? 0,
                    options:
                      typeof selectedVariant.options === "object" &&
                      selectedVariant.options !== null
                        ? (selectedVariant.options as Record<string, string>)
                        : {},
                  }
                : null
            }
            isOutOfStock={isOutOfStock}
            requiresVariant={requiresVariant}
          />
        </div>
 
        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 pt-20 border-t border-border/10">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <div className="text-center sm:text-left">
              <p className="font-bold text-sm">Livraison rapide</p>
              <p className="text-muted-foreground text-xs mt-1">Gratuite dès 50.000 FCFA</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div className="text-center sm:text-left">
              <p className="font-bold text-sm">Garantie DBS</p>
              <p className="text-muted-foreground text-xs mt-1">SAV disponible 7j/7</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-start gap-3">
            <RotateCcw className="h-6 w-6 text-primary" />
            <div className="text-center sm:text-left">
              <p className="font-bold text-sm">Satisfait ou remboursé</p>
              <p className="text-muted-foreground text-xs mt-1">Retour facile sous 7 jours</p>
            </div>
          </div>
        </div>

        {/* SKU */}
        {currentSku && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest pt-4">
            SKU: {currentSku}
          </p>
        )}
      </div>
    </div>
  )
}
