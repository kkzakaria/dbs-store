"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Search, X, Package, Loader2 } from "lucide-react"
import { searchProducts } from "@/actions/products"
import { formatPrice } from "../../products/PriceDisplay"
import { useDebounce } from "@/hooks/use-debounce"

interface InlineSearchProps {
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
  isScrolled: boolean
}

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  brand: string | null
  image: { url: string; alt: string | null } | null
}

export function InlineSearch({ isExpanded, onExpandedChange, isScrolled }: InlineSearchProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300)

  // Search products when query changes
  React.useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([])
      return
    }

    const search = async () => {
      setIsSearching(true)
      try {
        const result = await searchProducts({
          query: debouncedQuery,
          limit: 5,
        })
        if (result?.data?.products) {
          setResults(result.data.products)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedQuery])

  // Focus input when expanded
  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Handle clicks outside
  React.useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onExpandedChange(false)
        setQuery("")
        setResults([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isExpanded, onExpandedChange])

  const handleSelect = (path: string) => {
    onExpandedChange(false)
    setQuery("")
    setResults([])
    router.push(path)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onExpandedChange(false)
      router.push(`/products?search=${encodeURIComponent(query.trim())}`)
      setQuery("")
      setResults([])
    }
  }

  const handleClose = () => {
    onExpandedChange(false)
    setQuery("")
    setResults([])
  }

  if (!isExpanded) {
    // Collapsed state - just the search icon button
    return (
      <button
        onClick={() => onExpandedChange(true)}
        className={cn(
          "rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center",
          isScrolled ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <Search className={cn(isScrolled ? "size-4" : "size-5")} />
        <span className="sr-only">Rechercher</span>
      </button>
    )
  }

  // Expanded state - full search overlay
  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-[60] animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Search container */}
      <div 
        ref={containerRef}
        className="fixed top-0 left-0 right-0 z-[70] animate-in slide-in-from-top duration-300"
      >
        <div className="container-google py-3 md:py-4">
          {/* Search input bar */}
          <div className="relative max-w-3xl mx-auto">
            <div className="flex items-center gap-2 md:gap-3 bg-background border border-border rounded-full px-4 md:px-6 py-2.5 md:py-3 shadow-google-md">
              <Search className="size-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    handleSearch()
                  } else if (e.key === "Escape") {
                    handleClose()
                  }
                }}
                placeholder="Rechercher sur DBS Store"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
              />
              {isSearching && (
                <Loader2 className="size-5 text-muted-foreground animate-spin flex-shrink-0" />
              )}
              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search results dropdown */}
            {(query.trim().length > 0 || results.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-google-lg max-h-[60vh] overflow-auto">
                {/* Loading State */}
                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Results */}
                {!isSearching && results.length > 0 && (
                  <div className="p-2">
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                      Produits
                    </div>
                    {results.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(`/products/${product.slug}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {product.image?.url ? (
                            <Image
                              src={product.image.url}
                              alt={product.image.alt || product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <Package className="h-full w-full p-2 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="text-sm text-primary font-semibold">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </button>
                    ))}
                    
                    <div className="border-t border-border my-2" />
                    
                    <button
                      onClick={handleSearch}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Search className="size-5 text-muted-foreground" />
                      <span>Voir tous les résultats pour "{query}"</span>
                    </button>
                  </div>
                )}

                {/* No results */}
                {!isSearching && query.trim().length >= 2 && results.length === 0 && (
                  <div className="p-8 text-center">
                    <Search className="size-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">Aucun résultat pour "{query}"</p>
                    <button
                      onClick={handleSearch}
                      className="text-sm text-primary hover:underline"
                    >
                      Voir tous les résultats
                    </button>
                  </div>
                )}

                {/* Typing but not enough characters */}
                {query.trim().length > 0 && query.trim().length < 2 && !isSearching && (
                  <div className="p-8 text-center text-muted-foreground">
                    Tapez au moins 2 caractères pour rechercher...
                  </div>
                )}
              </div>
            )}


          </div>
        </div>
      </div>
    </>
  )
}
