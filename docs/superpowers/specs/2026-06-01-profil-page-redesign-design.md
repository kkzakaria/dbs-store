# Refonte de la page profil + édition de l'identité (Sous-projet A)

**Date :** 2026-06-01
**Statut :** Validé, prêt pour planification

## Contexte

La page profil (`app/(compte)/compte/profil/page.tsx`) est actuellement minimaliste :
une carte en lecture seule affichant Nom, Email, Email vérifié, plus un bouton de
déconnexion. Aucune action d'édition n'est possible.

Ce spec couvre le **sous-projet A** : refonte visuelle de la page profil et ajout de
l'édition de l'identité (nom, email, mot de passe, avatar).

Le **sous-projet B** (carnet d'adresses de livraison : nouvelle table, CRUD sous
`/compte`, intégration au checkout) fera l'objet d'un spec séparé et n'est **pas**
traité ici.

### État de l'existant

- **Auth** : better-auth avec email+password (`minPasswordLength: 8`), plugin
  `emailOTP`, plugin `organization`, et providers sociaux (Google/Facebook/Apple)
  configurables. `lib/auth.ts`.
- **Modèle utilisateur** (table `user`, migration `0001_init.sql`) : `id`, `name`,
  `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`.
- **Client d'auth** (`lib/auth-client.ts`) : expose `signIn`, `signUp`, `signOut`,
  `useSession`, `organization`. N'expose **pas** encore `updateUser`,
  `changePassword`, `changeEmail` (fournis nativement par `authClient`).
- **Infra R2** : `lib/actions/admin-upload.ts` génère des URL présignées via le
  client S3 (`@aws-sdk/client-s3`), mais l'action est gardée par `requireOrgMember()`
  (admin uniquement).
- **UI** : Shadcn UI (Radix), Tailwind v4, layout compte avec nav latérale
  (`app/(compte)/compte/layout.tsx`).

## Objectifs

1. Refonte visuelle de la page profil (en-tête avec avatar, cartes structurées).
2. Édition du **nom**.
3. Changement de l'**email** (avec vérification par lien).
4. Changement du **mot de passe** (comptes credential uniquement).
5. Upload d'**avatar** (R2).

## Approche retenue

**Approche 1 — En-tête + sections avec édition par dialogue.**

