# Administration DBS Store — Design

Date : 2026-03-02

## Contexte

Interface d'administration back-office pour DBS Store. Réservée aux membres de l'organisation Better Auth (`dbs-store`). Rôles : `owner`, `admin`, `member`.

## Approche retenue

Route group Next.js `(admin)` avec Server Components + Server Actions. Middleware Next.js pour la protection des routes. Cohérent avec le pattern `(compte)` déjà en place.

---

## Architecture & Routes

### Structure de fichiers

```
app/(admin)/
  layout.tsx                    # Sidebar layout + vérification session/org
  admin/
    page.tsx                    # Dashboard (stats)
    produits/
      page.tsx                  # Liste produits (tableau paginé)
      nouveau/page.tsx          # Formulaire création
      [id]/
        page.tsx                # Formulaire édition
    commandes/
      page.tsx                  # Liste commandes (filtres statut)
      [id]/page.tsx             # Détail + mise à jour statut
    equipe/
      page.tsx                  # Membres + invitations

middleware.ts                   # Protection /admin/* et /compte/*

lib/actions/
  admin-products.ts             # createProduct, updateProduct, deleteProduct
  admin-orders.ts               # updateOrderStatus
  admin-team.ts                 # inviteMember, updateMemberRole, removeMember
  admin-upload.ts               # generatePresignedUrl (R2)

lib/data/
  admin-stats.ts                # Requêtes dashboard
  admin-products.ts             # Liste paginée + recherche
  admin-orders.ts               # Liste + filtres

components/admin/
  sidebar.tsx                   # Navigation latérale
  product-form.tsx              # Formulaire création/édition produit (partagé)
  image-uploader.tsx            # Dropzone → presigned URL → R2
  spec-editor.tsx               # Éditeur clé-valeur dynamique
  order-status-widget.tsx       # Widget mise à jour statut commande
  stats-card.tsx                # Carte stat dashboard
```

### Middleware

| Pattern | Règle |
|---------|-------|
| `/admin/:path*` | Redirige `/connexion` si pas de session ; `/` si pas membre org |
| `/compte/:path*` | Redirige `/connexion` si pas de session |
| Reste | Public |

### Variables d'environnement R2

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=           # ex: https://cdn.dbs-store.ci
```

---

## Section 1 : Dashboard `/admin`

Stats calculées côté serveur au rendu (pas de polling temps réel) :

| Carte | Donnée |
|-------|--------|
| Commandes du jour | `COUNT` orders avec `created_at >= today` |
| Revenus du mois | `SUM(total)` orders `confirmed/delivered` du mois |
| Commandes en attente | `COUNT` orders `status = "pending"` |
| Produits stock faible | `COUNT` products avec `stock <= 3` |

Graphique des commandes des 7 derniers jours (barres, composant client léger).

---

## Section 2 : Gestion des produits

### Liste (`/admin/produits`)

- Tableau : image miniature, nom, catégorie, prix, stock, badge, statut actif
- Recherche textuelle (nom/marque) + filtre catégorie
- Pagination côté serveur (25 par page)
- Actions par ligne : éditer, désactiver/activer, supprimer (owner uniquement)

### Formulaire produit (création + édition)

| Champ | Type |
|-------|------|
| Nom | text |
| Slug | text (auto-généré, éditable) |
| Catégorie / Sous-catégorie | select (depuis `categories` statiques) |
| Prix / Ancien prix | number (FCFA) |
| Marque | text |
| Stock | number |
| Badge | select (`Nouveau / Populaire / Promo / Aucun`) |
| Actif | toggle |
| Description | textarea |
| Specs | éditeur clé-valeur dynamique |
| Images | dropzone multi-fichiers → R2 via presigned URL |

### Upload R2

Server Action `generatePresignedUrl(filename, contentType)` retourne une URL PUT signée (expiration 5 min). Le client upload directement vers R2 (PUT), puis stocke l'URL publique dans le champ images du formulaire.

### Suppression

- Défaut : soft delete (`is_active = false`)
- Destruction réelle : `owner` uniquement

---

## Section 3 : Gestion des commandes

### Liste (`/admin/commandes`)

- Tableau : ID (tronqué), client, total, mode paiement, statut commande, statut paiement, date
- Filtre par statut, tri date décroissant
- Liens vers le détail

### Détail (`/admin/commandes/[id]`)

- Infos livraison (nom, téléphone, ville, adresse, notes)
- Articles (image, nom, quantité, prix unitaire, total ligne)
- Totaux (sous-total, frais, total)
- Widget de mise à jour statut (transitions autorisées) :

```
pending    → confirmed | cancelled
confirmed  → shipped   | cancelled
shipped    → delivered
```

- Statut paiement : passe automatiquement à `paid` quand `delivered` + `payment_method = "cod"`

---

## Section 4 : Gestion de l'équipe

### Liste (`/admin/equipe`)

- Tableau des membres : nom, email, rôle, date d'ajout
- Actions (owner seulement) : changer le rôle, retirer le membre

### Invitation

- Formulaire : email + rôle (`admin` ou `member`)
- Server Action `inviteMember(email, role)` → appelle l'API Better Auth `organization.inviteMember`
- L'invité reçoit un email d'invitation (géré par Better Auth + Resend)

### Contrôle d'accès

| Action | owner | admin | member |
|--------|-------|-------|--------|
| Voir la liste | ✓ | ✓ | ✓ |
| Inviter | ✓ | ✗ | ✗ |
| Changer le rôle | ✓ | ✗ | ✗ |
| Retirer un membre | ✓ | ✗ | ✗ |

---

## Tests

- Middleware : tests unitaires Vitest pour les redirections selon session/org
- Server Actions : tests unitaires avec mock Drizzle pour les validations métier
- Composants critiques : ProductForm (validation), OrderStatusWidget (transitions)

---

## Contraintes

- `better-sqlite3` transactions synchrones — pas d'`async` dans les callbacks `db.transaction()`
- Better Auth org middleware : vérification via `auth.api.getSession()` dans `middleware.ts`
- Presigned URLs R2 : utiliser l'SDK `@aws-sdk/s3-request-presigner` (compatible R2)
