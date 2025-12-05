"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Upload, X, Star, Loader2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { uploadProductImage, deleteProductImage, setPrimaryImage } from "@/actions/admin/upload"
import { toast } from "sonner"

interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number | null
  is_primary: boolean | null
}

interface ProductImageUploadProps {
  productId?: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  maxImages?: number
}

export function ProductImageUpload({
  productId,
  images,
  onImagesChange,
  maxImages = 10,
}: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        toast.error(`Maximum ${maxImages} images autorisees`)
        return
      }

      setIsUploading(true)

      for (const file of acceptedFiles) {
        const fileId = `${Date.now()}-${Math.random()}`
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

        try {
          const formData = new FormData()
          formData.append("file", file)
          if (productId) {
            formData.append("productId", productId)
          }

          setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }))

          const result = await uploadProductImage(formData)

          if (result.error) {
            toast.error(result.error)
          } else if (result.success && result.url) {
            const newImage: ProductImage = {
              id: result.imageId || fileId,
              url: result.url,
              alt: file.name.replace(/\.[^/.]+$/, ""),
              position: images.length,
              is_primary: images.length === 0,
            }
            onImagesChange([...images, newImage])
            toast.success("Image uploadee")
          }

          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }))
        } catch (error) {
          console.error("Upload error:", error)
          toast.error("Erreur lors de l'upload")
        } finally {
          setUploadProgress((prev) => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }
      }

      setIsUploading(false)
    },
    [images, maxImages, onImagesChange, productId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    disabled: isUploading,
  })

  const handleDelete = async (image: ProductImage) => {
    if (productId && image.id && !image.id.includes("-")) {
      // Real image from database
      const result = await deleteProductImage({ imageId: image.id })
      if (result?.data?.error) {
        toast.error(result.data.error)
        return
      }
    }

    // Remove from local state
    const newImages = images.filter((img) => img.id !== image.id)

    // If deleted image was primary, make first remaining image primary
    if (image.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }

    onImagesChange(newImages)
    toast.success("Image supprimee")
  }

  const handleSetPrimary = async (image: ProductImage) => {
    if (productId && image.id && !image.id.includes("-")) {
      const result = await setPrimaryImage({ productId, imageId: image.id })
      if (result?.data?.error) {
        toast.error(result.data.error)
        return
      }
    }

    // Update local state
    const newImages = images.map((img) => ({
      ...img,
      is_primary: img.id === image.id,
    }))
    onImagesChange(newImages)
    toast.success("Image principale definie")
  }

  const isUploadingAny = isUploading || Object.keys(uploadProgress).length > 0

  return (
    <div className="space-y-4">
      <Label>Images du produit</Label>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploadingAny && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploadingAny ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            {isDragActive ? (
              <p className="text-sm font-medium">Deposez les images ici</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Glissez-deposez ou cliquez pour ajouter
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP. Maximum 5MB par image.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                image.is_primary && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                fill
                className="object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSetPrimary(image)}
                  disabled={image.is_primary || false}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      image.is_primary && "fill-amber-500 text-amber-500"
                    )}
                  />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(image)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Principale
                </div>
              )}

              {/* Position indicator */}
              <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {images.length} / {maxImages} images.
        {images.length > 0 && " Cliquez sur l'etoile pour definir l'image principale."}
      </p>
    </div>
  )
}
