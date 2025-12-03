import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Smartphone, Laptop, Headphones, Gamepad2 } from "lucide-react"
import { HeroSection } from "@/components/store/HeroSection"
import { createClient } from "@/lib/supabase/server"

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

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection
        featuredProducts={featuredProducts}
        headline="DÉCOUVREZ NOS"
        backgroundWord="TECH"
      />

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Nos catégories
            </h2>
            <p className="mt-2 text-muted-foreground">
              Trouvez ce dont vous avez besoin
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Smartphones",
                icon: Smartphone,
                href: "/categories/smartphones",
                color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              },
              {
                name: "Ordinateurs",
                icon: Laptop,
                href: "/categories/ordinateurs",
                color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
              },
              {
                name: "Audio",
                icon: Headphones,
                href: "/categories/audio",
                color: "bg-green-500/10 text-green-600 dark:text-green-400",
              },
              {
                name: "Gaming",
                icon: Gamepad2,
                href: "/categories/gaming",
                color: "bg-red-500/10 text-red-600 dark:text-red-400",
              },
            ].map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group flex flex-col items-center gap-4 p-6 rounded-xl border bg-card hover:shadow-lg transition-all"
                >
                  <div
                    className={`p-4 rounded-full ${category.color} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="size-8" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/40">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Livraison rapide",
                description:
                  "Livraison dans toute la Côte d'Ivoire en 24-72h",
              },
              {
                title: "Paiement sécurisé",
                description:
                  "Wave, Orange Money, MTN - Payez en toute sécurité",
              },
              {
                title: "Garantie qualité",
                description:
                  "Produits authentiques avec garantie constructeur",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-xl bg-background border"
              >
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold">
              Prêt à découvrir nos produits ?
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
              Rejoignez des milliers de clients satisfaits et profitez de nos
              offres exclusives.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-8"
            >
              <Link href="/products">
                Commencer mes achats
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
