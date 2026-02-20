# Product Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implémenter les pages listing par catégorie/sous-catégorie et la page détail produit, avec Drizzle ORM sur SQLite3 en local.

**Architecture:** Drizzle ORM + `better-sqlite3` en local (même pattern que Better Auth). Les Server Components lisent la DB directement. Filtres via URL `searchParams`. Les catégories restent statiques dans `lib/data/categories.ts`. Note : la migration vers Cloudflare D1 en production est une tâche séparée — le schéma Drizzle est compatible D1 sans modification.

**Tech Stack:** drizzle-orm, drizzle-kit, better-sqlite3 (déjà installé), Vitest + React Testing Library (déjà installé)

---

### Task 1 : Installer Drizzle

**Files:**
- Modify: `package.json`

**Step 1 : Installer les packages**

```bash
bun add drizzle-orm
bun add -d drizzle-kit
```

**Step 2 : Vérifier l'installation**

```bash
bunx drizzle-kit --version
```

Expected : numéro de version affiché.

**Step 3 : Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add drizzle-orm and drizzle-kit"
```

---

### Task 2 : Créer le schéma Drizzle

**Files:**
- Create: `lib/db/schema.ts`

**Step 1 : Écrire le schéma**

```ts
// lib/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category_id: text("category_id").notNull(),
  subcategory_id: text("subcategory_id"),
  price: integer("price").notNull(),
  old_price: integer("old_price"),
  brand: text("brand").notNull(),
  images: text("images").notNull(),        // JSON string[]
  description: text("description").notNull(),
  specs: text("specs").notNull(),           // JSON Record<string, string>
  stock: integer("stock").default(0).notNull(),
  badge: text("badge"),                     // "Nouveau" | "Populaire" | "Promo" | null
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

**Step 2 : Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add Drizzle products schema"
```

---

### Task 3 : Créer la connexion DB

**Files:**
- Create: `lib/db/index.ts`

**Step 1 : Écrire le helper**

```ts
// lib/db/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Pour D1 en production : remplacer par drizzle-orm/d1 avec le binding
// getRequestContext().env.DB depuis @cloudflare/next-on-pages.
export function getDb() {
  const sqlite = new Database(process.env.DATABASE_URL ?? "./dev.db");
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof getDb>;
```

**Step 2 : Commit**

```bash
git add lib/db/index.ts
git commit -m "feat: add Drizzle DB connection helper"
```

---

### Task 4 : Configurer drizzle-kit et générer la migration

**Files:**
- Create: `drizzle.config.ts`
- Modify: `package.json` (scripts)

**Step 1 : Créer `drizzle.config.ts`**

```ts
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./dev.db",
  },
} satisfies Config;
```

**Step 2 : Ajouter les scripts dans `package.json`**

Dans la section `"scripts"`, ajouter :

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx scripts/seed.ts"
```

**Step 3 : Générer la migration**

```bash
bun run db:generate
```

Expected : dossier `drizzle/` créé avec un fichier SQL de migration.

**Step 4 : Appliquer la migration**

```bash
bun run db:migrate
```

Expected : table `products` créée dans `dev.db`.

**Step 5 : Commit**

```bash
git add drizzle.config.ts drizzle/ package.json
git commit -m "feat: add drizzle-kit config and initial products migration"
```

---

### Task 5 : Créer les fonctions de requête produits (TDD)

**Files:**
- Create: `tests/lib/data/products.test.ts`
- Create: `lib/data/products.ts`

**Step 1 : Écrire les tests (failing)**

