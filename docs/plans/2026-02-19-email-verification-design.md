# Design : Vérification email après inscription

**Date :** 2026-02-19
**Statut :** Approuvé

## Contexte

Actuellement, `signUp.email` crée le compte et connecte l'utilisateur immédiatement sans vérifier l'email. Ce document décrit l'ajout d'une vérification OTP obligatoire après l'inscription, bloquant l'accès aux espaces protégés tant que l'email n'est pas vérifié.

## Flux

```
Inscription → signUp.email() → sendVerificationOtp(email, "email-verification")
           → sessionStorage.otp_email = email
           → redirect /verifier-email

/verifier-email → OtpInput (6 chiffres) + bouton "Vérifier"
               → authClient.emailOtp.verifyEmail({ email, otp })
               → success → redirect /

Utilisateur connecté non vérifié → tente /compte ou /admin
               → middleware détecte emailVerified=false
               → redirect /email-non-verifie

/email-non-verifie → message explicatif + adresse masquée + bouton "Renvoyer le code"
                   → sendVerificationOtp(email, "email-verification")
                   → redirect /verifier-email
```

Les utilisateurs inscrits via Google/Facebook ont `emailVerified=true` automatiquement — non impactés.

## Pages

### `/verifier-email` (nouvelle)
- Réutilise `OtpInput` + `AuthCard` existants
- Lit l'email depuis `sessionStorage.otp_email`
- Si pas d'email → redirect `/inscription`
- Bouton "Renvoyer le code" avec délai 60s
- `authClient.emailOtp.verifyEmail({ email, otp })` sur submit
- Succès → redirect `/`

### `/email-non-verifie` (nouvelle)
- Message explicatif avec adresse masquée (`u***@exemple.com`)
- Bouton "Renvoyer le code" → `sendVerificationOtp` → redirect `/verifier-email`
- Lien "Se déconnecter"
- Lit l'email via `useSession`

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `app/(auth)/verifier-email/page.tsx` | Créer |
| `app/(auth)/email-non-verifie/page.tsx` | Créer |
| `app/(auth)/inscription/page.tsx` | Modifier — onSuccess envoie OTP + redirect |
| `middleware.ts` | Modifier — check `emailVerified` |
| `tests/app/auth/verifier-email.test.tsx` | Créer |
| `tests/app/auth/email-non-verifie.test.tsx` | Créer |
| `tests/middleware.test.ts` | Modifier — ajouter cas emailVerified=false |

## Middleware

```typescript
// Après le check !session?.user
if (!session.user.emailVerified) {
  return NextResponse.redirect(new URL("/email-non-verifie", request.url));
}
```

## Gestion d'erreurs

- OTP invalide ou expiré → "Code incorrect ou expiré. Réessayez."
- Resend failure → "Impossible d'envoyer le code. Vérifiez votre connexion."
- Session expirée sur `/email-non-verifie` → redirect `/connexion`

## OTP

- Durée : 5 minutes (300s) — configuré dans `lib/auth.ts`
- Longueur : 6 chiffres
- Cooldown renvoi : 60 secondes côté UI
