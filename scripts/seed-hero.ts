// scripts/seed-hero.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { hero_slides } from "../lib/db/schema";

const db = drizzle(new Database(process.env.DATABASE_URL ?? "./dev.db"));
const now = new Date();

const slides = [
  {
    id: "hero-smartphones-2026",
    title: "iPhone 17 Pro Max",
    subtitle: "La puissance d'Apple dans votre poche. Puce A19 Pro, caméra révolutionnaire.",
    badge: "Nouveau",
    image_url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1920&q=80",
    text_align: "left" as const,
    overlay_color: "#000000",
    overlay_opacity: 50,
    cta_primary_label: "Découvrir",
    cta_primary_href: "/produits/iphone-17-pro-max",
    cta_secondary_label: "Voir tous les smartphones",
    cta_secondary_href: "/smartphones",
    is_active: true,
    sort_order: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: "hero-promos-2026",
    title: "Offres spéciales de la semaine",
    subtitle: "Jusqu'à -20% sur une sélection de smartphones, tablettes et accessoires.",
    badge: "Promo",
    image_url: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80",
    text_align: "center" as const,
    overlay_color: "#1a0533",
    overlay_opacity: 60,
    cta_primary_label: "Voir les offres",
    cta_primary_href: "/offres",
    cta_secondary_label: null,
    cta_secondary_href: null,
    is_active: true,
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "hero-audio-2026",
    title: "Son de référence",
    subtitle: "AirPods, casques et enceintes premium. Vivez la musique autrement.",
    badge: null,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920&q=80",
    text_align: "right" as const,
    overlay_color: "#000000",
    overlay_opacity: 45,
    cta_primary_label: "Explorer l'audio",
    cta_primary_href: "/audio",
    cta_secondary_label: null,
    cta_secondary_href: null,
    is_active: true,
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
];

db.transaction((tx) => {
  for (const slide of slides) {
    tx.insert(hero_slides).values(slide).onConflictDoNothing().run();
  }
});

console.log(`✓ ${slides.length} hero slides insérées`);
