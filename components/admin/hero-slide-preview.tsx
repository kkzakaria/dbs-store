import { cn } from "@/lib/utils";
import type { TextAlign } from "@/lib/db/schema";

interface HeroSlidePreviewProps {
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  textAlign: TextAlign;
  overlayColor: string;
  overlayOpacity: number;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
}

// Mêmes mappings que HeroCarousel pour un rendu fidèle (WYSIWYG).
const ALIGN_CLASSES: Record<TextAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

const CTA_JUSTIFY: Record<TextAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export function HeroSlidePreview({
  title,
  subtitle,
  badge,
  imageUrl,
  textAlign,
  overlayColor,
  overlayOpacity,
  ctaPrimaryLabel,
  ctaSecondaryLabel,
}: HeroSlidePreviewProps) {
  const hasCta = Boolean(ctaPrimaryLabel) || Boolean(ctaSecondaryLabel);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Aperçu
      </p>
      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-lg border bg-muted">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Aperçu de la bannière" className="absolute inset-0 size-full object-cover" />
            <div
              data-testid="preview-overlay"
              className="absolute inset-0"
              style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Aucune image</span>
          </div>
        )}

        <div
          data-testid="preview-content"
          className={cn(
            "relative z-10 flex h-full flex-col justify-center px-6",
            ALIGN_CLASSES[textAlign]
          )}
        >
          <div className="max-w-md">
            {badge ? (
              <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {badge}
              </span>
            ) : null}
            <p className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {title || "Titre de la bannière"}
            </p>
            {subtitle ? (
              <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
            ) : null}
            {hasCta ? (
              <div className={cn("mt-4 flex flex-wrap gap-2", CTA_JUSTIFY[textAlign])}>
                {ctaPrimaryLabel ? (
                  <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    {ctaPrimaryLabel}
                  </span>
                ) : null}
                {ctaSecondaryLabel ? (
                  <span className="rounded-md border border-white px-3 py-1.5 text-xs font-medium text-white">
                    {ctaSecondaryLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
