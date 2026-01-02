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
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Tag className="size-4 text-primary" />
          <Label htmlFor="category" className="font-display font-semibold text-sm uppercase tracking-wider">Catégorie</Label>
        </div>
        <Select
          value={category || "all"}
          onValueChange={(value) => setCategory(value === "all" ? null : value)}
        >
          <SelectTrigger
            id="category"
            className="h-12 rounded-2xl border-border/40 bg-white dark:bg-muted/10 focus:ring-primary/20 transition-google"
          >
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-google-lg border-border/40">
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="size-4 text-primary" />
            <Label htmlFor="brand" className="font-display font-semibold text-sm uppercase tracking-wider">Marque</Label>
          </div>
          <Select
            value={brand || "all"}
            onValueChange={(value) => setBrand(value === "all" ? null : value)}
          >
            <SelectTrigger
              id="brand"
              className="h-12 rounded-2xl border-border/40 bg-white dark:bg-muted/10 focus:ring-primary/20 transition-google"
            >
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-google-lg border-border/40">
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

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Coins className="size-4 text-primary" />
          <Label className="font-display font-semibold text-sm uppercase tracking-wider">Prix (FCFA)</Label>
        </div>
        <div className="flex flex-col gap-3">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice || ""}
            onChange={(e) =>
              setMinPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="h-11 rounded-2xl border-border/40 bg-white dark:bg-muted/10 transition-google"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice || ""}
            onChange={(e) =>
              setMaxPrice(e.target.value ? parseInt(e.target.value) : null)
            }
            min={0}
            className="h-11 rounded-2xl border-border/40 bg-white dark:bg-muted/10 transition-google"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full h-11 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 transition-google"
          onClick={clearFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Effacer les filtres
        </Button>
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
            className="lg:hidden h-11 px-5 rounded-full border-border/60 hover:bg-secondary transition-google shadow-google-sm"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="ml-2 size-5 flex items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[320px] p-0 border-r border-border/40 bg-background/98 backdrop-blur-xl"
        >
          <SheetHeader className="p-6 border-b border-border/10">
            <SheetTitle className="text-xl font-display font-bold">Filtres</SheetTitle>
          </SheetHeader>
          <div className="p-8">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sort Select (always visible) */}
      <div className="flex items-center gap-4 bg-[#f8f9fa] dark:bg-muted/10 pl-6 p-1 rounded-full border border-border/40 shadow-google-sm">
        <Label htmlFor="sort-desktop" className="hidden sm:block text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          Trier par
        </Label>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortOption)}
        >
          <SelectTrigger
            id="sort-desktop"
            className="w-[180px] h-10 border-none bg-transparent focus:ring-0 shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-google-lg border-border/40">
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
        "p-8 rounded-[32px] bg-[#f8f9fa] dark:bg-card border border-border/40 shadow-google-sm space-y-8",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-3">
          Filtres
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/5 rounded-full"
          >
            Effacer
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Category Filter */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Catégorie</Label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setCategory(null)}
              className={cn(
                "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-google",
                !category ? "bg-white dark:bg-muted text-primary font-bold shadow-google-sm" : "text-muted-foreground hover:bg-white dark:hover:bg-muted"
              )}
            >
              Toutes les catégories
            </button>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-google text-left",
                  category === cat.slug ? "bg-white dark:bg-muted text-primary font-bold shadow-google-sm" : "text-muted-foreground hover:bg-white dark:hover:bg-muted"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Filter */}
        {brands.length > 0 && (
          <div className="space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marque</Label>
            <Select
              value={brand || "all"}
              onValueChange={(value) => setBrand(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-11 rounded-2xl border-border/40 bg-white dark:bg-muted/10 transition-google">
                <SelectValue placeholder="Toutes les marques" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-google-lg">
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

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Budget (FCFA)</Label>
          <div className="flex flex-col gap-3">
             <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Min</span>
              <Input
                type="number"
                value={minPrice || ""}
                onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : null)}
                className="pl-12 h-11 rounded-2xl border-border/40 bg-white dark:bg-muted/10"
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Max</span>
              <Input
                type="number"
                value={maxPrice || ""}
                onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : null)}
                className="pl-12 h-11 rounded-2xl border-border/40 bg-white dark:bg-muted/10"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
