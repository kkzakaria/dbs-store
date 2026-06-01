"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfilAvatar } from "@/components/compte/profil-avatar";
import { uploadAvatarImage } from "@/lib/actions/avatar-upload";
import { updateUser } from "@/lib/auth-client";

interface AvatarUploadProps {
  name: string;
  image: string | null;
}

export function AvatarUpload({ name, image }: AvatarUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { path, error } = await uploadAvatarImage(fd);
      if (error || !path) throw new Error(error ?? "Échec de l'upload de l'avatar.");
      const updated = await updateUser({ image: path });
      if (updated.error) throw new Error(updated.error.message ?? "Mise à jour échouée");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload de l'avatar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Changer la photo de profil"
      >
        <ProfilAvatar name={name} image={image} className="size-20 text-2xl" />
        <span className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity",
          uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
