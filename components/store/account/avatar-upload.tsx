"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { uploadAvatar, deleteAvatar } from "@/actions/upload"
import { toast } from "sonner"
import { Camera, Trash2, Upload, X } from "lucide-react"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  fullName?: string | null
  onUploadComplete?: (url: string) => void
  onDeleteComplete?: () => void
}

export function AvatarUpload({
  currentAvatarUrl,
  fullName,
  onUploadComplete,
  onDeleteComplete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Upload
      setIsUploading(true)
      setUploadProgress(0)

      // Simulate progress (since we don't have real progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const result = await uploadAvatar(formData)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (result.error) {
          toast.error(result.error)
          setPreview(null)
        } else if (result.success && result.url) {
          toast.success("Avatar mis à jour avec succès")
          onUploadComplete?.(result.url)
        }
      } catch {
        clearInterval(progressInterval)
        toast.error("Une erreur est survenue")
        setPreview(null)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
        URL.revokeObjectURL(objectUrl)
      }
    },
    [onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const handleDelete = async () => {
    if (!currentAvatarUrl) return

    setIsDeleting(true)
    try {
      const result = await deleteAvatar()

      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success("Avatar supprimé")
        onDeleteComplete?.()
      }
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
  }

  const displayUrl = preview || currentAvatarUrl

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-full transition-all",
          isDragActive && "ring-4 ring-primary ring-offset-2"
        )}
      >
        <input {...getInputProps()} />
        <Avatar className="size-24 border-2 border-muted">
          <AvatarImage src={displayUrl || undefined} alt={fullName || "Avatar"} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay when dragging */}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/80">
            <Upload className="size-8 text-primary-foreground" />
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
            <div className="w-16">
              <Progress value={uploadProgress} className="h-1" />
            </div>
          </div>
        )}

        {/* Preview cancel button */}
        {preview && !isUploading && (
          <button
            onClick={cancelPreview}
            className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={open}
          disabled={isUploading || isDeleting}
        >
          <Camera className="mr-2 size-4" />
          {currentAvatarUrl ? "Changer" : "Ajouter"}
        </Button>

        {currentAvatarUrl && !preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </Button>
        )}
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-muted-foreground">
        Glissez-déposez une image ou cliquez pour sélectionner.
        <br />
        JPG, PNG ou WebP. Max 2MB.
      </p>
    </div>
  )
}
