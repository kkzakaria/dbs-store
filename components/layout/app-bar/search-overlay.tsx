"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search bar replacing AppBar */}
      <div className="fixed inset-x-0 top-0 z-50 bg-background shadow-sm">
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-4 px-4 lg:px-6">
          <span className="text-xl font-bold">DBS</span>

          <div className="flex-1">
            <input
              ref={inputRef}
              type="search"
              placeholder="Rechercher des produits..."
              className="w-full rounded-full bg-muted px-5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer la recherche">
            <X className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
