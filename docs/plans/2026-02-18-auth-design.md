# Authentication Design — DBS Store

## Overview

Authentication system using Better Auth with Organization plugin to distinguish store customers from admin staff. French locale throughout.

## Decisions

- **Auth library**: Better Auth
- **Providers**: Email/password + Google + Facebook + Apple
- **Role system**: Organization plugin — single org "DBS Store" for staff
- **Database**: SQLite (better-sqlite3) in dev, Cloudflare D1 in prod
- **UI**: Custom pages built with Shadcn components
- **Session**: 7-day expiry, daily refresh, 5-min cookie cache

## Architecture

### File structure

```
lib/
  auth.ts                         # Server config (DB, providers, plugins, session)
  auth-client.ts                  # Client (createAuthClient + plugins)
  auth/
    permissions.ts                # Access control (org roles: owner, admin, member)

app/api/auth/[...all]/route.ts    # API handler
middleware.ts                     # Route protection
```

### Organization roles

| Role     | Scope                                              |
|----------|-----------------------------------------------------|
| `owner`  | Full access: org management, invitations, all admin |
| `admin`  | Product management, order management, support       |
| `member` | View orders, customer support                       |

Customers are plain `user` records with no organization membership.

### Middleware protection

| Pattern          | Rule                                               |
|------------------|----------------------------------------------------|
| `/admin/:path*`  | Redirect to `/connexion` if no session; to `/` if not org member |
| `/compte/:path*` | Redirect to `/connexion` if no session             |
| Everything else  | Public                                             |

## Routes

### Auth pages (route group `(auth)`)

| Route                      | Purpose             |
|----------------------------|----------------------|
| `/connexion`               | Sign in              |
| `/inscription`             | Sign up              |
| `/mot-de-passe-oublie`     | Forgot password      |
| `/reinitialiser`           | Reset password       |

### Customer pages (route group `(store)`)

| Route               | Purpose              |
|----------------------|-----------------------|
| `/compte`            | Customer dashboard    |
| `/compte/profil`     | Edit profile          |
| `/compte/commandes`  | Order history         |

### Admin pages

| Route              | Purpose                      |
|---------------------|-----------------------------|
| `/admin`            | Admin dashboard              |
| `/admin/equipe`     | Team management (invitations, roles) |

## Shared components

```
components/auth/
  social-buttons.tsx    # Google/Facebook/Apple buttons
  auth-card.tsx         # Card wrapper for auth pages
```

### AppBar user-menu update

- **Not signed in**: link to `/connexion`
- **Signed in (customer)**: dropdown — Mon compte, Mes commandes, Deconnexion
- **Signed in (staff)**: dropdown — same + Administration

## Data model

### Tables managed by Better Auth

- `user`: id, name, email, emailVerified, image, createdAt, updatedAt
- `session`: id, userId, token, expiresAt, ipAddress, userAgent
- `account`: id, userId, providerId, providerAccountId, accessToken, refreshToken
- `verification`: id, identifier, value, expiresAt

### Tables added by Organization plugin

- `organization`: id, name, slug, logo, metadata, createdAt
- `member`: id, userId, organizationId, role, createdAt
- `invitation`: id, email, organizationId, role, status, inviterId, expiresAt

## Environment variables

```env
BETTER_AUTH_SECRET=          # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:33000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

DATABASE_URL=./dev.db
```

## Security

- **CSRF**: handled natively by Better Auth
- **Rate limiting**: built-in on auth endpoints
- **Passwords**: scrypt hashing (Better Auth default)
- **Sessions**: httpOnly, secure, sameSite=lax cookies
- **Middleware**: server-side session verification via `auth.api.getSession()`

## Seed script

`scripts/seed-org.ts` creates:
1. Organization "DBS Store" (slug: `dbs-store`)
2. Owner account via `auth.api.signUpEmail` + owner role assignment
