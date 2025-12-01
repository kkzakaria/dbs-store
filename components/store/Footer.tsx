import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/Logo"
import { Separator } from "@/components/ui/separator"
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
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

const paymentMethods = [
  { name: "Wave", logo: "/images/payments/wave.svg" },
  { name: "Orange Money", logo: "/images/payments/orange-money.svg" },
  { name: "MTN Money", logo: "/images/payments/mtn.svg" },
  { name: "CinetPay", logo: "/images/payments/cinetpay.svg" },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/40 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Logo variant="default" asLink={false} />
            <p className="text-sm text-muted-foreground max-w-xs">
              Votre boutique en ligne de produits électroniques premium en Côte
              d'Ivoire. Qualité garantie, livraison rapide.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="size-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Service client</h3>
            <ul className="space-y-3">
              {customerService.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="size-4 mt-0.5 shrink-0" />
                <span>+225 07 00 00 00 00</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="size-4 mt-0.5 shrink-0" />
                <a
                  href="mailto:contact@dbsstore.ci"
                  className="hover:text-primary transition-colors"
                >
                  contact@dbsstore.ci
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="size-4 mt-0.5 shrink-0" />
                <span>Abidjan, Côte d'Ivoire</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Payment Methods */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">
              Paiements sécurisés:
            </span>
            <div className="flex items-center gap-3">
              {/* Payment method badges - using text for now since images may not exist */}
              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                Wave
              </span>
              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                Orange Money
              </span>
              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">
                MTN
              </span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © {currentYear} DBS Store. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
