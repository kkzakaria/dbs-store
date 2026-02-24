export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  image: string | null;
  parent_id: string | null;
  order: number;
};

export const categories: readonly Category[] = [
  // Top-level
  { id: "smartphones",    slug: "smartphones",    name: "Smartphones",       icon: "smartphone",  image: null, parent_id: null, order: 0 },
  { id: "tablettes",      slug: "tablettes",      name: "Tablettes",         icon: "tablet",      image: null, parent_id: null, order: 1 },
  { id: "ordinateurs",    slug: "ordinateurs",    name: "Ordinateurs",       icon: "laptop",      image: null, parent_id: null, order: 2 },
  { id: "montres",        slug: "montres-connectees", name: "Montres connectées", icon: "watch",  image: null, parent_id: null, order: 3 },
  { id: "audio",          slug: "audio",          name: "Audio",             icon: "headphones",  image: null, parent_id: null, order: 4 },
  { id: "cameras-drones", slug: "cameras-drones", name: "Caméras & Drones",  icon: "camera",      image: null, parent_id: null, order: 5 },
  { id: "gaming",         slug: "gaming",         name: "Gaming",            icon: "gamepad-2",   image: null, parent_id: null, order: 6 },
  { id: "imprimantes",    slug: "imprimantes",    name: "Imprimantes",       icon: "printer",     image: null, parent_id: null, order: 7 },
  { id: "accessoires",    slug: "accessoires",    name: "Accessoires",       icon: "cable",       image: null, parent_id: null, order: 8 },
  { id: "offres",         slug: "offres",         name: "Offres",            icon: "percent",     image: null, parent_id: null, order: 9 },
  { id: "support",        slug: "support",        name: "Support",           icon: "life-buoy",   image: null, parent_id: null, order: 10 },

  // Smartphones subcategories
  { id: "iphone",         slug: "iphone",         name: "iPhone",            icon: "smartphone",  image: null, parent_id: "smartphones", order: 0 },
  { id: "samsung-galaxy", slug: "samsung-galaxy", name: "Samsung Galaxy",    icon: "smartphone",  image: null, parent_id: "smartphones", order: 1 },
  { id: "google-pixel",   slug: "google-pixel",   name: "Google Pixel",      icon: "smartphone",  image: null, parent_id: "smartphones", order: 2 },
  { id: "xiaomi",         slug: "xiaomi",         name: "Xiaomi",            icon: "smartphone",  image: null, parent_id: "smartphones", order: 3 },
  { id: "huawei",         slug: "huawei",         name: "Huawei",            icon: "smartphone",  image: null, parent_id: "smartphones", order: 4 },
  { id: "autres-marques", slug: "autres-marques", name: "Autres marques",    icon: "smartphone",  image: null, parent_id: "smartphones", order: 5 },

  // Tablettes subcategories
  { id: "ipad",               slug: "ipad",               name: "iPad",               icon: "tablet", image: null, parent_id: "tablettes", order: 0 },
  { id: "samsung-tab",        slug: "samsung-tab",        name: "Samsung Tab",        icon: "tablet", image: null, parent_id: "tablettes", order: 1 },
  { id: "tablettes-android",  slug: "tablettes-android",  name: "Tablettes Android",  icon: "tablet", image: null, parent_id: "tablettes", order: 2 },
  { id: "accessoires-tablettes", slug: "accessoires-tablettes", name: "Accessoires tablettes", icon: "tablet", image: null, parent_id: "tablettes", order: 3 },

  // Ordinateurs subcategories
  { id: "laptops",     slug: "laptops",     name: "Laptops",     icon: "laptop",  image: null, parent_id: "ordinateurs", order: 0 },
  { id: "desktops",    slug: "desktops",    name: "Desktops",    icon: "monitor", image: null, parent_id: "ordinateurs", order: 1 },
  { id: "tout-en-un",  slug: "tout-en-un",  name: "Tout-en-un",  icon: "monitor", image: null, parent_id: "ordinateurs", order: 2 },
  { id: "chromebooks", slug: "chromebooks", name: "Chromebooks",  icon: "laptop",  image: null, parent_id: "ordinateurs", order: 3 },

  // Montres connectées subcategories
  { id: "apple-watch",        slug: "apple-watch",        name: "Apple Watch",        icon: "watch", image: null, parent_id: "montres", order: 0 },
  { id: "samsung-galaxy-watch", slug: "samsung-galaxy-watch", name: "Samsung Galaxy Watch", icon: "watch", image: null, parent_id: "montres", order: 1 },
  { id: "huawei-watch",       slug: "huawei-watch",       name: "Huawei Watch",       icon: "watch", image: null, parent_id: "montres", order: 2 },
  { id: "google-pixel-watch", slug: "google-pixel-watch", name: "Google Pixel Watch", icon: "watch", image: null, parent_id: "montres", order: 3 },
  { id: "fitbit",             slug: "fitbit",             name: "Fitbit",             icon: "watch", image: null, parent_id: "montres", order: 4 },
  { id: "autres-montres",     slug: "autres-montres",     name: "Autres montres",     icon: "watch", image: null, parent_id: "montres", order: 5 },

  // Audio subcategories
  { id: "ecouteurs-sans-fil",    slug: "ecouteurs-sans-fil",    name: "Écouteurs sans fil",    icon: "headphones", image: null, parent_id: "audio", order: 0 },
  { id: "casques",               slug: "casques",               name: "Casques",               icon: "headphones", image: null, parent_id: "audio", order: 1 },
  { id: "enceintes-bluetooth",   slug: "enceintes-bluetooth",   name: "Enceintes Bluetooth",   icon: "speaker",    image: null, parent_id: "audio", order: 2 },
  { id: "enceintes-intelligentes", slug: "enceintes-intelligentes", name: "Enceintes intelligentes", icon: "speaker", image: null, parent_id: "audio", order: 3 },
  { id: "micros",                slug: "micros",                name: "Micros",                icon: "mic",        image: null, parent_id: "audio", order: 4 },
  { id: "barres-de-son",         slug: "barres-de-son",         name: "Barres de son",         icon: "speaker",    image: null, parent_id: "audio", order: 5 },

  // Caméras & Drones subcategories
  { id: "drones",          slug: "drones",          name: "Drones",             icon: "camera", image: null, parent_id: "cameras-drones", order: 0 },
  { id: "cameras-action",  slug: "cameras-action",  name: "Caméras d'action",   icon: "camera", image: null, parent_id: "cameras-drones", order: 1 },
  { id: "stabilisateurs",  slug: "stabilisateurs",  name: "Stabilisateurs",     icon: "camera", image: null, parent_id: "cameras-drones", order: 2 },
  { id: "appareils-photo", slug: "appareils-photo", name: "Appareils photo",    icon: "camera", image: null, parent_id: "cameras-drones", order: 3 },

  // Gaming subcategories
  { id: "consoles",        slug: "consoles",        name: "Consoles",  icon: "gamepad-2", image: null, parent_id: "gaming", order: 0 },
  { id: "manettes-gaming", slug: "manettes-gaming", name: "Manettes", icon: "gamepad-2", image: null, parent_id: "gaming", order: 1 },

  // Imprimantes subcategories
  { id: "imprimantes-laser",    slug: "imprimantes-laser",    name: "Laser",          icon: "printer", image: null, parent_id: "imprimantes", order: 0 },
  { id: "jet-encre",            slug: "jet-encre",            name: "Jet d'encre",    icon: "printer", image: null, parent_id: "imprimantes", order: 1 },
  { id: "multifonctions",       slug: "multifonctions",       name: "Multifonctions", icon: "printer", image: null, parent_id: "imprimantes", order: 2 },
  { id: "projecteurs",          slug: "projecteurs",          name: "Projecteurs",    icon: "projector", image: null, parent_id: "imprimantes", order: 3 },

  // Accessoires subcategories
  { id: "coques-protections", slug: "coques-protections", name: "Coques & protections",   icon: "shield",    image: null, parent_id: "accessoires", order: 0 },
  { id: "chargeurs-cables",   slug: "chargeurs-cables",   name: "Chargeurs & câbles",     icon: "cable",     image: null, parent_id: "accessoires", order: 1 },
  { id: "stockage",           slug: "stockage",           name: "Stockage",               icon: "hard-drive", image: null, parent_id: "accessoires", order: 2 },
  { id: "supports-docks",     slug: "supports-docks",     name: "Supports & docks",       icon: "monitor",   image: null, parent_id: "accessoires", order: 3 },
  { id: "claviers-souris",    slug: "claviers-souris",    name: "Claviers & souris",      icon: "keyboard",  image: null, parent_id: "accessoires", order: 4 },
  { id: "maison-connectee",   slug: "maison-connectee",   name: "Maison connectée",       icon: "home",      image: null, parent_id: "accessoires", order: 5 },
  { id: "wearables",          slug: "wearables",          name: "Wearables",              icon: "glasses",   image: null, parent_id: "accessoires", order: 6 },
];

const topLevelCache = categories
  .filter((c) => c.parent_id === null)
  .sort((a, b) => a.order - b.order);

const subcategoryCache = new Map<string, Category[]>();
for (const cat of topLevelCache) {
  const subs = categories
    .filter((c) => c.parent_id === cat.id)
    .sort((a, b) => a.order - b.order);
  subcategoryCache.set(cat.id, subs);
  subcategoryCache.set(cat.slug, subs);
}

export function getTopLevelCategories(): Category[] {
  return topLevelCache;
}

export function getSubcategories(parentSlugOrId: string): Category[] {
  const result = subcategoryCache.get(parentSlugOrId);
  if (result === undefined) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[categories] getSubcategories called with unknown key: "${parentSlugOrId}". ` +
          `Valid keys: ${[...subcategoryCache.keys()].join(", ")}`
      );
    }
    return [];
  }
  return result;
}
