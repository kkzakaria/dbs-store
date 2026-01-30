import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { 
  HeroSection,
  PromotionsSection,
  NewArrivalsSection,
  TestimonialsSection,
  BrandsSection,
  CTASection,
  CategoryProductsSection
} from "@/components/store"
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

async function getCategoriesWithProducts() {
  const supabase = await createClient()

  // Single query: fetch categories with their products using Supabase relations
  // Eliminates N+1 query problem (was 1 + N queries, now just 1)
  const { data: categories } = await supabase
    .from("categories")
    .select(`
      id, name, slug,
      products(
        id, name, slug, price, created_at,
        product_images(url, is_primary)
      )
    `)
    .eq("products.is_active", true)
    .order("name", { ascending: true })

  if (!categories) return []

  const categoryOrder = [
    "smartphone",
    "montre connectée",
    "tablette",
    "ordinateur",
    "audio",
    "accessoire"
  ]

  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.name.toLowerCase())
    const indexB = categoryOrder.indexOf(b.name.toLowerCase())

    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name)
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    return indexA - indexB
  })

  return sortedCategories
    .map((category) => {
      // Sort products by created_at desc and take first 4
      const sortedProducts = [...(category.products || [])]
        .sort((a: { created_at: string | null }, b: { created_at: string | null }) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
        .slice(0, 4)

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        products: sortedProducts.map((p: { id: string; name: string; slug: string; price: number; product_images: { url: string; is_primary: boolean | null }[] }) => {
          const primaryImage = p.product_images?.find((img) => img.is_primary) || p.product_images?.[0]
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            image: primaryImage?.url || "/images/placeholder-product.png"
          }
        })
      }
    })
    .filter(c => c.products.length > 0)
}


export default async function HomePage() {
  const [featuredProducts, /* promoProducts, */ newProducts, categoriesProducts] = await Promise.all([
    getFeaturedProducts(),
    // getPromoProducts(),
    getNewProducts(),
    getCategoriesWithProducts(),
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

      {/* Categories Sections */}
      {categoriesProducts.map((cat) => (
        <CategoryProductsSection 
          key={cat.id}
          categoryName={cat.name}
          categorySlug={cat.slug}
          products={cat.products}
        />
      ))}

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section - Enhanced */}
      <CTASection 
        title="Rejoignez la communauté DBS Store"
        description="Créez votre compte dès maintenant pour suivre vos commandes, sauvegarder vos articles favoris et recevoir nos offres exclusives."
        primaryAction={{ label: "Créer un compte", href: "/register" }}
        secondaryAction={{ label: "Se connecter", href: "/login" }}
      />
    </div>
  )
}
