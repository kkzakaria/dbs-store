"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { searchSuggestions } from "@/lib/actions/search";
import { formatPrice } from "@/lib/utils";
import type { ProductSuggestion } from "@/lib/data/products";

type SearchOverlayProps = {
  onClose: () => void;
};

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTrapRef = useFocusTrap();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchSuggestions(value);
      setSuggestions(results);
      setSelectedIndex(-1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  }

  function navigateToSearch() {
    if (!query.trim()) return;
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
    onCloseRef.current();
  }

  function navigateToProduct(slug: string) {
    router.push(`/produits/${slug}`);
    onCloseRef.current();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigateToProduct(suggestions[selectedIndex].slug);
      } else {
        navigateToSearch();
      }
    }
  }

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Recherche">
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-x-0 top-0 z-50 bg-background shadow-sm">
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-4 px-4 lg:px-6">
          <Image src="/images/dbs-store-logo.png" alt="DBS Store" width={70} height={32} />

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher des produits..."
              className="w-full rounded-full bg-muted px-5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="search-suggestions"
              aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
            />

            {isLoading ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : null}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer la recherche">
            <X className="size-5" />
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 ? (
          <ul
            id="search-suggestions"
            role="listbox"
            className="mx-auto max-w-7xl border-t px-4 py-2 lg:px-6"
          >
            {suggestions.map((item, index) => (
              <li
                key={item.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                }`}
                onClick={() => navigateToProduct(item.slug)}
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.brand}</span>
                <span className="ml-auto font-semibold">{formatPrice(item.price)} FCFA</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
