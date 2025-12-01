# 🛒 DBS STORE - Plan de Développement
## Boutique en ligne Électronique Premium

**Version:** 1.0 MVP  
**Durée:** 2 semaines (10 jours ouvrés)  
**Stack:** Next.js 16 + Supabase (natif) + Shadcn UI  
**Déploiement:** Vercel

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Stack technologique](#3-stack-technologique)
4. [Structure du projet](#4-structure-du-projet)
5. [Schéma de base de données](#5-schéma-de-base-de-données)
6. [Planning détaillé](#6-planning-détaillé)
7. [Fonctionnalités par module](#7-fonctionnalités-par-module)
8. [Intégrations tierces](#8-intégrations-tierces)
9. [Checklist de lancement](#9-checklist-de-lancement)

---

## 1. Vue d'ensemble

### 🎯 Objectifs MVP

| Priorité | Fonctionnalité | Statut |
|----------|----------------|--------|
| P0 | Catalogue produits avec recherche/filtres | MVP |
| P0 | Panier & processus de commande | MVP |
| P0 | Authentification OTP téléphone | MVP |
| P0 | Paiement Mobile Money | MVP |
| P0 | Dashboard admin basique | MVP |
| P1 | Gestion des stocks | MVP |
| P1 | Système de promotions | MVP |
| P1 | OAuth (Google, Apple, Microsoft) | MVP |
| P2 | Programme fidélité | MVP |
| P2 | Avis clients | MVP |
| P3 | Analytics avancés | Post-MVP |

### 👥 Utilisateurs cibles

```
┌─────────────────────────────────────────────────────────┐
│                      DBS STORE                          │
├─────────────────────┬───────────────────────────────────┤
│   CLIENTS (App)     │         ADMIN (Dashboard)         │
├─────────────────────┼───────────────────────────────────┤
│ • Parcourir produits│ • Gérer produits/stocks           │
│ • Ajouter au panier │ • Traiter commandes               │
│ • Commander & payer │ • Gérer promotions                │
│ • Suivre commandes  │ • Voir analytics                  │
│ • Laisser avis      │ • Gérer clients                   │
│ • Points fidélité   │ • Configurer livraison            │
└─────────────────────┴───────────────────────────────────┘
```

---

## 2. Architecture technique

### Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS 16 APP                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │  STOREFRONT │  │    ADMIN    │  │   API ROUTES    │    │  │
│  │  │   /app/*    │  │  /admin/*   │  │   /api/*        │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              SERVER ACTIONS                          │  │  │
│  │  │  • createOrder()  • updateStock()  • applyPromo()   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    SUPABASE     │  │   CINETPAY      │  │     RESEND      │
│  ┌───────────┐  │  │                 │  │                 │
│  │ PostgreSQL│  │  │  Mobile Money   │  │     Emails      │
│  │ Database  │  │  │  Payments       │  │ transactionnels │
│  ├───────────┤  │  └─────────────────┘  └─────────────────┘
│  │   Auth    │  │
│  │ (OTP/OAuth)│ │
│  ├───────────┤  │
│  │  Storage  │  │
│  │ (Images)  │  │
│  ├───────────┤  │
│  │ Realtime  │  │
│  │(Notifs)   │  │
│  └───────────┘  │
└─────────────────┘
```

### Flux de données

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  CLIENT  │────▶│  NEXT.JS │────▶│ SUPABASE │────▶│ CINETPAY │
│  (RSC)   │◀────│  SERVER  │◀────│    DB    │     │ PAYMENT  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │                │
                                       ▼                │
                                ┌──────────────┐       │
                                │   STORAGE    │       │
                                │   (Images)   │       │
                                └──────────────┘       │
                                                       │
                      ┌────────────────────────────────┘
                      ▼
               ┌──────────────┐
               │   Webhook    │
               │   callback   │
               └──────────────┘
```

---

## 3. Stack technologique

### Stack simplifiée — 100% Supabase

```
┌─────────────────────────────────────────────────┐
│                  NEXT.JS 16                      │
│  ┌───────────────────────────────────────────┐  │
│  │              SUPABASE                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────┐  │  │
│  │  │   DB    │ │  Auth   │ │   Storage   │  │  │
│  │  │PostgreSQL│ │OTP/OAuth│ │   Images    │  │  │
│  │  └─────────┘ └─────────┘ └─────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │            Realtime                  │  │  │
│  │  │      (Notifications commandes)       │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Core

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.x | Framework React (App Router) |
| React | 19.x | UI Library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.x | Styling |
| Shadcn UI | latest | Composants UI |

### Backend & Data (100% Supabase)

| Service | Usage |
|---------|-------|
| Supabase Database | PostgreSQL hébergé |
| Supabase Auth | OTP Phone + OAuth (Google, Apple, Microsoft) |
| Supabase Storage | Images produits, catégories, avatars |
| Supabase Realtime | Notifications commandes temps réel |

### Services externes

| Service | Usage |
|---------|-------|
| CinetPay | Paiement Mobile Money (Wave, Orange Money, MTN) |
| Resend | Emails transactionnels |

### Packages essentiels

| Package | Usage |
|---------|-------|
| `@supabase/supabase-js` | Client Supabase |
| `@supabase/ssr` | Auth côté serveur |
| `next-safe-action` | Server Actions typés |
| `zod` | Validation des schémas |
| `zustand` | State management (panier) |
| `nuqs` | URL state (filtres) |
| `@tanstack/react-table` | Tables admin |
| `recharts` | Graphiques dashboard |
| `react-hook-form` | Formulaires |
| `react-dropzone` | Upload images |

### Composants Shadcn UI

```bash
npx shadcn@latest add button card input label form dialog sheet \
  dropdown-menu select checkbox radio-group table tabs toast \
  badge separator avatar skeleton carousel command alert-dialog \
  popover tooltip accordion sonner drawer progress
```

---

## 4. Structure du projet

```
dbs-store/
├── .env.local                    # Variables d'environnement
├── .env.example                  # Template
├── next.config.ts
├── tailwind.config.ts            # Thème Blue & Gold
├── package.json
├── tsconfig.json
├── middleware.ts                 # Auth middleware
│
├── public/
│   ├── images/
│   │   └── logo.svg
│   └── icons/
│
├── app/
│   ├── (auth)/                   # Routes authentification
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── verify-otp/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (store)/                  # Routes boutique (client)
│   │   ├── page.tsx              # Homepage
│   │   ├── layout.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── account/
│   │   │   ├── page.tsx
│   │   │   ├── addresses/
│   │   │   │   └── page.tsx
│   │   │   └── loyalty/
│   │   │       └── page.tsx
│   │   ├── wishlist/
│   │   │   └── page.tsx
│   │   └── search/
│   │       └── page.tsx
│   │
│   ├── admin/                    # Dashboard admin
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── customers/
│   │   │   └── page.tsx
│   │   ├── promotions/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── reviews/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── cinetpay/
│   │   │       └── route.ts
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
│
├── components/
│   ├── ui/                       # Shadcn UI
│   │
│   ├── store/                    # Composants boutique
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-gallery.tsx
│   │   ├── cart-sheet.tsx
│   │   ├── cart-item.tsx
│   │   ├── category-nav.tsx
│   │   ├── search-command.tsx
│   │   ├── price-display.tsx
│   │   ├── rating-stars.tsx
│   │   ├── review-card.tsx
│   │   ├── review-form.tsx
│   │   ├── promo-banner.tsx
│   │   └── checkout/
│   │       ├── checkout-steps.tsx
│   │       ├── address-form.tsx
│   │       ├── shipping-options.tsx
│   │       ├── payment-form.tsx
│   │       └── order-summary.tsx
│   │
│   ├── admin/                    # Composants admin
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   ├── recent-orders.tsx
│   │   ├── sales-chart.tsx
│   │   ├── product-form.tsx
│   │   ├── category-form.tsx
│   │   ├── promo-form.tsx
│   │   ├── image-upload.tsx
│   │   └── data-table/
│   │       ├── data-table.tsx
│   │       └── columns/
│   │
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── otp-input.tsx
│   │   ├── phone-input.tsx
│   │   └── oauth-buttons.tsx
│   │
│   └── shared/
│       ├── logo.tsx
│       ├── theme-toggle.tsx
│       ├── loading.tsx
│       ├── empty-state.tsx
│       └── confirm-dialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client navigateur
│   │   ├── server.ts             # Client serveur (RSC)
│   │   ├── admin.ts              # Client service role
│   │   ├── middleware.ts         # Helper middleware
│   │   └── storage.ts            # Helpers upload
│   │
│   ├── validations/
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── promo.ts
│   │
│   ├── utils.ts                  # cn, formatPrice, etc.
│   ├── constants.ts
│   └── config.ts
│
├── actions/                      # Server Actions
│   ├── auth.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── orders.ts
│   ├── cart.ts
│   ├── promotions.ts
│   ├── reviews.ts
│   ├── loyalty.ts
│   ├── upload.ts
│   └── admin/
│       ├── products.ts
│       ├── orders.ts
│       └── analytics.ts
│
├── hooks/
│   ├── use-cart.ts
│   ├── use-user.ts
│   ├── use-wishlist.ts
│   └── use-realtime-orders.ts
│
├── stores/
│   ├── cart-store.ts
│   └── ui-store.ts
│
├── types/
│   ├── index.ts
│   └── database.types.ts         # Généré par Supabase CLI
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── scripts/
    └── seed.ts
```

---

## 5. Configuration Supabase

### Clients Supabase

**Client navigateur (`lib/supabase/client.ts`):**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Client serveur (`lib/supabase/server.ts`):**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  )
}
```

**Client admin (`lib/supabase/admin.ts`):**

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Helpers Storage (`lib/supabase/storage.ts`)

```typescript
import { createClient } from './client'

const BUCKETS = {
  products: 'products',
  categories: 'categories',
  avatars: 'avatars',
} as const

type BucketName = keyof typeof BUCKETS

export async function uploadImage(
  bucket: BucketName,
  file: File,
  path?: string
): Promise<{ url: string; error: Error | null }> {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = path || `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKETS[bucket])
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { url: '', error }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKETS[bucket])
    .getPublicUrl(data.path)

  return { url: publicUrl, error: null }
}

export async function deleteImage(
  bucket: BucketName,
  path: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .remove([path])

  return { error }
}

export function getImageUrl(bucket: BucketName, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS[bucket]}/${path}`
}
```

---

## 6. Planning détaillé

### Vue globale (2 semaines)

```
SEMAINE 1: Foundation + Storefront
├── J1-J2: Setup projet & Supabase complet
├── J3-J4: Auth & Catalogue
└── J5: Panier & Wishlist

SEMAINE 2: Checkout + Admin + Polish  
├── J6-J7: Checkout & Paiement
├── J8-J9: Dashboard Admin
└── J10: Tests & déploiement
```

### Planning jour par jour

#### 📅 JOUR 1 — Setup Projet ✅ TERMINÉ

**Matin (4h)**
- [X] Créer repo GitHub
- [X] Init Next.js 16 avec TypeScript
- [X] Configurer Tailwind + thème Blue & Gold (/dbs blue gold them.md & /tailwind config.md)
- [X] Installer Shadcn UI + composants

**Après-midi (4h)**
- [X] Créer projet Supabase (local avec ports 44xx)
- [X] Exécuter script SQL (schema complet via migrations CLI)
- [X] Configurer Storage buckets (products, categories, avatars)
- [X] Générer types TypeScript (`pnpm supabase gen types typescript --local`)
- [X] Setup variables d'environnement (.env.local)

**Bonus réalisés:**
- [X] Créer structure des dossiers (actions/, hooks/, stores/, types/, lib/supabase/)
- [X] Setup clients Supabase (client.ts, server.ts, admin.ts, storage.ts)
- [X] Configurer middleware auth (middleware.ts)
- [X] Setup providers (ThemeProvider, Toaster)
- [X] Mise à jour layout avec metadata SEO

**Livrables:**
```
✅ Projet Next.js fonctionnel
✅ Supabase configuré (DB + Storage + Auth)
✅ Types TypeScript générés
✅ Thème DBS appliqué
✅ Structure projet complète
✅ Middleware auth configuré
```

---

#### 📅 JOUR 2 — Structure & Auth Setup

**Matin (4h)**
- [X] Créer structure des dossiers (fait en Jour 1)
- [X] Setup clients Supabase (client, server, admin) (fait en Jour 1)
- [X] Configurer middleware auth (fait en Jour 1)
- [ ] Créer composants shared (Logo, Loading, EmptyState)

**Après-midi (4h)**
- [ ] Layout store (Header, Footer, MobileNav)
- [ ] Setup Zustand store (cart)
- [ ] Configurer Supabase Auth providers (Phone, Google, Apple, Microsoft)
- [ ] Tester OTP en mode dev

**Livrables:**
```
✅ Structure projet complète
✅ Auth Supabase configuré
⬜ Header/Footer responsive
⬜ Cart store prêt
```

---

#### 📅 JOUR 3 — Authentification complète

**Matin (4h)**
- [ ] Page Login avec téléphone
- [ ] Composant PhoneInput (format CI +225)
- [ ] Composant OTPInput (6 digits)
- [ ] Page vérification OTP

**Après-midi (4h)**
- [ ] OAuth buttons (Google, Apple, Microsoft)
- [ ] Page Register
- [ ] Callback route (/api/auth/callback)
- [ ] Page profil utilisateur basique

**Livrables:**
```
✅ Login OTP fonctionnel
✅ OAuth connecté
✅ Session persistante
✅ Profil utilisateur
```

---

#### 📅 JOUR 4 — Catalogue Produits

**Matin (4h)**
- [ ] Server Action: getProducts (avec filtres)
- [ ] Page liste produits
- [ ] Composant ProductCard
- [ ] ProductGrid avec loading skeleton

**Après-midi (4h)**
- [ ] Recherche full-text (Supabase textSearch)
- [ ] Filtres (catégorie, prix, marque) avec nuqs
- [ ] Page détail produit
- [ ] Galerie images produit
- [ ] Section produits similaires

**Livrables:**
```
✅ Catalogue navigable
✅ Recherche fonctionnelle
✅ Filtres avec URL state
✅ Pages produits complètes
```

---

#### 📅 JOUR 5 — Panier & Wishlist

**Matin (4h)**
- [ ] CartSheet (drawer latéral)
- [ ] CartItem composant
- [ ] Actions panier (add, remove, update)
- [ ] Persistance localStorage + sync Supabase (si connecté)

**Après-midi (4h)**
- [ ] Page panier complète
- [ ] Application code promo (UI + validation)
- [ ] Page wishlist
- [ ] Toggle wishlist depuis ProductCard

**Livrables:**
```
✅ Panier fonctionnel avec persistance
✅ Wishlist connectée à Supabase
✅ Codes promo validés
```

---

#### 📅 JOUR 6 — Checkout Part 1

**Matin (4h)**
- [ ] Page checkout multi-étapes
- [ ] Étape 1: Sélection/ajout adresse
- [ ] AddressForm composant
- [ ] Server Action: createAddress, getAddresses

**Après-midi (4h)**
- [ ] Étape 2: Mode de livraison
- [ ] Affichage zones et tarifs
- [ ] Étape 3: Récapitulatif commande
- [ ] Calcul total avec remise et livraison

**Livrables:**
```
✅ Flow checkout complet (sans paiement)
✅ Gestion adresses
✅ Calcul des frais
```

---

#### 📅 JOUR 7 — Paiement & Commandes

**Matin (4h)**
- [ ] Intégration CinetPay
- [ ] Server Action: createPayment
- [ ] Page redirection paiement
- [ ] Webhook callback (/api/webhooks/cinetpay)

**Après-midi (4h)**
- [ ] Page confirmation commande
- [ ] Server Action: createOrder
- [ ] Page suivi commande
- [ ] Historique commandes user
- [ ] Setup Realtime pour notifications

**Livrables:**
```
✅ Paiement CinetPay intégré
✅ Commandes créées en BDD
✅ Suivi temps réel
```

---

#### 📅 JOUR 8 — Admin Dashboard Part 1

**Matin (4h)**
- [ ] Layout admin (Sidebar responsive, Header)
- [ ] AuthGuard admin (vérifier role)
- [ ] Dashboard home avec stats
- [ ] Graphique ventes (Recharts)

**Après-midi (4h)**
- [ ] DataTable générique
- [ ] Page liste produits admin
- [ ] Formulaire création/édition produit
- [ ] Upload images avec react-dropzone + Supabase Storage

**Livrables:**
```
✅ Dashboard avec stats
✅ CRUD produits complet
✅ Upload images fonctionnel
```

---

#### 📅 JOUR 9 — Admin Dashboard Part 2

**Matin (4h)**
- [ ] Page gestion commandes
- [ ] Détail commande + changement statut
- [ ] Page gestion catégories
- [ ] Page gestion stocks/inventaire

**Après-midi (4h)**
- [ ] Page promotions (CRUD)
- [ ] Page modération avis
- [ ] Page clients
- [ ] Settings (zones livraison)

**Livrables:**
```
✅ Gestion commandes complète
✅ Gestion promotions
✅ Admin fonctionnel
```

---

#### 📅 JOUR 10 — Polish & Déploiement

**Matin (4h)**
- [ ] Tests manuels complets
- [ ] Fix bugs critiques
- [ ] SEO (metadata, sitemap, robots.txt)
- [ ] Optimisation images

**Après-midi (4h)**
- [ ] Déploiement Vercel
- [ ] Configuration domaine
- [ ] Variables d'environnement production
- [ ] Test paiement en production
- [ ] Documentation

**Livrables:**
```
✅ App déployée sur Vercel
✅ MVP prêt !
```

---

## 7. Exemples de requêtes Supabase

### Produits avec catégorie

```typescript
// Récupérer produits avec leur catégorie
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(id, name, slug)
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .range(0, 11)
```

### Recherche full-text

```typescript
// Recherche dans nom et description
const { data: results } = await supabase
  .from('products')
  .select('*')
  .textSearch('name', query, { type: 'websearch' })
  .eq('is_active', true)
```

### Commande avec items

```typescript
// Récupérer commande avec ses items
const { data: order } = await supabase
  .from('orders')
  .select(`
    *,
    items:order_items(
      *,
      product:products(id, name, slug)
    ),
    user:users(full_name, phone)
  `)
  .eq('id', orderId)
  .single()
```

### Stats dashboard

```typescript
// Stats des 30 derniers jours
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const { data: stats } = await supabase
  .from('orders')
  .select('total, created_at')
  .gte('created_at', thirtyDaysAgo.toISOString())
  .eq('payment_status', 'paid')
```

### Realtime commandes admin

```typescript
// Écouter les nouvelles commandes
const channel = supabase
  .channel('admin-orders')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
    },
    (payload) => {
      console.log('Nouvelle commande:', payload.new)
      // Jouer un son, afficher notification, etc.
    }
  )
  .subscribe()
```

---

## 8. Intégrations tierces

### CinetPay (Paiement)

**Documentation:** https://docs.cinetpay.com

**Flow d'intégration:**

```typescript
// 1. Créer paiement
const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: orderId,
    amount: total,
    currency: 'XOF',
    description: `Commande ${orderNumber}`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cinetpay`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`,
    channels: 'ALL', // ou 'MOBILE_MONEY'
    customer_name: customerName,
    customer_phone_number: customerPhone,
  }),
})

// 2. Rediriger vers payment_url
const { data } = await response.json()
redirect(data.payment_url)
```

### Resend (Emails)

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'DBS Store <commandes@dbsstore.ci>',
  to: customerEmail,
  subject: `Confirmation commande #${orderNumber}`,
  react: OrderConfirmationEmail({ order }),
})
```

---

## 9. Checklist de lancement

### ✅ Avant le lancement

**Supabase:**
- [ ] RLS activé sur toutes les tables
- [ ] Storage buckets configurés (public)
- [ ] Auth providers activés
- [ ] Types générés à jour

**Vercel:**
- [ ] Variables d'environnement production
- [ ] Domaine configuré
- [ ] Analytics activé

**Paiement:**
- [ ] Compte CinetPay validé
- [ ] Webhook URL configuré
- [ ] Test paiement réel effectué

**Contenu:**
- [ ] Au moins 10 produits
- [ ] Images optimisées
- [ ] Catégories créées
- [ ] Zones livraison configurées

---

## 📊 Limites plans gratuits

| Service | Limite | Suffisant MVP ? |
|---------|--------|-----------------|
| Supabase DB | 500 MB | ✅ Oui |
| Supabase Storage | 1 GB | ✅ Oui |
| Supabase Auth | 50K MAU | ✅ Oui |
| Supabase Realtime | 200 concurrent | ✅ Oui |
| Vercel | 100 GB bandwidth | ✅ Oui |
| Resend | 100 emails/jour | ⚠️ Limite si beaucoup de commandes |

---

*Document mis à jour le 01/12/2025*  
*DBS Store — Plan de développement v1.1 (Stack Supabase Native)*