// scripts/seed-categories.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { categories } from "../lib/db/schema";

const db = drizzle(new Database(process.env.DATABASE_URL ?? "./dev.db"));
const now = new Date();

const seed = [
  // Top-level
  { id: "smartphones",    slug: "smartphones",        name: "Smartphones",          icon: "smartphone",  image: null, parent_id: null, order: 0,  created_at: now },
  { id: "tablettes",      slug: "tablettes",          name: "Tablettes",            icon: "tablet",      image: null, parent_id: null, order: 1,  created_at: now },
  { id: "ordinateurs",    slug: "ordinateurs",        name: "Ordinateurs",          icon: "laptop",      image: null, parent_id: null, order: 2,  created_at: now },
  { id: "montres",        slug: "montres-connectees", name: "Montres connectées",   icon: "watch",       image: null, parent_id: null, order: 3,  created_at: now },
  { id: "audio",          slug: "audio",              name: "Audio",                icon: "headphones",  image: null, parent_id: null, order: 4,  created_at: now },
  { id: "cameras-drones", slug: "cameras-drones",     name: "Caméras & Drones",     icon: "camera",      image: null, parent_id: null, order: 5,  created_at: now },
  { id: "gaming",         slug: "gaming",             name: "Gaming",               icon: "gamepad-2",   image: null, parent_id: null, order: 6,  created_at: now },
  { id: "imprimantes",    slug: "imprimantes",        name: "Imprimantes",          icon: "printer",     image: null, parent_id: null, order: 7,  created_at: now },
  { id: "accessoires",    slug: "accessoires",        name: "Accessoires",          icon: "cable",       image: null, parent_id: null, order: 8,  created_at: now },
  { id: "offres",         slug: "offres",             name: "Offres",               icon: "percent",     image: null, parent_id: null, order: 9,  created_at: now },
  { id: "support",        slug: "support",            name: "Support",              icon: "life-buoy",   image: null, parent_id: null, order: 10, created_at: now },

  // Smartphones
  { id: "iphone",         slug: "iphone",             name: "iPhone",               icon: "smartphone",  image: null, parent_id: "smartphones", order: 0, created_at: now },
  { id: "samsung-galaxy", slug: "samsung-galaxy",     name: "Samsung Galaxy",       icon: "smartphone",  image: null, parent_id: "smartphones", order: 1, created_at: now },
  { id: "google-pixel",   slug: "google-pixel",       name: "Google Pixel",         icon: "smartphone",  image: null, parent_id: "smartphones", order: 2, created_at: now },
  { id: "xiaomi",         slug: "xiaomi",             name: "Xiaomi",               icon: "smartphone",  image: null, parent_id: "smartphones", order: 3, created_at: now },
  { id: "huawei",         slug: "huawei",             name: "Huawei",               icon: "smartphone",  image: null, parent_id: "smartphones", order: 4, created_at: now },
  { id: "autres-marques", slug: "autres-marques",     name: "Autres marques",       icon: "smartphone",  image: null, parent_id: "smartphones", order: 5, created_at: now },

  // Tablettes
  { id: "ipad",                  slug: "ipad",                  name: "iPad",                  icon: "tablet",     image: null, parent_id: "tablettes", order: 0, created_at: now },
  { id: "samsung-tab",           slug: "samsung-tab",           name: "Samsung Tab",           icon: "tablet",     image: null, parent_id: "tablettes", order: 1, created_at: now },
  { id: "tablettes-android",     slug: "tablettes-android",     name: "Tablettes Android",     icon: "tablet",     image: null, parent_id: "tablettes", order: 2, created_at: now },
  { id: "accessoires-tablettes", slug: "accessoires-tablettes", name: "Accessoires tablettes", icon: "tablet",     image: null, parent_id: "tablettes", order: 3, created_at: now },

  // Ordinateurs
  { id: "laptops",     slug: "laptops",     name: "Laptops",     icon: "laptop",  image: null, parent_id: "ordinateurs", order: 0, created_at: now },
  { id: "desktops",    slug: "desktops",    name: "Desktops",    icon: "monitor", image: null, parent_id: "ordinateurs", order: 1, created_at: now },
  { id: "tout-en-un",  slug: "tout-en-un",  name: "Tout-en-un",  icon: "monitor", image: null, parent_id: "ordinateurs", order: 2, created_at: now },
  { id: "chromebooks", slug: "chromebooks", name: "Chromebooks",  icon: "laptop",  image: null, parent_id: "ordinateurs", order: 3, created_at: now },

  // Montres connectées
  { id: "apple-watch",          slug: "apple-watch",          name: "Apple Watch",          icon: "watch", image: null, parent_id: "montres", order: 0, created_at: now },
  { id: "samsung-galaxy-watch", slug: "samsung-galaxy-watch", name: "Samsung Galaxy Watch", icon: "watch", image: null, parent_id: "montres", order: 1, created_at: now },
  { id: "huawei-watch",         slug: "huawei-watch",         name: "Huawei Watch",         icon: "watch", image: null, parent_id: "montres", order: 2, created_at: now },
  { id: "google-pixel-watch",   slug: "google-pixel-watch",   name: "Google Pixel Watch",   icon: "watch", image: null, parent_id: "montres", order: 3, created_at: now },
  { id: "fitbit",               slug: "fitbit",               name: "Fitbit",               icon: "watch", image: null, parent_id: "montres", order: 4, created_at: now },
  { id: "autres-montres",       slug: "autres-montres",       name: "Autres montres",       icon: "watch", image: null, parent_id: "montres", order: 5, created_at: now },

  // Audio
  { id: "ecouteurs-sans-fil",      slug: "ecouteurs-sans-fil",      name: "Écouteurs sans fil",      icon: "headphones", image: null, parent_id: "audio", order: 0, created_at: now },
  { id: "casques",                  slug: "casques",                  name: "Casques",                  icon: "headphones", image: null, parent_id: "audio", order: 1, created_at: now },
  { id: "enceintes-bluetooth",     slug: "enceintes-bluetooth",     name: "Enceintes Bluetooth",     icon: "speaker",    image: null, parent_id: "audio", order: 2, created_at: now },
  { id: "enceintes-intelligentes", slug: "enceintes-intelligentes", name: "Enceintes intelligentes", icon: "speaker",    image: null, parent_id: "audio", order: 3, created_at: now },
  { id: "micros",                  slug: "micros",                  name: "Micros",                  icon: "mic",        image: null, parent_id: "audio", order: 4, created_at: now },
  { id: "barres-de-son",           slug: "barres-de-son",           name: "Barres de son",           icon: "speaker",    image: null, parent_id: "audio", order: 5, created_at: now },

  // Caméras & Drones
  { id: "drones",          slug: "drones",          name: "Drones",           icon: "camera", image: null, parent_id: "cameras-drones", order: 0, created_at: now },
  { id: "cameras-action",  slug: "cameras-action",  name: "Caméras d'action", icon: "camera", image: null, parent_id: "cameras-drones", order: 1, created_at: now },
  { id: "stabilisateurs",  slug: "stabilisateurs",  name: "Stabilisateurs",   icon: "camera", image: null, parent_id: "cameras-drones", order: 2, created_at: now },
  { id: "appareils-photo", slug: "appareils-photo", name: "Appareils photo",  icon: "camera", image: null, parent_id: "cameras-drones", order: 3, created_at: now },

  // Gaming
  { id: "consoles",        slug: "consoles",        name: "Consoles", icon: "gamepad-2", image: null, parent_id: "gaming", order: 0, created_at: now },
  { id: "manettes-gaming", slug: "manettes-gaming", name: "Manettes", icon: "gamepad-2", image: null, parent_id: "gaming", order: 1, created_at: now },

  // Imprimantes
  { id: "imprimantes-laser", slug: "imprimantes-laser", name: "Laser",          icon: "printer",    image: null, parent_id: "imprimantes", order: 0, created_at: now },
  { id: "jet-encre",         slug: "jet-encre",         name: "Jet d'encre",    icon: "printer",    image: null, parent_id: "imprimantes", order: 1, created_at: now },
  { id: "multifonctions",   slug: "multifonctions",     name: "Multifonctions", icon: "printer",    image: null, parent_id: "imprimantes", order: 2, created_at: now },
  { id: "projecteurs",      slug: "projecteurs",        name: "Projecteurs",    icon: "projector",  image: null, parent_id: "imprimantes", order: 3, created_at: now },

  // Accessoires
  { id: "coques-protections", slug: "coques-protections", name: "Coques & protections", icon: "shield",     image: null, parent_id: "accessoires", order: 0, created_at: now },
  { id: "chargeurs-cables",   slug: "chargeurs-cables",   name: "Chargeurs & câbles",   icon: "cable",      image: null, parent_id: "accessoires", order: 1, created_at: now },
  { id: "stockage",           slug: "stockage",           name: "Stockage",             icon: "hard-drive", image: null, parent_id: "accessoires", order: 2, created_at: now },
  { id: "supports-docks",     slug: "supports-docks",     name: "Supports & docks",     icon: "monitor",    image: null, parent_id: "accessoires", order: 3, created_at: now },
  { id: "claviers-souris",    slug: "claviers-souris",    name: "Claviers & souris",    icon: "keyboard",   image: null, parent_id: "accessoires", order: 4, created_at: now },
  { id: "maison-connectee",   slug: "maison-connectee",   name: "Maison connectée",     icon: "home",       image: null, parent_id: "accessoires", order: 5, created_at: now },
  { id: "wearables",          slug: "wearables",          name: "Wearables",            icon: "glasses",    image: null, parent_id: "accessoires", order: 6, created_at: now },
];

async function main() {
  console.log(`Seeding ${seed.length} categories...`);
  await db.insert(categories).values(seed);
  console.log("Done!");
}

main().catch(console.error);
