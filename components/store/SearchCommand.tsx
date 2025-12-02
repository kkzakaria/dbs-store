"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { Search, Package, FolderOpen, TrendingUp, Loader2 } from "lucide-react"
import { searchProducts } from "@/actions/products"
import { formatPrice } from "./products/PriceDisplay"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Categories (could be fetched from API)
const categories = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Ordinateurs", slug: "ordinateurs" },
  { name: "Accessoires", slug: "accessoires" },
  { name: "Audio", slug: "audio" },
  { name: "Tablettes", slug: "tablettes" },
]

// Popular searches (could be dynamic based on analytics)
const popularSearches = [
  "iPhone 15",
  "Samsung Galaxy",
  "MacBook Pro",
  "AirPods",
  "Sony WH-1000XM5",
]

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  brand: string | null
  image: { url: string; alt: string | null } | null
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

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

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  const handleSelect = (value: string) => {
    onOpenChange(false)
    setQuery("")
    router.push(value)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onOpenChange(false)
      router.push(`/products?search=${encodeURIComponent(query.trim())}`)
      setQuery("")
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Recherche"
      description="Recherchez des produits, catégories ou marques"
    >
      <CommandInput
        placeholder="Rechercher des produits..."
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            handleSearch()
          }
        }}
      />
      <CommandList>
        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isSearching && query.trim().length >= 2 && results.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="size-8 text-muted-foreground" />
              <p>Aucun résultat pour "{query}"</p>
              <button
                onClick={handleSearch}
                className="text-sm text-primary hover:underline"
              >
                Voir tous les résultats
              </button>
            </div>
          </CommandEmpty>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && (
          <>
            <CommandGroup heading="Produits">
              {results.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(`/products/${product.slug}`)}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {product.image?.url ? (
                      <Image
                        src={product.image.url}
                        alt={product.image.alt || product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <Package className="h-full w-full p-2 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-primary">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup>
              <CommandItem value={`search-all-${query}`} onSelect={handleSearch}>
                <Search className="text-muted-foreground" />
                <span>Voir tous les résultats pour "{query}"</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Default State (no query) */}
        {!query && (
          <>
            <CommandGroup heading="Recherches populaires">
              {popularSearches.map((search) => (
                <CommandItem
                  key={search}
                  value={search}
                  onSelect={() =>
                    handleSelect(`/products?search=${encodeURIComponent(search)}`)
                  }
                >
                  <TrendingUp className="text-muted-foreground" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Catégories">
              {categories.map((category) => (
                <CommandItem
                  key={category.slug}
                  value={category.name}
                  onSelect={() =>
                    handleSelect(`/categories/${category.slug}`)
                  }
                >
                  <FolderOpen className="text-muted-foreground" />
                  <span>{category.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Typing but not enough characters */}
        {query && query.trim().length < 2 && !isSearching && (
          <CommandEmpty>
            <p className="text-muted-foreground">
              Tapez au moins 2 caractères pour rechercher...
            </p>
          </CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  )
}
