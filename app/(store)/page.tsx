import Link from "next/link"
import { ArrowRight } from "lucide-react"
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


export default async function HomePage() {
  const [featuredProducts, /* promoProducts, */ newProducts] = await Promise.all([
    getFeaturedProducts(),
    // getPromoProducts(),
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



      {/* Promotions Section - Removed for now */}
      {/* <PromotionsSection products={promoProducts} /> */}

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
