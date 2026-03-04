# Hero Carousel + Administration — Design

**Date :** 2026-03-04
**Branche :** fix/middleware-et-validation-produits
**Statut :** Approuvé

---

## Contexte

L'hero actuel (`app/(main)/page.tsx`) est un bloc texte centré statique avec gradient. L'objectif est de le remplacer par un carousel de bannières éditables depuis l'administration.

---

## Décisions clés

| Sujet | Décision |
|---|---|
| Format hero | Carousel de bannières (max 5 slides, auto-play 4s) |
| Images | Upload local (`public/banners/`) OU URL externe, avec aperçu |
| Stockage | SQLite + Drizzle (nouvelle table `hero_slides`) |
| Admin | Page `/admin/hero` avec liste drag-and-drop + formulaire |

---

## Base de données

### Table `hero_slides`

```sql
id                  TEXT PRIMARY KEY
title               TEXT NOT NULL
subtitle            TEXT
badge               TEXT                        -- nullable, ex: "Promo -20%"
image_url           TEXT NOT NULL
text_align          TEXT DEFAULT 'center'       -- 'left' | 'center' | 'right'
overlay_color       TEXT DEFAULT '#000000'
overlay_opacity     INTEGER DEFAULT 40          -- 0-100
cta_primary_label   TEXT
cta_primary_href    TEXT
cta_secondary_label TEXT
cta_secondary_href  TEXT
is_active           INTEGER DEFAULT 1           -- boolean
sort_order          INTEGER DEFAULT 0
created_at          INTEGER NOT NULL            -- timestamp
updated_at          INTEGER NOT NULL            -- timestamp
```

Migration via Drizzle (`bun run db:migrate`).

---

## Frontend — Composant Hero

### Fichiers

- `components/hero/hero-carousel.tsx` — Client component principal
- `lib/data/hero-slides.ts` — Query `getActiveHeroSlides(db)`

### Comportement

- Image de fond avec `next/image` (fill + objectFit cover)
- Overlay couleur configurable avec opacité
- Texte positionné selon `text_align` (left/center/right)
- Badge optionnel affiché au-dessus du titre
- 2 CTAs : primaire (Button) + secondaire (Button outline)
- Auto-play 4 secondes, pause au hover
- Navigation : dots cliquables + flèches prev/next
- Transition : fade CSS (pas de lib externe)
- Fallback : si 0 slides actives → ancien hero statique inline

### Intégration

Dans `app/(main)/page.tsx` : `await getActiveHeroSlides(db)` remplace le bloc `<section>` hero existant.

---

## Administration

### Routes

- `app/(admin)/admin/hero/page.tsx` — Liste des slides
- `app/(admin)/admin/hero/nouveau/page.tsx` — Création
- `app/(admin)/admin/hero/[id]/page.tsx` — Édition

### Composants admin

- `components/admin/hero-slide-list.tsx` — Tableau avec drag-and-drop (réordonnement via `sort_order`)
- `components/admin/hero-slide-form.tsx` — Formulaire complet

### Champs du formulaire

- Image : zone upload drag-drop + champ URL, avec aperçu live
- Titre (requis), sous-titre (optionnel), badge (optionnel)
- Position texte : radio gauche/centre/droite
- Overlay : color picker + slider opacité 0–100%
- CTA primaire : label + href
- CTA secondaire : label + href
- Toggle actif/inactif

### Server Actions

`lib/actions/hero-slides.ts` :
- `createHeroSlide(formData)`
- `updateHeroSlide(id, formData)`
- `deleteHeroSlide(id)`
- `reorderHeroSlides(ids: string[])` — met à jour `sort_order`

### API Route upload

`app/api/admin/upload/route.ts` — POST multipart, stocke dans `public/banners/`, retourne l'URL.

### Sidebar

Ajout item **"Hero"** (icône `ImagePlay`) dans `components/admin/sidebar.tsx`, entre Dashboard et Produits.

---

## Flux de données

```
Admin édite slide
  → Server Action → DB (hero_slides)

Visiteur charge homepage
  → getActiveHeroSlides(db) → slides triés par sort_order
  → HeroCarousel (client) → auto-play + navigation
```

---

## Points d'attention

- `better-sqlite3` transactions synchrones → pas d'`await` dans les callbacks
- Upload local : valider type MIME (image/*) et taille max (ex: 5 MB)
- Drag-and-drop : utiliser `@dnd-kit/sortable` (déjà disponible ou à installer)
- Fallback si 0 slides actives pour éviter une page hero vide