```ts
// tests/lib/data/products.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import {
  getProductsByCategory,
  getProduct,
  getRelatedProducts,
  getPromoProducts,
} from "@/lib/data/products";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      subcategory_id TEXT,
      price INTEGER NOT NULL,
      old_price INTEGER,
      brand TEXT NOT NULL,
      images TEXT NOT NULL,
      description TEXT NOT NULL,
      specs TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  return drizzle(sqlite, { schema });
}

const BASE = {
  id: "iphone-16-pro",
  name: "iPhone 16 Pro",
  slug: "iphone-16-pro",
  category_id: "smartphones",
  subcategory_id: "iphone",
  price: 899000,
  old_price: null,
  brand: "Apple",
  images: JSON.stringify(["/placeholder.svg"]),
  description: "Top smartphone.",
  specs: JSON.stringify({ RAM: "8 Go" }),
  stock: 5,
  badge: "Nouveau",
  is_active: true,
  created_at: new Date("2026-01-01"),
} as const;

describe("getProductsByCategory", () => {
  it("returns products matching category_id", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await getProductsByCategory(db, "smartphones");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("iPhone 16 Pro");
  });

  it("returns products matching subcategory_id", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await getProductsByCategory(db, "iphone");
    expect(result).toHaveLength(1);
  });

  it("returns empty array for unknown category", async () => {
    const db = createTestDb();
    const result = await getProductsByCategory(db, "unknown");
    expect(result).toHaveLength(0);
  });

  it("filters by brand", async () => {
    const db = createTestDb();
    const samsung = { ...BASE, id: "s25", slug: "s25", brand: "Samsung", subcategory_id: null };
    await db.insert(schema.products).values([BASE, samsung]);
    const result = await getProductsByCategory(db, "smartphones", { brand: "Apple" });
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe("Apple");
  });

  it("filters by prix_max", async () => {
    const db = createTestDb();
    const cheap = { ...BASE, id: "cheap", slug: "cheap", price: 50000, subcategory_id: null };
    await db.insert(schema.products).values([BASE, cheap]);
    const result = await getProductsByCategory(db, "smartphones", { prix_max: 100000 });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(50000);
  });
});

describe("getProduct", () => {
  it("returns product by slug", async () => {
    const db = createTestDb();
    await db.insert(schema.products).values(BASE);
    const result = await getProduct(db, "iphone-16-pro");
    expect(result?.name).toBe("iPhone 16 Pro");
  });

  it("returns null for unknown slug", async () => {
    const db = createTestDb();
    const result = await getProduct(db, "does-not-exist");
    expect(result).toBeNull();
  });
});

describe("getRelatedProducts", () => {
  it("returns products from same subcategory excluding current product", async () => {
    const db = createTestDb();
    const other = { ...BASE, id: "iphone-15", slug: "iphone-15", name: "iPhone 15" };
    await db.insert(schema.products).values([BASE, other]);
    const result = await getRelatedProducts(db, "iphone-16-pro", "iphone");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("iphone-15");
  });
});

describe("getPromoProducts", () => {
  it("returns only products with old_price set", async () => {
    const db = createTestDb();
    const promo = { ...BASE, id: "promo", slug: "promo", old_price: 999000 };
    await db.insert(schema.products).values([BASE, promo]);
    const result = await getPromoProducts(db);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("promo");
  });
});
```

**Step 2 : Vérifier que les tests échouent**

```bash
bun run test tests/lib/data/products.test.ts
```

Expected : FAIL — `Cannot find module '@/lib/data/products'`

**Step 3 : Implémenter les fonctions**

```ts
// lib/data/products.ts
import { eq, or, and, ne, lte, gte, asc, desc, isNotNull } from "drizzle-orm";
import { products, type Product } from "@/lib/db/schema";
import type { Db } from "@/lib/db";

export type ProductFilters = {
  brand?: string;
  prix_min?: number;
  prix_max?: number;
  tri?: "prix_asc" | "prix_desc" | "nouveau";
};

export async function getProductsByCategory(
  db: Db,
  categoryId: string,
  filters: ProductFilters = {}
): Promise<Product[]> {
  const conditions = [
    or(eq(products.category_id, categoryId), eq(products.subcategory_id, categoryId)),
    eq(products.is_active, true),
  ];

  if (filters.brand) conditions.push(eq(products.brand, filters.brand));
  if (filters.prix_min) conditions.push(gte(products.price, filters.prix_min));
  if (filters.prix_max) conditions.push(lte(products.price, filters.prix_max));

  const order =
    filters.tri === "prix_asc"
      ? asc(products.price)
      : filters.tri === "prix_desc"
        ? desc(products.price)
        : desc(products.created_at);

  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(order);
}

export async function getProduct(db: Db, slug: string): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_active, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function getRelatedProducts(
  db: Db,
  productId: string,
  subcategoryId: string
): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.subcategory_id, subcategoryId),
        ne(products.id, productId),
        eq(products.is_active, true)
      )
    )
    .limit(4);
}

export async function getPromoProducts(db: Db, limit = 4): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(and(isNotNull(products.old_price), eq(products.is_active, true)))
    .orderBy(desc(products.created_at))
    .limit(limit);
}
```