La page serveur affiche un en-tête et des cartes thématiques. Chaque action
d'édition ouvre un `Dialog` shadcn contenant un petit formulaire client dédié. Le
rendu serveur est conservé ; on ajoute des îlots clients ciblés. Séparation nette
des préoccupations (le mot de passe n'est pas mêlé au nom).

Approches écartées : page à onglets (surdimensionnée pour si peu de champs) ; un seul
gros formulaire inline (mélange identité et sécurité, mauvaise UX pour les actions à
vérification).

## Design détaillé

### 1. Mise en page & composants

`app/(compte)/compte/profil/page.tsx` (server component, reste
`export const dynamic = "force-dynamic"`) :

- Récupère `getCachedSession()`.
- Récupère les comptes liés via `auth.api.listUserAccounts({ headers: await headers() })`
  pour déterminer si l'utilisateur possède un compte credential (provider `credential`)
  → contrôle l'affichage de la section mot de passe.
- **En-tête** : avatar (image `user.image` ou initiales sur fond coloré dérivé du
  nom), nom, email avec badge « Vérifié » / « Non vérifié », et « Membre depuis
  {createdAt} » formaté en français (`Intl.DateTimeFormat("fr-FR")`).
- **Carte « Informations personnelles »** : lignes Nom et Email, chacune avec un
  bouton « Modifier » ouvrant un `Dialog`.
- **Carte « Sécurité »** : bouton « Changer le mot de passe » (affiché seulement si
  compte credential), et le bouton de déconnexion existant (`LogoutButton`) déplacé
  ici.

Composants (un fichier par responsabilité, sous `components/compte/`) :

- `profil-avatar.tsx` — avatar/initiales réutilisable, server-safe (pas de `"use client"`).
  Props : `name`, `image`, `size`. Affiche `<img>` si `image`, sinon les initiales.
- `avatar-upload.tsx` (client) — superpose un bouton d'upload sur l'avatar de l'en-tête.
- `edit-name-dialog.tsx` (client)
- `edit-email-dialog.tsx` (client)
- `change-password-dialog.tsx` (client)

### 2. Avatar (upload R2)

- **Refactor** : extraire la logique R2 partagée de `lib/actions/admin-upload.ts`
  dans un nouveau module `lib/r2.ts` :
  - `getR2Config()`, `createR2Client(...)`, `ALLOWED_CONTENT_TYPES`, et la génération
    d'URL présignée paramétrée par préfixe de clé.
  - `admin-upload.ts` est mis à jour pour consommer `lib/r2.ts` (comportement inchangé).
- **Nouvelle action** `lib/actions/avatar-upload.ts` :
  `generateAvatarUploadUrl(filename, contentType)` :
  - Gardée par `getCachedSession()` — rejette si aucun utilisateur connecté.
  - Valide `contentType` contre `ALLOWED_CONTENT_TYPES`.
  - Clé objet préfixée `avatars/{userId}/`.
  - Retourne `{ uploadUrl, publicUrl }`.
- **Client** (`avatar-upload.tsx`) : sélection fichier → `fetch(uploadUrl, { method: "PUT", body: file })`
  → `authClient.updateUser({ image: publicUrl })` → `router.refresh()`.

### 3. Édition identité

- **Nom** (`edit-name-dialog.tsx`) : `authClient.updateUser({ name })`.
  Validation : non vide après trim, ≤ 100 caractères. `router.refresh()` après succès.
- **Email** (`edit-email-dialog.tsx`) :
  `authClient.changeEmail({ newEmail, callbackURL: "/compte/profil" })`.
  L'email courant étant vérifié, better-auth envoie un **lien de vérification à
  l'email actuel** ; le changement n'est appliqué qu'après clic sur ce lien.
  UI après envoi : « Un lien de confirmation a été envoyé à votre adresse actuelle. »
  Validation : format email basique côté client.

### 4. Sécurité (mot de passe)

- `change-password-dialog.tsx` :
  `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`.
- Champs : mot de passe actuel, nouveau, confirmation.
- Validation : nouveau ≥ 8 caractères (cohérent avec `minPasswordLength`),
  confirmation identique au nouveau.
- Section entièrement masquée si l'utilisateur n'a pas de compte credential (compte
  social uniquement).

### 5. Modifs config & client

- `lib/auth.ts` : ajouter le bloc `user.changeEmail` :
  ```ts
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
        if (!env.RESEND_API_KEY) {
          console.log(`[changeEmail DEV] from=${user.email} to=${newEmail} url=${url}`);
          return;
        }
        // Envoi via l'infra email existante (lib/email.ts) — voir plan d'implémentation.
      },
    },
  },
  ```
- `lib/auth-client.ts` : ajouter `updateUser`, `changePassword`, `changeEmail` à
  l'export déstructuré depuis `authClient`.

### 6. Gestion d'erreurs

- Chaque dialogue : état `loading` ; affichage du message d'erreur retourné par
  better-auth (ex. mauvais mot de passe actuel, email déjà utilisé). **Aucun échec
  silencieux** — toute erreur est remontée à l'utilisateur.
- Action avatar : validation type/taille côté serveur, erreur explicite levée ; le
  client l'affiche (message ou toast).
- Boutons désactivés pendant l'envoi (anti double-soumission).

### 7. Tests (Vitest + React Testing Library)

- `profil-avatar` : rend les initiales sans `image` ; rend l'`<img>` avec `image`.
- `edit-name-dialog` : champ vide bloque la soumission ; succès appelle `updateUser`
  (mock `authClient`).
- `edit-email-dialog` : email invalide bloque ; succès appelle `changeEmail` et
  affiche le message de confirmation.
- `change-password-dialog` : confirmation non concordante bloque ; nouveau < 8
  caractères bloque ; succès appelle `changePassword`.
- `generateAvatarUploadUrl` : rejet si non connecté ; rejet si type non autorisé.
- Page profil : la section mot de passe est masquée pour un compte social
  (mock `listUserAccounts`).

### 8. Fichiers touchés

**Modifiés :**
- `app/(compte)/compte/profil/page.tsx`
- `lib/auth.ts`
- `lib/auth-client.ts`
- `lib/actions/admin-upload.ts` (refactor vers `lib/r2.ts`, comportement inchangé)

**Nouveaux :**
- `lib/r2.ts`
- `lib/actions/avatar-upload.ts`
- `components/compte/profil-avatar.tsx`
- `components/compte/avatar-upload.tsx`
- `components/compte/edit-name-dialog.tsx`
- `components/compte/edit-email-dialog.tsx`
- `components/compte/change-password-dialog.tsx`
- Tests miroirs sous `tests/`.

## Risques & points d'attention

- **Changement d'email (risque le plus élevé)** : flux de vérification par lien +
  config serveur `user.changeEmail` + envoi d'email réel. Nécessite un template/route
  d'email dans `lib/email.ts`. En dev (sans `RESEND_API_KEY`), l'URL est loggée en
  console (cohérent avec le pattern OTP existant).
- **Comptes sociaux** : bien masquer la section mot de passe pour éviter une action
  impossible (`changePassword` échouerait sans credential).
- **Gotcha projet** : la page conserve `export const dynamic = "force-dynamic"` car
  elle appelle `getCachedSession()` / bindings Cloudflare indisponibles au prerender.
- **Server actions publiques** : `generateAvatarUploadUrl` valide ses entrées au
  runtime (type de fichier) — les types TS ne protègent pas.

## Hors périmètre

- Carnet d'adresses de livraison (sous-projet B, spec séparé).
- Gestion/lien des comptes sociaux (link/unlink providers).
- Suppression de compte.
