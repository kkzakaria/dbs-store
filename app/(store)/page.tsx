import Link from "next/link"
import { ArrowRight, Smartphone, Tablet, Watch, Headphones, Laptop } from "lucide-react"
import { HeroSection } from "@/components/store/HeroSection"
import { PromotionsSection } from "@/components/store/PromotionsSection"
import { NewArrivalsSection } from "@/components/store/NewArrivalsSection"
import { FeaturesSection } from "@/components/store/FeaturesSection"
import { TestimonialsSection } from "@/components/store/TestimonialsSection"
import { BrandsSection } from "@/components/store/BrandsSection"
import { StatsSection } from "@/components/store/StatsSection"
import { CTASection } from "@/components/store/CTASection"
import { AnimateOnScroll } from "@/components/animations"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

async function getFeaturedProducts() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      product_images (
        url,
        is_primary
      )
    `)
    .eq("is_featured", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    products?.map((product) => {
      const primaryImage =
        product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: primaryImage?.url || "/images/placeholder-product.png",
      }
    }) || []
  )
}

async function getPromoProducts() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      compare_price,
      product_images (
        url,
        is_primary
      )
    `)
    .eq("is_active", true)
    .not("compare_price", "is", null)
    .gt("compare_price", 0)
    .order("created_at", { ascending: false })
    .limit(4)

  return (
    products?.map((product) => {
      const primaryImage =
        product.product_images?.find((img: { is_primary: boolean | null }) => img.is_primary) || product.product_images?.[0]
      const originalPrice = product.compare_price || product.price
      const salePrice = product.price
      const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: primaryImage?.url || "/images/placeholder-product.png",
        originalPrice,
        salePrice,
        discountPercent,
      }
    }) || []
  )
}

async function getNewProducts() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      categories (
        name
      ),
      product_images (
        url,
        is_primary
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    products?.map((product) => {
      const primaryImage =
        product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: primaryImage?.url || "/images/placeholder-product.png",
        category: product.categories?.name,
        rating: 4.5 + Math.random() * 0.5, // Simulated rating for now
      }
    }) || []
  )
}

const categories = [
  {
    name: "Smartphone",
    icon: Smartphone,
    href: "/categories/smartphones",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    name: "Tablette",
    icon: Tablet,
    href: "/categories/tablettes",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Montre connectée",
    icon: Watch,
    href: "/categories/montres-connectees",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    name: "Audio",
    icon: Headphones,
    href: "/categories/audio",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    gradient: "from-green-500 to-emerald-400",
  },
  {
    name: "Ordinateur",
    icon: Laptop,
    href: "/categories/ordinateurs",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    gradient: "from-red-500 to-rose-500",
  },
]

export default async function HomePage() {
  const [featuredProducts, promoProducts, newProducts] = await Promise.all([
    getFeaturedProducts(),
    getPromoProducts(),
    getNewProducts(),
  ])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection
        featuredProducts={featuredProducts}
        action={{
          label: "Explorer la boutique",
          href: "/products",
        }}
      />


      {/* Categories Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-background">
        <div className="container-google">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Explorez par catégorie
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Retrouvez les meilleures technologies adaptées à votre style de vie.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <AnimateOnScroll 
                  key={category.name} 
                  animation="fade-up" 
                  delay={index * 100}
                >
                  <Link
                    href={category.href}
                    className="group flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#f8f9fa] dark:bg-muted/10 transition-google hover-google-rise shadow-google-sm"
                  >
                    <div
                      className={cn(
                        "p-5 rounded-2xl bg-white dark:bg-card text-foreground transition-all duration-300 group-hover:scale-110 shadow-google-sm",
                        category.color.split(' ')[1] // Keep the text color but remove the bg-XX-500/10
                      )}
                    >
                      <Icon className="size-8 md:size-9" />
                    </div>
                    <span className="font-display font-semibold text-base md:text-lg">
                      {category.name}
                    </span>
                  </Link>
                </AnimateOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <PromotionsSection products={promoProducts} />

      {/* Brands Section */}
      <BrandsSection />

      {/* New Arrivals Section */}
      <NewArrivalsSection products={newProducts} />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section - Enhanced */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section - Enhanced */}
      <CTASection />
    </div>
  )
}