**Step 4 : Vérifier que les tests passent**

```bash
bun run test tests/lib/data/products.test.ts
```

Expected : PASS — 4 suites, 8 tests.

**Step 5 : Commit**

```bash
git add lib/data/products.ts tests/lib/data/products.test.ts
git commit -m "feat: add product query functions with tests"
```

---

### Task 6 : Créer le script de seed (20 produits)

**Files:**
- Create: `scripts/seed.ts`

**Step 1 : Écrire le script**

```ts
// scripts/seed.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { products } from "../lib/db/schema";

const db = drizzle(new Database(process.env.DATABASE_URL ?? "./dev.db"));
const now = new Date();

const seed = [
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro 128 Go",
    slug: "iphone-16-pro",
    category_id: "smartphones",
    subcategory_id: "iphone",
    price: 899000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Le smartphone le plus avancé d'Apple avec la puce A18 Pro et le système de caméra Pro Camera.",
    specs: JSON.stringify({ Processeur: "Apple A18 Pro", Stockage: "128 Go", RAM: "8 Go", Écran: "6,3 po Super Retina XDR", Batterie: "3 274 mAh", OS: "iOS 18" }),
    stock: 10, badge: "Nouveau", is_active: true, created_at: now,
  },
  {
    id: "samsung-galaxy-s25-ultra",
    name: "Samsung Galaxy S25 Ultra",
    slug: "samsung-galaxy-s25-ultra",
    category_id: "smartphones",
    subcategory_id: "samsung-galaxy",
    price: 799000, old_price: null, brand: "Samsung",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "L'ultra-flagship de Samsung avec S Pen intégré et IA Galaxy avancée.",
    specs: JSON.stringify({ Processeur: "Snapdragon 8 Elite", Stockage: "256 Go", RAM: "12 Go", Écran: "6,9 po QHD+ AMOLED", Batterie: "5 000 mAh" }),
    stock: 7, badge: "Populaire", is_active: true, created_at: now,
  },
  {
    id: "iphone-15",
    name: "iPhone 15 128 Go",
    slug: "iphone-15",
    category_id: "smartphones",
    subcategory_id: "iphone",
    price: 649000, old_price: 749000, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "iPhone 15 avec Dynamic Island, puce A16 Bionic et port USB-C.",
    specs: JSON.stringify({ Processeur: "Apple A16 Bionic", Stockage: "128 Go", Écran: "6,1 po Super Retina XDR", Batterie: "3 349 mAh" }),
    stock: 15, badge: "Promo", is_active: true, created_at: now,
  },
  {
    id: "google-pixel-9-pro",
    name: "Google Pixel 9 Pro",
    slug: "google-pixel-9-pro",
    category_id: "smartphones",
    subcategory_id: "google-pixel",
    price: 650000, old_price: null, brand: "Google",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Le smartphone Google avec IA Gemini intégrée et les meilleures photos de nuit.",
    specs: JSON.stringify({ Processeur: "Google Tensor G4", Stockage: "128 Go", RAM: "12 Go", Écran: "6,3 po LTPO OLED", Batterie: "4 700 mAh" }),
    stock: 6, badge: null, is_active: true, created_at: now,
  },
  {
    id: "xiaomi-14t-pro",
    name: "Xiaomi 14T Pro",
    slug: "xiaomi-14t-pro",
    category_id: "smartphones",
    subcategory_id: "xiaomi",
    price: 375000, old_price: 450000, brand: "Xiaomi",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Flagship killer Xiaomi avec Leica Camera System et charge 120W.",
    specs: JSON.stringify({ Processeur: "Dimensity 9300+", Stockage: "256 Go", RAM: "12 Go", Écran: "6,67 po AMOLED 144 Hz", Batterie: "5 000 mAh" }),
    stock: 12, badge: "Promo", is_active: true, created_at: now,
  },
  {
    id: "macbook-air-m4",
    name: "MacBook Air M4 15 po",
    slug: "macbook-air-m4",
    category_id: "ordinateurs",
    subcategory_id: "laptops",
    price: 1150000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Le MacBook Air le plus fin et le plus rapide jamais conçu, avec la puce M4.",
    specs: JSON.stringify({ Processeur: "Apple M4", RAM: "16 Go", Stockage: "512 Go SSD", Écran: "15,3 po Liquid Retina", Autonomie: "18h" }),
    stock: 5, badge: "Nouveau", is_active: true, created_at: now,
  },
  {
    id: "lenovo-ideapad-slim-5",
    name: "Lenovo IdeaPad Slim 5",
    slug: "lenovo-ideapad-slim-5",
    category_id: "ordinateurs",
    subcategory_id: "laptops",
    price: 449000, old_price: 520000, brand: "Lenovo",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Ultrabook fin et léger pour la productivité quotidienne avec écran OLED.",
    specs: JSON.stringify({ Processeur: "Intel Core Ultra 7", RAM: "16 Go", Stockage: "512 Go SSD", Écran: "14 po OLED" }),
    stock: 4, badge: "Promo", is_active: true, created_at: now,
  },
  {
    id: "ipad-pro-m4",
    name: "iPad Pro M4 11 po",
    slug: "ipad-pro-m4",
    category_id: "tablettes",
    subcategory_id: "ipad",
    price: 950000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "L'iPad le plus puissant avec la puce M4 et l'écran Ultra Retina XDR.",
    specs: JSON.stringify({ Processeur: "Apple M4", Stockage: "256 Go", Écran: "11 po Ultra Retina XDR", Connectivité: "Wi-Fi 6E" }),
    stock: 8, badge: null, is_active: true, created_at: now,
  },
  {
    id: "ipad-mini-7",
    name: "iPad mini 7",
    slug: "ipad-mini-7",
    category_id: "tablettes",
    subcategory_id: "ipad",
    price: 549000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "L'iPad compact et puissant avec puce A17 Pro et Apple Pencil Pro.",
    specs: JSON.stringify({ Processeur: "Apple A17 Pro", Stockage: "128 Go", Écran: "8,3 po Liquid Retina" }),
    stock: 7, badge: "Nouveau", is_active: true, created_at: now,
  },
  {
    id: "samsung-galaxy-tab-s10",
    name: "Samsung Galaxy Tab S10",
    slug: "samsung-galaxy-tab-s10",
    category_id: "tablettes",
    subcategory_id: "samsung-tab",
    price: 475000, old_price: 520000, brand: "Samsung",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Tablette Android premium avec S Pen inclus et écran Dynamic AMOLED 2X.",
    specs: JSON.stringify({ Processeur: "Snapdragon 8 Gen 3", Stockage: "256 Go", RAM: "12 Go", Écran: "11 po Dynamic AMOLED 2X", Batterie: "8 000 mAh" }),
    stock: 9, badge: "Promo", is_active: true, created_at: now,
  },
  {
    id: "airpods-pro-3",
    name: "AirPods Pro 3",
    slug: "airpods-pro-3",
    category_id: "audio",
    subcategory_id: "ecouteurs-sans-fil",
    price: 189000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Réduction de bruit active de nouvelle génération avec son Spatial Audio.",
    specs: JSON.stringify({ Autonomie: "6h + 30h boîtier", Connexion: "Bluetooth 5.3", Résistance: "IP54" }),
    stock: 15, badge: "Nouveau", is_active: true, created_at: now,
  },
  {
    id: "airpods-4",
    name: "AirPods 4",
    slug: "airpods-4",
    category_id: "audio",
    subcategory_id: "ecouteurs-sans-fil",
    price: 139000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Les AirPods de nouvelle génération avec réduction de bruit active.",
    specs: JSON.stringify({ Autonomie: "5h + 30h boîtier", Connexion: "Bluetooth 5.3" }),
    stock: 20, badge: null, is_active: true, created_at: now,
  },
  {
    id: "sony-wh-1000xm5",
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    category_id: "audio",
    subcategory_id: "casques",
    price: 225000, old_price: 280000, brand: "Sony",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Le meilleur casque à réduction de bruit du marché avec 30h d'autonomie.",
    specs: JSON.stringify({ Autonomie: "30h", Connexion: "Bluetooth 5.2", Réduction: "8 microphones HD" }),
    stock: 8, badge: "Promo", is_active: true, created_at: now,
  },
  {
    id: "jbl-charge-5",
    name: "JBL Charge 5",
    slug: "jbl-charge-5",
    category_id: "audio",
    subcategory_id: "enceintes-bluetooth",
    price: 89000, old_price: null, brand: "JBL",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Enceinte portable puissante avec batterie 7 500 mAh et résistance IP67.",
    specs: JSON.stringify({ Autonomie: "20h", Résistance: "IP67", Puissance: "30W" }),
    stock: 18, badge: null, is_active: true, created_at: now,
  },
  {
    id: "apple-watch-ultra-3",
    name: "Apple Watch Ultra 3",
    slug: "apple-watch-ultra-3",
    category_id: "montres",
    subcategory_id: "apple-watch",
    price: 599000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "La montre connectée la plus robuste d'Apple, conçue pour les aventuriers.",
    specs: JSON.stringify({ Écran: "49 mm Always-On Retina", Autonomie: "60h", Résistance: "100m" }),
    stock: 3, badge: null, is_active: true, created_at: now,
  },
  {
    id: "samsung-galaxy-watch-7",
    name: "Samsung Galaxy Watch 7",
    slug: "samsung-galaxy-watch-7",
    category_id: "montres",
    subcategory_id: "samsung-galaxy-watch",
    price: 199000, old_price: 250000, brand: "Samsung",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Montre connectée Samsung avec suivi santé avancé et Wear OS.",
    specs: JSON.stringify({ Écran: "40 mm Super AMOLED", Autonomie: "40h", Résistance: "5ATM" }),
    stock: 11, badge: "Promo", is_active: true, created_at: now,
  },
  {
    id: "google-pixel-watch-3",
    name: "Google Pixel Watch 3",
    slug: "google-pixel-watch-3",
    category_id: "montres",
    subcategory_id: "google-pixel-watch",
    price: 299000, old_price: null, brand: "Google",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Montre connectée Google avec Wear OS et suivi santé Fitbit intégré.",
    specs: JSON.stringify({ Écran: "45 mm AMOLED", Autonomie: "24h", Résistance: "5ATM" }),
    stock: 5, badge: null, is_active: true, created_at: now,
  },
  {
    id: "anker-usb-c-hub",
    name: "Anker USB-C Hub 7-en-1",
    slug: "anker-usb-c-hub",
    category_id: "accessoires",
    subcategory_id: "supports-docks",
    price: 25000, old_price: null, brand: "Anker",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Hub USB-C 7 ports : HDMI 4K, 3x USB 3.0, lecteur SD, USB-C 100W PD.",
    specs: JSON.stringify({ Ports: "7", HDMI: "4K@30Hz", USB: "3x USB 3.0", Alimentation: "100W PD" }),
    stock: 25, badge: null, is_active: true, created_at: now,
  },
  {
    id: "apple-magsafe-charger",
    name: "Apple MagSafe Chargeur 15W",
    slug: "apple-magsafe-charger",
    category_id: "accessoires",
    subcategory_id: "chargeurs-cables",
    price: 29000, old_price: null, brand: "Apple",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Chargeur MagSafe officiel Apple 15W pour iPhone 12 et ultérieurs.",
    specs: JSON.stringify({ Puissance: "15W", Compatibilité: "iPhone 12+", Longueur: "1m" }),
    stock: 30, badge: null, is_active: true, created_at: now,
  },
  {
    id: "samsung-galaxy-buds-3-pro",
    name: "Samsung Galaxy Buds 3 Pro",
    slug: "samsung-galaxy-buds-3-pro",
    category_id: "audio",
    subcategory_id: "ecouteurs-sans-fil",
    price: 129000, old_price: null, brand: "Samsung",
    images: JSON.stringify(["/images/products/placeholder.svg"]),
    description: "Écouteurs Samsung avec réduction de bruit et son haute résolution Hi-Fi.",
    specs: JSON.stringify({ Autonomie: "6h + 24h boîtier", Connexion: "Bluetooth 5.4" }),
    stock: 14, badge: null, is_active: true, created_at: now,
  },
];

async function main() {
  console.log("Seeding products...");
  await db.delete(products);
  await db.insert(products).values(seed);
  console.log(`✓ ${seed.length} produits insérés`);
}

main().catch(console.error);
```

