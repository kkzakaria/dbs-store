import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Facebook,
  Instagram,
  Twitter,
  Music2,
  MessageCircle,
} from "lucide-react"

const quickLinks = [
  { name: "Tous les produits", href: "/products" },
  { name: "Nouveautés", href: "/products?sort=newest" },
  { name: "Promotions", href: "/promotions" },
  { name: "Meilleures ventes", href: "/products?sort=bestselling" },
]

const customerService = [
  { name: "Contactez-nous", href: "/contact" },
  { name: "FAQ", href: "/faq" },
  { name: "Livraison", href: "/shipping" },
  { name: "Retours & Remboursements", href: "/returns" },
  { name: "Conditions générales", href: "/terms" },
  { name: "Politique de confidentialité", href: "/privacy" },
]

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "TikTok", icon: Music2, href: "https://tiktok.com" },
  { name: "WhatsApp", icon: MessageCircle, href: "https://wa.me/22500000000" },
]


export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#f8f9fa] dark:bg-card border-t border-border/40 transition-colors duration-300">
      <div className="container-google py-16 md:py-24">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Brand/Logo Column */}
          <div className="col-span-2 lg:col-span-2 space-y-8">
            <Logo variant="default" asLink={false} className="h-8 w-auto" />
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-sm">
              Découvrez le futur de la technologie. DBS Store vous propose une sélection rigoureuse d&apos;appareils électroniques premium, alliant design innovant et performance exceptionnelle.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-google"
                  aria-label={social.name}
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-foreground">
              Magasin
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-muted-foreground hover:text-primary transition-google"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-6">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-foreground">
              Aide
            </h3>
            <ul className="space-y-4">
              {customerService.slice(0, 4).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-muted-foreground hover:text-primary transition-google"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="col-span-2 md:col-span-1 space-y-6">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-foreground">
              Newsletter
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Inscrivez-vous pour nos actualités et offres spéciales.
            </p>
            <form className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Votre email"
                className="h-11 rounded-xl bg-background border-border/60 focus:border-primary transition-google"
              />
              <Button
                type="submit"
                className="h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-google"
              >
                S&apos;abonner
              </Button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {customerService.slice(4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-primary transition-google"
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
             <p className="text-xs text-muted-foreground">
              © {currentYear} DBS Store. Abidjan, Côte d&apos;Ivoire.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
