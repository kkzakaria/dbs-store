# Design : Refonte des pages d'authentification

**Date :** 2026-02-19
**Statut :** Approuvé

## Contexte

Les pages d'authentification (connexion, inscription, mot de passe oublié, réinitialisation) sont fonctionnelles mais manquent d'identité visuelle et d'ergonomie. Ce document décrit la refonte complète incluant design, UX et un flux OTP réel pour la réinitialisation de mot de passe.

## Corrections à apporter

### Bug AppBar sur les pages d'auth

L'AppBar s'affiche actuellement sur les pages d'authentification car elle est montée dans `app/layout.tsx` (layout racine). Solution : déplacer l'AppBar dans un groupe de routes `(main)` qui ne s'applique pas aux pages d'auth.

```
app/
  layout.tsx              — layout racine sans AppBar
  (main)/
    layout.tsx            — inclut l'AppBar
    page.tsx              — page d'accueil
  (auth)/
    layout.tsx            — fond dégradé, sans AppBar
    connexion/
    inscription/
    mot-de-passe-oublie/
    reinitialiser/
```

## Design Visuel

### Mise en page

- Layout type **carte centrée** avec fond dégradé `from-gray-50 to-white`
- Motif de grille subtil en SVG en arrière-plan pour de la texture
- Centrage vertical/horizontal (déjà en place dans `(auth)/layout.tsx`)

### AuthCard enrichie

- Logo "DBS Store" en haut (icône Lucide + texte stylisé en gras)
- `shadow-xl` pour donner du relief
- Largeur maximale augmentée à `max-w-[420px]`
- Pas de changement de couleurs primaires (garde le thème actuel)

### Composants UX nouveaux

**Toggle mot de passe**
- Icône `Eye`/`EyeOff` (Lucide) à droite du champ
- Bascule entre `type="password"` et `type="text"`
- S'applique à : connexion, inscription, réinitialisation

**Icônes boutons sociaux**
- Google : SVG multicolor inline
- Facebook : SVG bleu inline
- Apple : SVG noir/blanc selon mode inline

**Indicateur force du mot de passe** (inscription uniquement)
- 4 segments colorés sous le champ de saisie
- Niveaux : faible (rouge), moyen (orange), bien (jaune), fort (vert)
- Label texte correspondant

**Saisie OTP**
- 6 champs individuels de 1 caractère numérique
- Auto-focus automatique sur le champ suivant
- Paste automatique : coller le code complet remplit tous les champs
- Style sobre, cases avec bordure arrondie

## Flux OTP — Réinitialisation de mot de passe

### Configuration backend (Better Auth)

Ajouter le plugin `emailOTP` dans `lib/auth.ts` :

```typescript
import { emailOTP } from "better-auth/plugins";

// dans la config Better Auth
plugins: [
  emailOTP({
    async sendVerificationOTP({ email, otp, type }) {
      // Envoyer l'email avec le code OTP
      await sendEmail({ to: email, subject: "Code de réinitialisation", otp });
    },
  }),
]
```

### Nouveau flux (3 étapes)

**Étape 1 — `/mot-de-passe-oublie`**
- Formulaire email existant
- Action : `authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" })`
- Après envoi réussi : stocker l'email en sessionStorage, rediriger vers `/reinitialiser`

**Étape 2 — `/reinitialiser`** (nouvelle UI)
- Composant OTP à 6 chiffres
- Affiche l'email masqué (ex: `v**s@exemple.com`)
- Lien "Renvoyer le code"
- Action : `authClient.emailOtp.verifyEmail({ email, otp })` ou équivalent Better Auth
- Après validation OTP réussie : rediriger vers `/reinitialiser/nouveau-mot-de-passe` en passant le token

**Étape 3 — `/reinitialiser/nouveau-mot-de-passe`**
- Formulaire nouveau MDP + confirmation
- Toggle afficher/masquer
- Action : `authClient.resetPassword({ newPassword, token })`
- Après succès : rediriger vers `/connexion`

### Gestion des erreurs OTP

- Code expiré → message clair + bouton renvoyer
- Code incorrect → `setError("Code incorrect, vérifiez votre email")`
- Email non trouvé en sessionStorage → redirection vers `/mot-de-passe-oublie`

## Tests

Fichiers de tests à créer dans `tests/` :

- `tests/components/auth/password-toggle.test.tsx` — toggle afficher/masquer
- `tests/components/auth/password-strength.test.tsx` — indicateur force
- `tests/components/auth/otp-input.test.tsx` — saisie, auto-focus, paste
- `tests/app/(auth)/reinitialiser/page.test.tsx` — flux OTP page

Tests couvrant : rendu initial, interactions utilisateur, cas d'erreur.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `app/layout.tsx` | Retirer l'AppBar |
| `app/(main)/layout.tsx` | Créer, y mettre l'AppBar |
| `app/(main)/page.tsx` | Déplacer page d'accueil |
| `app/(auth)/layout.tsx` | Enrichir fond dégradé + motif |
| `app/(auth)/connexion/page.tsx` | Toggle MDP, logo |
| `app/(auth)/inscription/page.tsx` | Toggle MDP, force MDP, logo |
| `app/(auth)/mot-de-passe-oublie/page.tsx` | Appel OTP, logo |
| `app/(auth)/reinitialiser/page.tsx` | Composant OTP 6 chiffres |
| `app/(auth)/reinitialiser/nouveau-mot-de-passe/page.tsx` | Créer, formulaire MDP |
| `components/auth/auth-card.tsx` | Logo DBS Store, shadow-xl |
| `components/auth/social-buttons.tsx` | Icônes SVG |
| `components/auth/password-toggle.tsx` | Créer |
| `components/auth/password-strength.tsx` | Créer |
| `components/auth/otp-input.tsx` | Créer |
| `lib/auth.ts` | Plugin emailOTP |
