import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
  Send,
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
]

const paymentMethods = ["Wave", "Orange Money", "MTN Money"]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden">
      {/* Top gradient line */}
      <div className="h-1 bg-gradient-primary" />

      {/* Main footer content */}
      <div className="bg-gradient-to-b from-muted/50 to-muted/80">
        {/* Newsletter Section */}
        <div className="border-b border-border/50">
          <div className="container py-10 md:py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold font-display mb-2">
                  Restez informé
                </h3>
                <p className="text-muted-foreground text-sm">
                  Inscrivez-vous pour recevoir nos offres exclusives et nouveautés
                </p>
              </div>
              <form className="flex w-full max-w-md gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Votre email"
                    className={cn(
                      "pl-10 h-11 rounded-full",
                      "bg-background/80 backdrop-blur-sm",
                      "border-border/50 focus:border-primary",
                      "transition-all duration-300"
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className={cn(
                    "h-11 px-6 rounded-full",
                    "bg-gradient-primary hover:opacity-90",
                    "shadow-soft hover:shadow-glow-sm",
                    "transition-all duration-300"
                  )}
                >
                  <Send className="size-4 mr-2" />
                  <span className="hidden sm:inline">S'inscrire</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Logo & Description */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1 space-y-5">
              <Logo variant="default" asLink={false} />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Votre boutique en ligne de produits électroniques premium en Côte
                d'Ivoire. Qualité garantie, livraison rapide.
              </p>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-center",
                      "size-10 rounded-full",
                      "bg-background/80 text-muted-foreground",
                      "border border-border/50",
                      "hover:bg-primary hover:text-white hover:border-primary",
                      "transition-all duration-300",
                      "hover:scale-110"
                    )}
                    aria-label={social.name}
                  >
                    <social.icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">
                Liens rapides
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-2 text-sm text-muted-foreground",
                        "hover:text-primary transition-colors duration-300"
                      )}
                    >
                      <ArrowRight className="size-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">
                Service client
              </h3>
              <ul className="space-y-3">
                {customerService.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-2 text-sm text-muted-foreground",
                        "hover:text-primary transition-colors duration-300"
                      )}
                    >
                      <ArrowRight className="size-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">
                Contact
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="tel:+2250700000000"
                    className={cn(
                      "flex items-start gap-3 text-sm text-muted-foreground",
                      "hover:text-primary transition-colors duration-300 group"
                    )}
                  >
                    <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Phone className="size-4" />
                    </div>
                    <span className="pt-1">+225 07 00 00 00 00</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:contact@dbsstore.ci"
                    className={cn(
                      "flex items-start gap-3 text-sm text-muted-foreground",
                      "hover:text-primary transition-colors duration-300 group"
                    )}
                  >
                    <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Mail className="size-4" />
                    </div>
                    <span className="pt-1">contact@dbsstore.ci</span>
                  </a>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <span className="pt-1">Abidjan, Côte d'Ivoire</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-muted/80 border-t border-border/50">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Payment Methods */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs text-muted-foreground font-medium">
                Paiements sécurisés:
              </span>
              <div className="flex items-center gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-full",
                      "bg-background text-muted-foreground",
                      "border border-border/50"
                    )}
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground text-center md:text-right">
              © {currentYear} DBS Store. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
    </footer>
  )
}