**Step 2 : Lancer le seed**

```bash
bun run db:seed
```

Expected : `✓ 20 produits insérés`

**Step 3 : Commit**

```bash
git add scripts/seed.ts package.json
git commit -m "feat: add product seed script with 20 mock products"
```

---

### Task 7 : Créer le composant ProductCard (TDD)

**Files:**
- Create: `tests/components/products/product-card.test.tsx`
- Create: `components/products/product-card.tsx`

**Step 1 : Écrire les tests (failing)**

```tsx
// tests/components/products/product-card.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/products/product-card";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const BASE = {
  id: "iphone-16-pro",
  name: "iPhone 16 Pro",
  slug: "iphone-16-pro",
  category_id: "smartphones",
  subcategory_id: "iphone",
  price: 899000,
  old_price: null,
  brand: "Apple",
  images: JSON.stringify(["/placeholder.svg"]),
  description: "Top.",
  specs: "{}",
  stock: 5,
  badge: "Nouveau",
  is_active: true,
  created_at: new Date(),
};

describe("ProductCard", () => {
  it("affiche le nom et le prix du produit", () => {
    render(<ProductCard product={BASE} />);
    expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
    expect(screen.getByText(/899 000/)).toBeInTheDocument();
  });

  it("affiche le badge quand présent", () => {
    render(<ProductCard product={BASE} />);
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
  });

  it("n'affiche pas de badge quand null", () => {
    render(<ProductCard product={{ ...BASE, badge: null }} />);
    expect(screen.queryByText("Nouveau")).not.toBeInTheDocument();
  });

  it("affiche l'ancien prix et la réduction quand en promo", () => {
    render(<ProductCard product={{ ...BASE, old_price: 999000 }} />);
    expect(screen.getByText(/999 000/)).toBeInTheDocument();
    expect(screen.getByText(/-\d+%/)).toBeInTheDocument();
  });

  it("affiche 'Rupture de stock' quand stock = 0", () => {
    render(<ProductCard product={{ ...BASE, stock: 0 }} />);
    expect(screen.getByText(/rupture de stock/i)).toBeInTheDocument();
  });

  it("pointe vers la page détail produit", () => {
    render(<ProductCard product={BASE} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/produits/iphone-16-pro");
  });
});
```

