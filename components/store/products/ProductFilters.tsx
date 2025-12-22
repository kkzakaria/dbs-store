"use client"

import { useCallback } from "react"
import { useQueryState, parseAsString, parseAsInteger } from "nuqs"
import { SlidersHorizontal, X, Tag, Building2, Coins, ArrowUpDown } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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

  // Count active filters
  const activeFilterCount = [
    category,
    brand,
    minPrice > 0,
    maxPrice > 0,
  ].filter(Boolean).length

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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <Tag className="size-4" />
          </div>
          <Label htmlFor="category" className="font-semibold">Catégorie</Label>
        </div>
        <Select
          value={category || "all"}
          onValueChange={(value) => setCategory(value === "all" ? null : value)}
        >
          <SelectTrigger
            id="category"
            className="rounded-xl border-border/50 focus:border-primary"
          >
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </div>
            <Label htmlFor="brand" className="font-semibold">Marque</Label>
          </div>
          <Select
            value={brand || "all"}
            onValueChange={(value) => setBrand(value === "all" ? null : value)}
          >
            <SelectTrigger
              id="brand"
              className="rounded-xl border-border/50 focus:border-primary"
            >
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
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

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <Coins className="size-4" />
          </div>
          <Label className="font-semibold">Prix (FCFA)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice || ""}
            onChange={(e) =>
              setMinPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="rounded-xl border-border/50 focus:border-primary"
          />
          <span className="text-muted-foreground font-medium">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice || ""}
            onChange={(e) =>
              setMaxPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="rounded-xl border-border/50 focus:border-primary"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Sort */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <ArrowUpDown className="size-4" />
          </div>
          <Label htmlFor="sort" className="font-semibold">Trier par</Label>
        </div>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortOption)}
        >
          <SelectTrigger
            id="sort"
            className="rounded-xl border-border/50 focus:border-primary"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <Button
            variant="outline"
            className={cn(
              "w-full rounded-xl",
              "border-destructive/30 text-destructive",
              "hover:bg-destructive/10 hover:border-destructive"
            )}
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
    <div className={cn("flex items-center gap-3", className)}>
      {/* Mobile Filter Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "lg:hidden rounded-xl",
              "border-border/50 hover:border-primary/50",
              "transition-all duration-300"
            )}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <Badge
                className={cn(
                  "ml-2 h-5 px-1.5",
                  "bg-gradient-primary text-white border-0"
                )}
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn(
            "w-80 p-0",
            "bg-background/95 backdrop-blur-xl"
          )}
        >
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="text-lg font-bold font-display">Filtres</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sort Select (always visible) */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort-desktop" className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap">
          Trier par:
        </Label>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortOption)}
        >
          <SelectTrigger
            id="sort-desktop"
            className={cn(
              "w-[180px] rounded-xl",
              "border-border/50 hover:border-primary/50",
              "transition-all duration-300"
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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

  const activeFilterCount = [
    category,
    brand,
    minPrice > 0,
    maxPrice > 0,
  ].filter(Boolean).length

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
    <aside
      className={cn(
        "p-5 rounded-2xl",
        "bg-card/80 backdrop-blur-sm",
        "border border-border/50",
        "space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-primary" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge className="bg-gradient-primary text-white border-0">
              {activeFilterCount}
            </Badge>
          )}
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="mr-1 h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Category Filter */}
      <div className="space-y-3">
        <Label htmlFor="sidebar-category" className="text-sm font-semibold flex items-center gap-2">
          <Tag className="size-4 text-primary" />
          Catégorie
        </Label>
        <Select
          value={category || "all"}
          onValueChange={(value) => setCategory(value === "all" ? null : value)}
        >
          <SelectTrigger
            id="sidebar-category"
            className="rounded-xl border-border/50 focus:border-primary"
          >
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
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
        <div className="space-y-3">
          <Label htmlFor="sidebar-brand" className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            Marque
          </Label>
          <Select
            value={brand || "all"}
            onValueChange={(value) => setBrand(value === "all" ? null : value)}
          >
            <SelectTrigger
              id="sidebar-brand"
              className="rounded-xl border-border/50 focus:border-primary"
            >
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
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

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          Prix (FCFA)
        </Label>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Prix minimum"
            value={minPrice || ""}
            onChange={(e) =>
              setMinPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="rounded-xl border-border/50 focus:border-primary"
          />
          <Input
            type="number"
            placeholder="Prix maximum"
            value={maxPrice || ""}
            onChange={(e) =>
              setMaxPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="rounded-xl border-border/50 focus:border-primary"
          />
        </div>
      </div>
    </aside>
  )
}
