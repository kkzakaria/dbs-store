import { Smartphone, Tablet, Laptop, Watch, Headphones, Cable, Percent, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const featuredProducts = [
  { name: "iPhone 16 Pro", price: "899 000", category: "Smartphones", badge: "Nouveau" },
  { name: "Samsung Galaxy S25 Ultra", price: "799 000", category: "Smartphones", badge: "Populaire" },
  { name: "MacBook Air M4", price: "1 150 000", category: "Ordinateurs", badge: "Nouveau" },
  { name: "iPad Pro M4", price: "950 000", category: "Tablettes", badge: null },
  { name: "AirPods Pro 3", price: "189 000", category: "Audio", badge: "Nouveau" },
  { name: "Apple Watch Ultra 3", price: "599 000", category: "Montres", badge: null },
  { name: "Google Pixel 9 Pro", price: "650 000", category: "Smartphones", badge: null },
  { name: "Samsung Galaxy Tab S10", price: "475 000", category: "Tablettes", badge: "Promo" },
];

const categoryHighlights = [
  { name: "Smartphones", slug: "smartphones", icon: Smartphone, count: 48 },
  { name: "Tablettes", slug: "tablettes", icon: Tablet, count: 24 },
  { name: "Ordinateurs", slug: "ordinateurs", icon: Laptop, count: 36 },
  { name: "Montres connectées", slug: "montres-connectees", icon: Watch, count: 18 },
  { name: "Audio", slug: "audio", icon: Headphones, count: 32 },
  { name: "Accessoires", slug: "accessoires", icon: Cable, count: 56 },
];

const promoProducts = [
  { name: "Xiaomi 14T Pro", oldPrice: "450 000", newPrice: "375 000", discount: "-17%" },
  { name: "Sony WH-1000XM5", oldPrice: "280 000", newPrice: "225 000", discount: "-20%" },
  { name: "Samsung Galaxy Watch 7", oldPrice: "250 000", newPrice: "199 000", discount: "-20%" },
  { name: "Lenovo IdeaPad Slim 5", oldPrice: "520 000", newPrice: "449 000", discount: "-14%" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-6 lg:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            La tech au meilleur prix en Afrique de l&apos;Ouest
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Bienvenue sur DBS Store
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Decouvrez notre selection de smartphones, tablettes, ordinateurs et accessoires.
            Livraison rapide en Cote d&apos;Ivoire et dans toute la zone UEMOA.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/smartphones">Voir les smartphones</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/offres">Offres du moment</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Nos categories</h2>
        <p className="mt-2 text-muted-foreground">Explorez notre catalogue par categorie</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categoryHighlights.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-colors hover:border-primary/30 hover:bg-muted/50"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <cat.icon className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{cat.count} produits</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Produits populaires</h2>
              <p className="mt-2 text-muted-foreground">Les plus demandes par nos clients</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/smartphones">Voir tout</Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <div
                key={product.name}
                className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
              >
                {product.badge ? (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {product.badge}
                  </span>
                ) : null}
                <div className="flex aspect-square items-center justify-center bg-muted/50 text-muted-foreground/40 transition-colors group-hover:bg-muted">
                  <Smartphone className="size-16" />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <h3 className="mt-1 font-medium">{product.name}</h3>
                  <p className="mt-2 text-lg font-bold">{product.price} FCFA</p>
                  <Button className="mt-3 w-full" size="sm" variant="outline">
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-12 text-center lg:px-6">
          <Percent className="size-10" />
          <h2 className="text-2xl font-bold">Offres speciales de la semaine</h2>
          <p className="max-w-xl text-primary-foreground/80">
            Profitez de reductions allant jusqu&apos;a -20% sur une selection de produits.
            Offre valable jusqu&apos;a dimanche.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/offres">Voir les offres</Link>
          </Button>
        </div>
      </section>

      {/* Promo products */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Promotions en cours</h2>
        <p className="mt-2 text-muted-foreground">Economisez sur vos produits preferes</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promoProducts.map((product) => (
            <div
              key={product.name}
              className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
            >
              <span className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">
                {product.discount}
              </span>
              <div className="flex aspect-[4/3] items-center justify-center bg-muted/50 text-muted-foreground/40 transition-colors group-hover:bg-muted">
                <Smartphone className="size-12" />
              </div>
              <div className="p-4">
                <h3 className="font-medium">{product.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-lg font-bold">{product.newPrice} FCFA</p>
                  <p className="text-sm text-muted-foreground line-through">{product.oldPrice}</p>
                </div>
                <Button className="mt-3 w-full" size="sm" variant="outline">
                  Ajouter au panier
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust section */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3 lg:px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-6" />
            </div>
            <h3 className="font-semibold">Livraison rapide</h3>
            <p className="text-sm text-muted-foreground">
              Livraison en 24-48h a Abidjan. Expedition dans toute la zone UEMOA.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="font-semibold">Garantie officielle</h3>
            <p className="text-sm text-muted-foreground">
              Tous nos produits sont neufs et couverts par la garantie constructeur.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="size-6" />
            </div>
            <h3 className="font-semibold">Paiement securise</h3>
            <p className="text-sm text-muted-foreground">
              Paiement par Mobile Money, carte bancaire ou a la livraison.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="rounded-2xl bg-muted p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold">Restez informe</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Inscrivez-vous a notre newsletter pour recevoir nos offres exclusives
            et les dernieres nouveautes.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm gap-2">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <Button>S&apos;inscrire</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <h4 className="font-semibold">Produits</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/smartphones" className="hover:text-foreground">Smartphones</Link></li>
                <li><Link href="/tablettes" className="hover:text-foreground">Tablettes</Link></li>
                <li><Link href="/ordinateurs" className="hover:text-foreground">Ordinateurs</Link></li>
                <li><Link href="/audio" className="hover:text-foreground">Audio</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Categories</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/montres-connectees" className="hover:text-foreground">Montres</Link></li>
                <li><Link href="/accessoires" className="hover:text-foreground">Accessoires</Link></li>
                <li><Link href="/offres" className="hover:text-foreground">Offres</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/support" className="hover:text-foreground">Aide</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Retours</Link></li>
                <li><Link href="/support" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">DBS Store</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground">A propos</Link></li>
                <li><Link href="/" className="hover:text-foreground">Carrieres</Link></li>
                <li><Link href="/" className="hover:text-foreground">Mentions legales</Link></li>
                <li><Link href="/" className="hover:text-foreground">Confidentialite</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 DBS Store. Tous droits reserves. Abidjan, Cote d&apos;Ivoire.
            </p>
            <p className="text-xs text-muted-foreground">
              Prix en Francs CFA (FCFA). Livraison zone UEMOA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
