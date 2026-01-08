"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimateOnScroll } from "@/components/animations"
import { 
  ArrowRight, 
  Smartphone, 
  Watch, 
  Tablet, 
  Laptop, 
  Headphones, 
  Gamepad2, 
  Speaker,
  Package,
  LucideIcon
} from "lucide-react"
import { ProductCard, type Product } from "../products/ProductCard"

interface CategoryConfig {
  icon: LucideIcon
  color: string
  bgColor: string
}

const categoryConfigs: Record<string, CategoryConfig> = {
  smartphone: { icon: Smartphone, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  "montre connectée": { icon: Watch, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
  tablette: { icon: Tablet, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
  ordinateur: { icon: Laptop, color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-900/20" },
  audio: { icon: Headphones, color: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-900/20" },
  accessoire: { icon: Gamepad2, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
  def: { icon: Package, color: "text-primary", bgColor: "bg-secondary" }
}

interface CategoryProduct {
  id: string
  name: string
  slug: string
  image: string
  price: number
  category?: string
}

interface CategoryProductsSectionProps {
  categoryName: string
  categorySlug: string
  products: CategoryProduct[]
}

export function CategoryProductsSection({ 
  categoryName, 
  categorySlug,
  products 
}: CategoryProductsSectionProps) {
  if (products.length === 0) return null

  // Improved matching logic (handles plural cases)
  const normalizedName = categoryName.toLowerCase();
  const configKey = Object.keys(categoryConfigs).find(key => 
    normalizedName.includes(key) || key.includes(normalizedName)
  ) || "def";
  
  const config = categoryConfigs[configKey];
  const Icon = config.icon;

  return (
    <section className="bg-white dark:bg-background relative overflow-hidden">
      {/* Dynamic Header with Category Color */}
      <div className={`w-full ${config.bgColor} py-6 md:py-8 border-b border-border/5`}>
        <div className="container-google">
          <div className="flex flex-row items-center justify-between px-4 gap-4">
            <AnimateOnScroll animation="fade-up" className="flex-1 min-w-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-2.5 rounded-xl bg-white dark:bg-card ${config.color} shadow-google-md shrink-0`}>
                  <Icon className="size-5 sm:size-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground leading-tight truncate">
                    {categoryName}
                  </h2>
                  <p className="hidden sm:block text-sm md:text-base text-muted-foreground font-light leading-relaxed max-w-xl truncate sm:whitespace-normal">
                    Découvrez notre sélection de {categoryName.toLowerCase()} haute performance.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={200} className="shrink-0">
              <Button
                asChild
                variant="outline"
                className="group h-8 sm:h-10 px-3 sm:px-6 rounded-full bg-white dark:bg-card border-border hover:bg-primary/5 hover:border-primary/20 hover:text-primary text-[10px] sm:text-sm font-semibold transition-google shadow-google-sm hover:shadow-google-md"
              >
                <Link href={`/categories/${categorySlug}`} className="flex items-center gap-2">
                  <span className="hidden xs:inline">Tout voir</span>
                  <span className="xs:hidden">Voir</span>
                  <ArrowRight className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </AnimateOnScroll>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="py-12 md:py-16 bg-[#f8f9fa] dark:bg-muted/5">
        <div className="container-google relative">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
            {products.slice(0, 4).map((product, index) => {
              const adaptedProduct = {
                ...product,
                images: [{ url: product.image, is_primary: true, id: product.id + "-img", alt: product.name, position: 0 }],
                category: product.category ? { name: product.category, id: "cat", slug: product.category } : null
              } as unknown as Product;

              return (
                <AnimateOnScroll
                  key={product.id}
                  animation="fade-up"
                  delay={index * 100}
                >
                  <ProductCard product={adaptedProduct} />
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
