"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { uploadBannerImage } from "@/lib/actions/admin-upload";
import { HeroSlidePreview } from "@/components/admin/hero-slide-preview";
// isRedirectError n'est pas exporté depuis next/navigation en Next.js 16 — import interne nécessaire.
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { HeroSlide, TextAlign } from "@/lib/db/schema";
import type { HeroSlideFormData } from "@/lib/actions/admin-hero";

interface HeroSlideFormProps {
  initial?: HeroSlide;
  action: (data: HeroSlideFormData) => Promise<{ error?: string }>;
  submitLabel: string;
}

const TEXT_ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Droite" },
];

export function HeroSlideForm({ initial, action, submitLabel }: HeroSlideFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  // URL https publique persistée (envoyée au serveur).
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  // Aperçu local instantané (blob://) affiché pendant l'upload, sinon imageUrl.
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.image_url ?? null);
  const [textAlign, setTextAlign] = useState<TextAlign>(initial?.text_align ?? "center");
  const [overlayColor, setOverlayColor] = useState(initial?.overlay_color ?? "#000000");
  const [overlayOpacity, setOverlayOpacity] = useState(initial?.overlay_opacity ?? 40);
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(initial?.cta_primary_label ?? "");
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(initial?.cta_primary_href ?? "");
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(initial?.cta_secondary_label ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(initial?.cta_secondary_href ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Libère le dernier blob d'aperçu au démontage pour éviter une fuite mémoire.
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  function revokeBlob() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aperçu instantané via blob, le temps que l'upload se fasse.
    revokeBlob();
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);

    setUploading(true);
    setServerError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { path, error } = await uploadBannerImage(fd);
      if (error || !path) throw new Error(error ?? "Échec de l'upload de l'image");
      setImageUrl(path);
      setPreviewUrl(path);
      revokeBlob();
    } catch (err) {
      console.error("[HeroSlideForm] handleFileUpload:", err);
      setServerError(err instanceof Error ? err.message : "Échec de l'upload de l'image");
      // Annule l'aperçu blob : aucune image valide n'a été uploadée.
      revokeBlob();
      setPreviewUrl(imageUrl || null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);

    const data: HeroSlideFormData = {
      title,
      subtitle: subtitle || undefined,
      badge: badge || undefined,
      image_url: imageUrl,
      text_align: textAlign,
      overlay_color: overlayColor,
      overlay_opacity: overlayOpacity,
      cta_primary_label: ctaPrimaryLabel || undefined,
      cta_primary_href: ctaPrimaryHref || undefined,
      cta_secondary_label: ctaSecondaryLabel || undefined,
      cta_secondary_href: ctaSecondaryHref || undefined,
      is_active: isActive,
    };

    try {
      const result = await action(data);
      if (result?.error) {
        setServerError(result.error);
      }
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      console.error("[HeroSlideForm] handleSubmit:", err);
      setServerError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Aperçu live (sticky) */}
      <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-2 pt-1 backdrop-blur">
        <HeroSlidePreview
          title={title}
          subtitle={subtitle}
          badge={badge}
          imageUrl={previewUrl ?? undefined}
          textAlign={textAlign}
          overlayColor={overlayColor}
          overlayOpacity={overlayOpacity}
          ctaPrimaryLabel={ctaPrimaryLabel}
          ctaSecondaryLabel={ctaSecondaryLabel}
        />
      </div>

      {/* Titre */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Ex: iPhone 16 Pro — La révolution"
        />
      </div>

      {/* Sous-titre */}
      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Sous-titre</Label>
        <Textarea
          id="subtitle"
          value={subtitle ?? ""}
          onChange={(e) => setSubtitle(e.target.value)}
          rows={2}
          placeholder="Description courte affichée sous le titre"
        />
      </div>

      {/* Badge */}
      <div className="space-y-1.5">
        <Label htmlFor="badge">Badge (optionnel)</Label>
        <Input
          id="badge"
          value={badge ?? ""}
          onChange={(e) => setBadge(e.target.value)}
          placeholder="Ex: Promo -20%, Nouveau, Exclusif"
        />
      </div>

      {/* Image */}
      <div className="space-y-2">
        <Label>Image *</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 size-4" />
            )}
            {previewUrl ? "Changer l'image" : "Ajouter une image"}
          </Button>
          {uploading ? (
            <span className="text-xs text-muted-foreground">Envoi en cours…</span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP. L&apos;image est uploadée puis affichée dans l&apos;aperçu ci-dessus.
        </p>
      </div>

      {/* Position du texte */}
      <div className="space-y-1.5">
        <Label>Position du texte</Label>
        <div className="flex gap-2">
          {TEXT_ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTextAlign(opt.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                textAlign === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div className="space-y-2">
        <Label>Overlay</Label>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="overlayColor" className="text-xs text-muted-foreground">
              Couleur
            </Label>
            <input
              id="overlayColor"
              type="color"
              value={overlayColor}
              onChange={(e) => setOverlayColor(e.target.value)}
              className="size-8 cursor-pointer rounded border"
            />
            <span className="text-xs text-muted-foreground">{overlayColor}</span>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <Label htmlFor="overlayOpacity" className="whitespace-nowrap text-xs text-muted-foreground">
              Opacité {overlayOpacity}%
            </Label>
            <input
              id="overlayOpacity"
              type="range"
              min={0}
              max={100}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* CTA primaire */}
      <div className="space-y-2">
        <Label>Bouton principal (CTA primaire)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={ctaPrimaryLabel ?? ""}
            onChange={(e) => setCtaPrimaryLabel(e.target.value)}
            placeholder="Texte du bouton"
          />
          <Input
            value={ctaPrimaryHref ?? ""}
            onChange={(e) => setCtaPrimaryHref(e.target.value)}
            placeholder="/smartphones"
          />
        </div>
      </div>

      {/* CTA secondaire */}
      <div className="space-y-2">
        <Label>Bouton secondaire (optionnel)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={ctaSecondaryLabel ?? ""}
            onChange={(e) => setCtaSecondaryLabel(e.target.value)}
            placeholder="Texte du bouton"
          />
          <Input
            value={ctaSecondaryHref ?? ""}
            onChange={(e) => setCtaSecondaryHref(e.target.value)}
            placeholder="/offres"
          />
        </div>
      </div>

      {/* Statut */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 cursor-pointer"
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Bannière active (visible sur le site)
        </Label>
      </div>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
