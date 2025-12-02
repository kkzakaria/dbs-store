"use client"

import { useCallback } from "react"
import { useQueryState, parseAsString, parseAsInteger } from "nuqs"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { sortLabels, type SortOption } from "@/lib/validations/product"

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
  brands: string[]
  className?: string
}

export function ProductFilters({
  categories,
  brands,
  className,
}: ProductFiltersProps) {
  // URL state with nuqs
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("")
  )
  const [brand, setBrand] = useQueryState(
    "brand",
    parseAsString.withDefault("")
  )
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsInteger.withDefault(0)
  )
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsInteger.withDefault(0)
  )
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("newest")
  )

  // Check if any filters are active
  const hasActiveFilters =
    category || brand || minPrice > 0 || maxPrice > 0 || sort !== "newest"

  // Clear all filters
  const clearFilters = useCallback(async () => {
    await Promise.all([
      setCategory(null),
      setBrand(null),
      setMinPrice(null),
      setMaxPrice(null),
      setSort(null),
    ])
  }, [setCategory, setBrand, setMinPrice, setMaxPrice, setSort])

  // Filter content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select
          value={category || "all"}
          onValueChange={(value) => setCategory(value === "all" ? null : value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="brand">Marque</Label>
          <Select
            value={brand || "all"}
            onValueChange={(value) => setBrand(value === "all" ? null : value)}
          >
            <SelectTrigger id="brand">
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <Label>Prix (FCFA)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice || ""}
            onChange={(e) =>
              setMinPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="w-full"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice || ""}
            onChange={(e) =>
              setMaxPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-2">
        <Label htmlFor="sort">Trier par</Label>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortOption)}
        >
          <SelectTrigger id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Effacer les filtres
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Mobile Filter Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="lg:hidden">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                !
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sort Select (always visible) */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort-desktop" className="hidden sm:block text-sm whitespace-nowrap">
          Trier par:
        </Label>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortOption)}
        >
          <SelectTrigger id="sort-desktop" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Desktop Sidebar Filters Component
export function ProductFiltersSidebar({
  categories,
  brands,
  className,
}: ProductFiltersProps) {
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withDefault("")
  )
  const [brand, setBrand] = useQueryState(
    "brand",
    parseAsString.withDefault("")
  )
  const [minPrice, setMinPrice] = useQueryState(
    "minPrice",
    parseAsInteger.withDefault(0)
  )
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsInteger.withDefault(0)
  )
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("newest")
  )

  const hasActiveFilters =
    category || brand || minPrice > 0 || maxPrice > 0 || sort !== "newest"

  const clearFilters = useCallback(async () => {
    await Promise.all([
      setCategory(null),
      setBrand(null),
      setMinPrice(null),
      setMaxPrice(null),
      setSort(null),
    ])
  }, [setCategory, setBrand, setMinPrice, setMaxPrice, setSort])

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtres</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="mr-1 h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label htmlFor="sidebar-category">Catégorie</Label>
        <Select
          value={category || "all"}
          onValueChange={(value) => setCategory(value === "all" ? null : value)}
        >
          <SelectTrigger id="sidebar-category">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand Filter */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="sidebar-brand">Marque</Label>
          <Select
            value={brand || "all"}
            onValueChange={(value) => setBrand(value === "all" ? null : value)}
          >
            <SelectTrigger id="sidebar-brand">
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <Label>Prix (FCFA)</Label>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Prix minimum"
            value={minPrice || ""}
            onChange={(e) =>
              setMinPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
          />
          <Input
            type="number"
            placeholder="Prix maximum"
            value={maxPrice || ""}
            onChange={(e) =>
              setMaxPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
          />
        </div>
      </div>
    </aside>
  )
}
