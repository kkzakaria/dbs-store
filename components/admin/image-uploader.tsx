"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadProductImage } from "@/lib/actions/admin-upload";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const uploaded: string[] = [];
    const failedFiles: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadProductImage(fd);
        if ("error" in result) throw new Error(result.error);
        uploaded.push(result.path);
      } catch (err) {
        // Conserve la raison par fichier (type/taille/serveur), pas seulement le nom.
        const reason = err instanceof Error ? err.message : "erreur inconnue";
        failedFiles.push(`${file.name} (${reason})`);
        console.error("[ImageUploader] handleFiles:", err);
      }
    }

    if (failedFiles.length > 0) {
      setError(`Échec de l'upload : ${failedFiles.join(", ")}`);
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
  }

  function removeImage(url: string) {
    onChange(images.filter((img) => img !== url));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative h-24 w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-full w-full rounded-md border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-1 -top-1 size-5"
              onClick={() => removeImage(url)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-muted/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Glisser des images ou{" "}
              <span className="text-primary underline">parcourir</span>
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
