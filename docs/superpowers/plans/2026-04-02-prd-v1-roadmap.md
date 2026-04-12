# DBS Store — PRD v1 Roadmap

> **For agentic workers:** Each phase is an independent unit. For each phase: invoke `superpowers:brainstorming` to design, then `superpowers:writing-plans` to plan, then execute. Do NOT start a phase without completing the previous one's checkpoint.

**Goal:** Complete the 9 remaining v1 features, one phase at a time, with brainstorming + planning + execution for each.

**Principe:** Chaque phase fait l'objet de son propre cycle brainstorm → plan → exécution → review → merge → deploy. Pas de phase suivante tant que le checkpoint de la phase courante n'est pas validé.

---

## Phase 1 — CI/CD GitHub Actions + branch protection

**Statut : DONE**

- [x] CI workflow (lint + test) sur PRs
- [x] Deploy workflow (build + D1 migrate + wrangler deploy) sur merge
- [x] Branch protection + squash merge
- [x] Secrets Cloudflare configurés
- [x] Premier deploy prod réussi
- [x] Fix tests, build loop, prerender

**Checkpoint :** CI verte, deploy prod fonctionnel.

---

## Phase 2 — Catégories dynamiques en D1 + admin CRUD

**Statut : DONE**

- [x] Table categories en D1 avec données migrées
- [x] Admin CRUD catégories et sous-catégories
- [x] Toutes les pages storefront utilisent les catégories D1
- [x] Tests passent, CI verte, deploy prod OK

---

## Phase 3 — Page Recherche

**Statut : DONE**

- [x] Page /recherche avec résultats produits (LIKE sur nom, description, marque)
- [x] Filtres horizontaux (catégorie, prix, marque, tri)
- [x] Pagination "Charger plus" (12 produits/batch)
- [x] Suggestions live dans l'overlay (debounce 300ms, max 5, après 3 chars)
- [x] État vide avec produits populaires
- [x] Validation server actions + LIKE escape + ARIA combobox
- [x] Dev local avec better-sqlite3 (bun run dev sur port 33000)
- [x] 63+ tests, CI verte

---

## Phase 4 — Cloudflare KV (sessions, cache)

**Statut : DONE**

**Scope :**
- KV namespace pour le cache de navigation (catégories)
- KV pour le cache incrémental Next.js (ISR)
- Configuration open-next.config.ts avec kvIncrementalCache
- Bindings KV dans wrangler.jsonc

**Checkpoint :**
- [x] KV configuré et fonctionnel
- [x] Cache navigation accélère le chargement
- [x] Tests passent, CI verte, deploy prod OK

---

## Phase 5 — Cloudflare Queue (emails async)

**Statut : DONE**

**Scope (révisé) :**
- Cloudflare Queue pour l'envoi d'emails (OTP auth, futurs emails) en asynchrone
- Helper générique `enqueueEmail` réutilisable (Phase 7+)
- Dead Letter Queue (`dbs-store-emails-dlq`) pour les échecs définitifs
- Fallback synchrone en dev local Node
- **Hors scope** : image processing (reporté — pas de besoin concret, Workers sans `sharp` natif, Next.js Image suffit)

**Checkpoint :**
- [x] Queues créées en prod (`dbs-store-emails`, `dbs-store-emails-dlq`)
- [x] Producer + consumer + DLQ configurés dans `wrangler.jsonc`
- [x] `sendOtpEmail` rétrocompatible passe par la queue
- [x] Tests passent, CI verte, deploy prod OK

---

## Phase 6 — Page Offres/Promotions

**Statut : DONE**

**Scope :**
- Page /offres listant les produits avec remise (old_price défini)
- Filtres par catégorie, tri par réduction
- Badges promo visibles
- Lien dans la navigation

**Checkpoint :**
- [x] Page offres fonctionnelle avec produits en promo
- [x] Accessible depuis la navigation
- [x] Tests passent, CI verte, deploy prod OK

---

## Phase 7 — Page Support

**Statut : DONE**

**Scope :**
- Page /support avec FAQ (accordion Shadcn, données statiques)
- Formulaire de contact (server action + enqueueEmail via Queue)
- Lien Support dans la navigation desktop et mobile

**Checkpoint :**
- [x] FAQ affichée
- [x] Formulaire de contact fonctionnel
- [x] Tests passent, CI verte, deploy prod OK

---

## Phase 8 — Newsletter

**Statut : A faire**

**Scope :**
- Table newsletter_subscribers en D1
- Server action pour inscription
- Validation email + protection anti-spam (rate limit ou honeypot)
- Connecter le formulaire newsletter existant sur la homepage

**Checkpoint :**
- [ ] Inscription newsletter fonctionnelle
- [ ] Données stockées en D1
- [ ] Tests passent, CI verte, deploy prod OK

---

## Phase 9 — Pages légales

**Statut : A faire**

**Scope :**
- /a-propos — présentation DBS Store
- /mentions-legales — mentions légales UEMOA
- /confidentialite — politique de confidentialité
- Liens dans le footer

**Checkpoint :**
- [ ] 3 pages accessibles
- [ ] Liens footer fonctionnels
- [ ] Tests passent, CI verte, deploy prod OK

---

## Phase 10 — SEO

**Statut : A faire**

**Scope :**
- Sitemap XML dynamique (produits, catégories)
- robots.txt
- Metadata dynamiques par page (titre, description, Open Graph)
- Structured data (JSON-LD) pour les produits

**Checkpoint :**
- [ ] Sitemap accessible à /sitemap.xml
- [ ] robots.txt configuré
- [ ] Chaque page a des metadata pertinents
- [ ] Tests passent, CI verte, deploy prod OK

---

## Résumé

| Phase | Feature | Complexité | Statut |
|-------|---------|------------|--------|
| 1 | CI/CD | Moyenne | **Done** |
| 2 | Catégories dynamiques | Haute | **Done** |
| 3 | Recherche | Moyenne | **Done** |
| 4 | Cloudflare KV | Moyenne | **Done** |
| 5 | Cloudflare Queue | Moyenne | **Done** |
| 6 | Offres/Promotions | Faible | **Done** |
| 7 | Support | Faible | **Done** |
| 8 | Newsletter | Faible | A faire |
| 9 | Pages légales | Faible | A faire |
| 10 | SEO | Faible | A faire |

**Pour démarrer une phase :** demande "lance la phase N" et le cycle brainstorm → plan → exécution se déclenche automatiquement.
