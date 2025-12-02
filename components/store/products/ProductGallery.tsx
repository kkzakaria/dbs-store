"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number | null
  is_primary: boolean | null
}

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
  className?: string
}

export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Sort images by position and ensure primary is first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary === true) return -1
    if (b.is_primary === true) return 1
    return (a.position ?? 0) - (b.position ?? 0)
  })

  const currentImage = sortedImages[selectedIndex]

  const goToPrevious = () => {
    setSelectedIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setSelectedIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    )
  }

  if (sortedImages.length === 0) {
    return (
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl bg-muted",
          className
        )}
      >
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Aucune image disponible
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={currentImage?.url || "/images/placeholder-product.png"}
          alt={currentImage?.alt || productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 lg:opacity-70"
              onClick={goToPrevious}
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 lg:opacity-70"
              onClick={goToNext}
              aria-label="Image suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                index === selectedIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`Voir image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact gallery for mobile
export function ProductGalleryMobile({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary === true) return -1
    if (b.is_primary === true) return 1
    return (a.position ?? 0) - (b.position ?? 0)
  })

  if (sortedImages.length === 0) {
    return (
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden bg-muted",
          className
        )}
      >
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Aucune image
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={sortedImages[currentIndex]?.url || "/images/placeholder-product.png"}
          alt={sortedImages[currentIndex]?.alt || productName}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Dots indicator */}
      {sortedImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-4 bg-primary"
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