**Step 2 : Vérifier que les tests échouent**

```bash
bun run test tests/components/products/product-card.test.tsx
```

Expected : FAIL — module not found.

**Step 3 : Créer le composant**

```tsx
// components/products/product-card.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/db/schema";

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR");
}

function discountPercent(price: number, oldPrice: number) {
  return Math.round((1 - price / oldPrice) * 100);
}

export function ProductCard({ product }: { product: Product }) {
  const images = JSON.parse(product.images) as string[];
  const isOutOfStock = product.stock === 0;

  return (
    <Link
      href={`/produits/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      {product.badge ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          {product.badge}
        </span>
      ) : null}
      {product.old_price ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-medium text-white">
          -{discountPercent(product.price, product.old_price)}%
        </span>
      ) : null}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/50 transition-colors group-hover:bg-muted">
        <Image
          src={images[0] ?? "/images/products/placeholder.svg"}
          alt={product.name}
          fill
          className="object-contain p-4"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-lg font-bold">{formatPrice(product.price)} FCFA</p>
          {product.old_price ? (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(product.old_price)}
            </p>
          ) : null}
        </div>
        <div className="mt-3">
          {isOutOfStock ? (
            <p className="text-center text-xs font-medium text-muted-foreground">
              Rupture de stock
            </p>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => e.preventDefault()}
            >
              Ajouter au panier
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**Step 4 : Vérifier que les tests passent**

```bash
bun run test tests/components/products/product-card.test.tsx
```

Expected : PASS — 6 tests.

**Step 5 : Commit**

```bash
git add components/products/product-card.tsx tests/components/products/product-card.test.tsx
git commit -m "feat: add ProductCard component with tests"
```

---

### Task 8 : Créer la page listing par catégorie

**Files:**
- Create: `components/products/product-filters.tsx`
- Create: `app/(main)/[slug]/page.tsx`
- Create: `public/images/products/placeholder.svg`

**Step 1 : Créer le placeholder SVG**

```svg
<!-- public/images/products/placeholder.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f4f4f5"/>
  <rect x="150" y="130" width="100" height="80" rx="8" fill="#d4d4d8"/>
  <rect x="170" y="220" width="60" height="8" rx="4" fill="#d4d4d8"/>
  <rect x="155" y="240" width="90" height="6" rx="3" fill="#e4e4e7"/>
</svg>
```

**Step 2 : Créer le composant `ProductFilters` (Client Component)**

```tsx
// components/products/product-filters.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

type Filters = {
  brand?: string;
  prix_max?: string;
  tri?: string;
};

const PRIX_OPTIONS = [
  { label: "< 100 000 FCFA", value: "100000" },
  { label: "< 300 000 FCFA", value: "300000" },
  { label: "< 500 000 FCFA", value: "500000" },
  { label: "< 1 000 000 FCFA", value: "1000000" },
];

const TRI_OPTIONS = [
  { label: "Nouveautés", value: "nouveau" },
  { label: "Prix croissant", value: "prix_asc" },
  { label: "Prix décroissant", value: "prix_desc" },
];

export function ProductFilters({
  brands,
  current,
}: {
  brands: string[];
  current: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-52">
      <div>
        <p className="mb-2 text-sm font-semibold">Trier par</p>
        <div className="flex flex-wrap gap-1.5 lg:flex-col">
          {TRI_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={current.tri === opt.value ? "default" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => toggle("tri", opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {brands.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Marque</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col">
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={current.brand === brand ? "default" : "ghost"}
                size="sm"
                className="justify-start"
                onClick={() => toggle("marque", brand)}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold">Prix max</p>
        <div className="flex flex-wrap gap-1.5 lg:flex-col">
          {PRIX_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={current.prix_max === opt.value ? "default" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => toggle("prix_max", opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
```

**Step 3 : Créer la page listing**

```tsx
// app/(main)/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { categories, getSubcategories } from "@/lib/data/categories";
import { getDb } from "@/lib/db";
import { getProductsByCategory } from "@/lib/data/products";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ marque?: string; prix_max?: string; tri?: string }>;
};

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = await searchParams;

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const parent = category.parent_id
    ? categories.find((c) => c.id === category.parent_id)
    : null;

  const db = getDb();
  const items = await getProductsByCategory(db, category.id, {
    brand: filters.marque,
    prix_max: filters.prix_max ? parseInt(filters.prix_max) : undefined,
    tri: filters.tri as "prix_asc" | "prix_desc" | "nouveau" | undefined,
  });

  const brands = [...new Set(items.map((p) => p.brand))].sort();
  const subcategories = getSubcategories(category.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        {parent ? (
          <>
            <Link href={`/${parent.slug}`} className="hover:text-foreground">{parent.name}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} produit{items.length !== 1 ? "s" : ""}
      </p>

      {/* Subcategory pills */}
      {subcategories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {subcategories.map((sub) => (
            <Link
              key={sub.slug}
              href={`/${sub.slug}`}
              className="rounded-full border px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <ProductFilters
            brands={brands}
            current={{ brand: filters.marque, prix_max: filters.prix_max, tri: filters.tri }}
          />
        </Suspense>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier les filtres.</p>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4 : Vérifier dans le navigateur**

```bash
bun run dev
```

Naviguer vers `http://localhost:33000/smartphones` — grille de produits avec sidebar filtres.
Tester `/iphone` — filtre sur la sous-catégorie iPhone.

**Step 5 : Commit**

```bash
git add app/\(main\)/\[slug\]/ components/products/product-filters.tsx public/images/products/
git commit -m "feat: add category listing page with filters and subcategory pills"
```

---

### Task 9 : Créer la page détail produit

**Files:**
- Create: `components/products/product-gallery.tsx`
- Create: `components/products/product-specs.tsx`
- Create: `app/(main)/produits/[slug]/page.tsx`

**Step 1 : Créer `ProductGallery` (Client Component)**

```tsx
// components/products/product-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const src = images[selected] ?? "/images/products/placeholder.svg";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/50">
        <Image
          src={src}
          alt={name}
          fill
          className="object-contain p-8"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((imgSrc, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted/50 transition-colors",
                selected === i
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <Image
                src={imgSrc}
                alt={`${name} vue ${i + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

**Step 2 : Créer `ProductSpecs`**

```tsx
// components/products/product-specs.tsx
export function ProductSpecs({ specs }: { specs: Record<string, string> }) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : "bg-background"}>
              <td className="px-4 py-2.5 font-medium text-muted-foreground">{key}</td>
              <td className="px-4 py-2.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3 : Créer la page détail**

```tsx
// app/(main)/produits/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { categories } from "@/lib/data/categories";
import { getDb } from "@/lib/db";
import { getProduct, getRelatedProducts } from "@/lib/data/products";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductSpecs } from "@/components/products/product-specs";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

function formatPrice(p: number) {
  return p.toLocaleString("fr-FR");
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const product = await getProduct(db, slug);
  if (!product) notFound();

  const images = JSON.parse(product.images) as string[];
  const specs = JSON.parse(product.specs) as Record<string, string>;

  const related = product.subcategory_id
    ? await getRelatedProducts(db, product.id, product.subcategory_id)
    : [];

  const category = categories.find((c) => c.id === product.category_id);
  const subcategory = product.subcategory_id
    ? categories.find((c) => c.id === product.subcategory_id)
    : null;

  const isOutOfStock = product.stock === 0;
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        {category ? (
          <>
            <Link href={`/${category.slug}`} className="hover:text-foreground">{category.name}</Link>
            <span>/</span>
          </>
        ) : null}
        {subcategory ? (
          <>
            <Link href={`/${subcategory.slug}`} className="hover:text-foreground">{subcategory.name}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Layout principal */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={images} name={product.name} />

        <div className="flex flex-col">
          {product.badge ? (
            <span className="mb-3 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {product.badge}
            </span>
          ) : null}

          <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)} FCFA</span>
            {product.old_price ? (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.old_price)} FCFA
                </span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-600">
                  -{discount}%
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-2 text-sm">
            {isOutOfStock ? (
              <span className="font-medium text-red-500">Rupture de stock</span>
            ) : (
              <span className="font-medium text-green-600">
                En stock ({product.stock} disponible{product.stock > 1 ? "s" : ""})
              </span>
            )}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 flex gap-3">
            <Button size="lg" className="flex-1 gap-2" disabled={isOutOfStock}>
              <ShoppingCart className="size-4" />
              {isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
            </Button>
          </div>

          {Object.keys(specs).length > 0 ? (
            <div className="mt-8">
              <h2 className="mb-3 text-base font-semibold">Caractéristiques techniques</h2>
              <ProductSpecs specs={specs} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Produits similaires */}
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight">Produits similaires</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

**Step 4 : Vérifier dans le navigateur**

Naviguer vers `http://localhost:33000/produits/iphone-16-pro` — page détail avec galerie, specs, et produits similaires.
Tester `/produits/iphone-15` — doit afficher le prix barré et la réduction.

**Step 5 : Commit**

```bash
git add app/\(main\)/produits/ components/products/product-gallery.tsx components/products/product-specs.tsx
git commit -m "feat: add product detail page with gallery, specs, and related products"
```

---

### Task 10 : Brancher la homepage sur la DB

**Files:**
- Modify: `app/(main)/page.tsx`

**Step 1 : Remplacer les données mock par des requêtes DB**

Au début de `HomePage()`, ajouter `async` et charger les données :

```ts
// En haut de app/(main)/page.tsx
import { getDb } from "@/lib/db";
import { getProductsByCategory, getPromoProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/products/product-card";
```

Dans `HomePage` (devenir `async`), remplacer les tableaux statiques :

```ts
const db = getDb();
const [featured, promos] = await Promise.all([
  getProductsByCategory(db, "smartphones", { tri: "nouveau" }),
  getPromoProducts(db, 4),
]);
```

Remplacer les sections "Produits populaires" et "Promotions en cours" pour utiliser `<ProductCard />` :

```tsx
{/* Featured products */}
<div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {featured.slice(0, 8).map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>

{/* Promo products */}
<div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {promos.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

Supprimer les tableaux statiques `featuredProducts` et `promoProducts` qui ne sont plus utilisés.

**Step 2 : Vérifier la homepage**

```bash
bun run dev
```

Naviguer vers `http://localhost:33000` — les cards de produits doivent maintenant pointer vers les pages détail réelles.

**Step 3 : Commit**

```bash
git add app/\(main\)/page.tsx
git commit -m "feat: wire homepage product sections to DB"
```

---

### Task 11 : Tests complets et build

**Step 1 : Lancer tous les tests**

```bash
bun run test
```

Expected : tous les tests PASS (anciens + nouveaux).

**Step 2 : Lint**

```bash
bun run lint
```

Expected : aucune erreur.

**Step 3 : Build**

```bash
bun run build
```

Expected : build réussi sans erreur.

**Step 4 : Corriger les problèmes éventuels, puis commit final**

```bash
git add -A
git commit -m "fix: address lint and build issues"
```
