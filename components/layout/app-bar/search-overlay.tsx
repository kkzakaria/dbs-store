"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type SearchOverlayProps = {
  onClose: () => void;
};

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTrapRef = useFocusTrap();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Recherche">
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

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
    </div>
  );
}
