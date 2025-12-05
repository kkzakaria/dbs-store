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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery - Desktop: vertical thumbnails, Mobile: horizontal */}
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

      {/* Product Info */}
      <div className="space-y-6">
        {/* Category Link */}
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-muted-foreground hover:text-primary transition-colors text-sm inline-block"
          >
            {product.category.name}
          </Link>
        )}

        {/* Name */}
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {product.name}
        </h1>

        {/* Description */}
        {product.description && (
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-end gap-3">
          <PriceDisplay
            price={currentPrice}
            comparePrice={currentComparePrice}
            size="lg"
          />
          {hasVariants && !selectedVariant && (
            <span className="text-sm text-muted-foreground mb-1">
              A partir de
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOutOfStock ? (
            <Badge variant="destructive">Rupture de stock</Badge>
          ) : isLowStock ? (
            <Badge variant="outline" className="border-orange-500 text-orange-500">
              Plus que {currentStock} en stock - Faites vite !
            </Badge>
          ) : (
            <Badge variant="outline" className="border-green-500 text-green-500">
              En stock
            </Badge>
          )}
          {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
          {product.is_featured && (
            <Badge className="bg-accent text-accent-foreground">Vedette</Badge>
          )}
        </div>

        {/* Variant Selector */}
        {hasVariants && (
          <>
            <Separator />
            <VariantSelector
              options={options}
              variants={variants}
              selectedOptions={selectedOptions}
              onSelectOption={handleSelectOption}
              selectedVariant={selectedVariant}
            />
          </>
        )}

        <Separator />

        {/* Add to Cart */}
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

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Truck className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Livraison rapide</p>
              <p className="text-muted-foreground text-xs">24-48h Abidjan</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Shield className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Paiement securise</p>
              <p className="text-muted-foreground text-xs">Mobile Money</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <RotateCcw className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Retour facile</p>
              <p className="text-muted-foreground text-xs">Sous 7 jours</p>
            </div>
          </div>
        </div>

        {/* SKU */}
        {currentSku && (
          <p className="text-xs text-muted-foreground pt-2">
            Reference: {currentSku}
          </p>
        )}
      </div>
    </div>
  )
}
