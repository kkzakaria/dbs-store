"use client";

import { useState } from "react";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateBannerPresignedUrl } from "@/lib/actions/admin-upload";
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
  const [imageMode, setImageMode] = useState<"upload" | "url">("url");

  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [textAlign, setTextAlign] = useState<TextAlign>(initial?.text_align ?? "center");
  const [overlayColor, setOverlayColor] = useState(initial?.overlay_color ?? "#000000");
  const [overlayOpacity, setOverlayOpacity] = useState(initial?.overlay_opacity ?? 40);
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(initial?.cta_primary_label ?? "");
  const [ctaPrimaryHref, setCtaPrimaryHref] = useState(initial?.cta_primary_href ?? "");
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(initial?.cta_secondary_label ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(initial?.cta_secondary_href ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setServerError(null);
    try {
      const { uploadUrl, publicUrl } = await generateBannerPresignedUrl(file.name, file.type);
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error(`Upload échoué: ${res.status}`);
      setImageUrl(publicUrl);
    } catch (err) {
      console.error("[HeroSlideForm] handleFileUpload:", err);
      setServerError(
        err instanceof Error ? err.message : "Échec de l'upload de l'image"
      );
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
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={imageMode === "url" ? "default" : "outline"}
            onClick={() => setImageMode("url")}
          >
            <LinkIcon className="mr-1.5 size-3.5" />
            URL
          </Button>
          <Button
            type="button"
            size="sm"
            variant={imageMode === "upload" ? "default" : "outline"}
            onClick={() => setImageMode("upload")}
          >
            <Upload className="mr-1.5 size-3.5" />
            Upload
          </Button>
        </div>

        {imageMode === "url" ? (
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        ) : (
          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm" />
            {uploading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
          </div>
        )}

        {/* Aperçu */}
        {imageUrl ? (
          <div className="relative h-36 w-full overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Aperçu" className="h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
            />
            <p className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
              Aperçu avec overlay
            </p>
          </div>
        ) : null}
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
