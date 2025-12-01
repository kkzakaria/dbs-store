"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { Search, Package, FolderOpen, TrendingUp } from "lucide-react"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Static categories for now (will be fetched in real implementation)
const categories = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Ordinateurs", slug: "ordinateurs" },
  { name: "Accessoires", slug: "accessoires" },
  { name: "Audio", slug: "audio" },
  { name: "Gaming", slug: "gaming" },
]

// Popular searches (can be dynamic based on analytics)
const popularSearches = [
  "iPhone 15",
  "Samsung Galaxy",
  "MacBook Pro",
  "AirPods",
  "PlayStation 5",
]

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")

  const handleSelect = (value: string) => {
    onOpenChange(false)
    setQuery("")
    router.push(value)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onOpenChange(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
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
        <CommandEmpty>
          {query.trim() ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="size-8 text-muted-foreground" />
              <p>Aucun résultat pour "{query}"</p>
              <button
                onClick={handleSearch}
                className="text-sm text-primary hover:underline"
              >
                Rechercher "{query}" dans tous les produits
              </button>
            </div>
          ) : (
            <p>Commencez à taper pour rechercher...</p>
          )}
        </CommandEmpty>

        {!query && (
          <>
            <CommandGroup heading="Recherches populaires">
              {popularSearches.map((search) => (
                <CommandItem
                  key={search}
                  value={search}
                  onSelect={() =>
                    handleSelect(`/search?q=${encodeURIComponent(search)}`)
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

        {query && (
          <CommandGroup heading="Actions">
            <CommandItem
              value={`search-${query}`}
              onSelect={handleSearch}
            >
              <Search className="text-muted-foreground" />
              <span>Rechercher "{query}"</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
