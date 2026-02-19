# Design : Intégration Resend pour l'envoi d'emails OTP

**Date :** 2026-02-19
**Statut :** Approuvé

## Contexte

Le plugin `emailOTP` de Better Auth est configuré dans `lib/auth.ts` avec un callback `sendVerificationOTP` qui ne fait que logger en dev. Ce document décrit l'intégration de Resend pour envoyer les codes OTP par email en production.

## Architecture

Un seul fichier `lib/email.ts` expose une fonction `sendOtpEmail(to, otp, type)`. `lib/auth.ts` l'appelle depuis `sendVerificationOTP`. Cette séparation garde `auth.ts` propre et rend le code email testable indépendamment.

```
lib/auth.ts
  └── sendVerificationOTP({ email, otp, type })
        └── lib/email.ts → sendOtpEmail(email, otp, type)
              └── Resend SDK → API Resend → boîte mail utilisateur
```

## Variables d'environnement

```
RESEND_API_KEY=re_xxxx        # Clé API Resend
RESEND_FROM_EMAIL=DBS Store <noreply@dbs-store.ci>   # Expéditeur
```

En dev, si `RESEND_API_KEY` n'est pas définie, on logue le code OTP dans la console (comportement existant).

## Template HTML

Email HTML avec inline CSS :
- **Header** : logo DBS Store (⚡ + texte) sur fond primaire
- **Corps** : titre selon le `type` (`forget-password` → "Réinitialisation de mot de passe")
- **Code OTP** : 6 chiffres en gros, espacés, dans un bloc monospace
- **Expiration** : "Ce code expire dans 5 minutes"
- **Avertissement** : "Si vous n'avez pas demandé cela, ignorez cet email"
- **Footer** : "© DBS Store"

## Gestion d'erreurs

Si Resend throw (clé invalide, quota dépassé, email rejeté), l'exception remonte à Better Auth qui retourne un 500. Le callback `onError` s'affiche côté client avec le message d'erreur.

En développement (`NODE_ENV !== "production"` et pas de `RESEND_API_KEY`), fallback sur `console.log`.

## Tests

`tests/lib/email.test.ts` :
- Mock le client Resend (`vi.mock("resend")`)
- Vérifie que `sendOtpEmail` appelle `resend.emails.send` avec `to`, `subject`, `otp` dans le body
- Vérifie le sujet selon le type (`forget-password` vs autres)

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `lib/email.ts` | Créer — fonction `sendOtpEmail` + template HTML |
| `lib/auth.ts` | Modifier — appeler `sendOtpEmail` dans `sendVerificationOTP` |
| `.env.example` | Modifier — ajouter `RESEND_API_KEY` et `RESEND_FROM_EMAIL` |
| `tests/lib/email.test.ts` | Créer — tests unitaires |
