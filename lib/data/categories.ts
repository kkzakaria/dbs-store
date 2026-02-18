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
  { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0 },
  { id: "tablettes", slug: "tablettes", name: "Tablettes", icon: "tablet", image: null, parent_id: null, order: 1 },
  { id: "ordinateurs", slug: "ordinateurs", name: "Ordinateurs", icon: "laptop", image: null, parent_id: null, order: 2 },
  { id: "montres", slug: "montres-connectees", name: "Montres connectées", icon: "watch", image: null, parent_id: null, order: 3 },
  { id: "audio", slug: "audio", name: "Audio", icon: "headphones", image: null, parent_id: null, order: 4 },
  { id: "accessoires", slug: "accessoires", name: "Accessoires", icon: "cable", image: null, parent_id: null, order: 5 },
  { id: "offres", slug: "offres", name: "Offres", icon: "percent", image: null, parent_id: null, order: 6 },
  { id: "support", slug: "support", name: "Support", icon: "life-buoy", image: null, parent_id: null, order: 7 },

  // Smartphones subcategories
  { id: "iphone", slug: "iphone", name: "iPhone", icon: "smartphone", image: null, parent_id: "smartphones", order: 0 },
  { id: "samsung-galaxy", slug: "samsung-galaxy", name: "Samsung Galaxy", icon: "smartphone", image: null, parent_id: "smartphones", order: 1 },
  { id: "google-pixel", slug: "google-pixel", name: "Google Pixel", icon: "smartphone", image: null, parent_id: "smartphones", order: 2 },
  { id: "xiaomi", slug: "xiaomi", name: "Xiaomi", icon: "smartphone", image: null, parent_id: "smartphones", order: 3 },
  { id: "autres-marques", slug: "autres-marques", name: "Autres marques", icon: "smartphone", image: null, parent_id: "smartphones", order: 4 },

  // Tablettes subcategories
  { id: "ipad", slug: "ipad", name: "iPad", icon: "tablet", image: null, parent_id: "tablettes", order: 0 },
  { id: "samsung-tab", slug: "samsung-tab", name: "Samsung Tab", icon: "tablet", image: null, parent_id: "tablettes", order: 1 },
  { id: "tablettes-android", slug: "tablettes-android", name: "Tablettes Android", icon: "tablet", image: null, parent_id: "tablettes", order: 2 },
  { id: "accessoires-tablettes", slug: "accessoires-tablettes", name: "Accessoires tablettes", icon: "tablet", image: null, parent_id: "tablettes", order: 3 },

  // Ordinateurs subcategories
  { id: "laptops", slug: "laptops", name: "Laptops", icon: "laptop", image: null, parent_id: "ordinateurs", order: 0 },
  { id: "desktops", slug: "desktops", name: "Desktops", icon: "monitor", image: null, parent_id: "ordinateurs", order: 1 },
  { id: "tout-en-un", slug: "tout-en-un", name: "Tout-en-un", icon: "monitor", image: null, parent_id: "ordinateurs", order: 2 },
  { id: "chromebooks", slug: "chromebooks", name: "Chromebooks", icon: "laptop", image: null, parent_id: "ordinateurs", order: 3 },

  // Montres connectées subcategories
  { id: "apple-watch", slug: "apple-watch", name: "Apple Watch", icon: "watch", image: null, parent_id: "montres", order: 0 },
  { id: "samsung-galaxy-watch", slug: "samsung-galaxy-watch", name: "Samsung Galaxy Watch", icon: "watch", image: null, parent_id: "montres", order: 1 },
  { id: "google-pixel-watch", slug: "google-pixel-watch", name: "Google Pixel Watch", icon: "watch", image: null, parent_id: "montres", order: 2 },
  { id: "fitbit", slug: "fitbit", name: "Fitbit", icon: "watch", image: null, parent_id: "montres", order: 3 },

  // Audio subcategories
  { id: "ecouteurs-sans-fil", slug: "ecouteurs-sans-fil", name: "Écouteurs sans fil", icon: "headphones", image: null, parent_id: "audio", order: 0 },
  { id: "casques", slug: "casques", name: "Casques", icon: "headphones", image: null, parent_id: "audio", order: 1 },
  { id: "enceintes-bluetooth", slug: "enceintes-bluetooth", name: "Enceintes Bluetooth", icon: "speaker", image: null, parent_id: "audio", order: 2 },
  { id: "barres-de-son", slug: "barres-de-son", name: "Barres de son", icon: "speaker", image: null, parent_id: "audio", order: 3 },

  // Accessoires subcategories
  { id: "coques-protections", slug: "coques-protections", name: "Coques & protections", icon: "shield", image: null, parent_id: "accessoires", order: 0 },
  { id: "chargeurs-cables", slug: "chargeurs-cables", name: "Chargeurs & câbles", icon: "cable", image: null, parent_id: "accessoires", order: 1 },
  { id: "stockage", slug: "stockage", name: "Stockage", icon: "hard-drive", image: null, parent_id: "accessoires", order: 2 },
  { id: "supports-docks", slug: "supports-docks", name: "Supports & docks", icon: "monitor", image: null, parent_id: "accessoires", order: 3 },
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
