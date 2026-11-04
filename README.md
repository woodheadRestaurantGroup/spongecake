# Spongecake

Internal recipe database for Woodhead Restaurant Group kitchens. One branded instance per site, served from a single Next.js and Payload CMS application.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Design handoff (tokens, screens, emails): [docs/design/handoff/README.md](docs/design/handoff/README.md)
- Launch checklist: [docs/LAUNCH.md](docs/LAUNCH.md) · Recipe entry guide: [docs/RECIPE-ENTRY.md](docs/RECIPE-ENTRY.md) · Staff privacy notice: [docs/PRIVACY-NOTICE.md](docs/PRIVACY-NOTICE.md)

## Stack

Next.js 16 (App Router) with Payload 3, Postgres (Neon in production), Vercel Blob for images, Resend for email, Tailwind CSS. Hosted on Vercel with functions in London.

## How it fits together

- **Sites** are tenants. The request hostname picks the site; `DEFAULT_SITE_SLUG` is the fallback for previews and local development.
- **Users** hold one membership per site with a role: Viewer, Editor or Site Admin. Group Admins span every site. Access rules live in `src/access/roles.ts` and on each collection.
- **Sign-in** is by magic link or six-digit code (`src/lib/auth`). There are no passwords. Sessions are 90-day JWT cookies and renew themselves past the midpoint.
- **Recipes** are authored in the Payload admin at `/admin` with live preview. The front end under `src/app/(frontend)` renders them for phones, with yield scaling done client side, a full-screen cook mode, favourites, history, and suggestions that email the site's editors.
- **Offline and install.** `/sw.js` serves a service worker stamped with the deployment id (`src/lib/pwa/serviceWorker.ts`). It saves pages you open, the home page and your favourites, and falls back to `/offline`. `/manifest.webmanifest` and `/pwa/icon/[size]` are generated per site. The worker only registers in production builds.
- **Design tokens** live in `src/app/(frontend)/tokens.css` (Tailwind 4 theme, light and dark). The per-site accent is set on `<html>` from the site record. Avatars are generated from the user's email by `src/lib/avatar.ts` and must never change once shipped.

## Local development

Requirements: Node 22, pnpm 10, Postgres 16 (or Docker).

```bash
docker compose up -d
```

```bash
cp .env.example .env.local
```

Fill in `PAYLOAD_SECRET` in `.env.local` (any long random string locally). Then:

```bash
pnpm install
```

```bash
pnpm migrate
```

```bash
pnpm seed
```

```bash
pnpm dev
```

The seed creates the QCH site on `localhost` with three users: `admin@example.com` (Group Admin), `editor@example.com` (Editor) and `viewer@example.com` (Viewer). Sign in at http://localhost:3000/sign-in with one of those addresses. Without a Resend key the email is printed to the terminal, so copy the six-digit code from there.

The Payload admin is at http://localhost:3000/admin and uses the same sign-in. Without a Blob token, uploads are stored under `/media`.

## First admin in a real environment

Set `BOOTSTRAP_ADMIN_EMAIL` to the Group Admin's address. While the users table is empty, the first sign-in request from that address creates the account. After that the variable does nothing.

## Database changes

Schema changes always go through migrations, in every environment. After editing a collection:

```bash
pnpm migrate:create describe_the_change
```

```bash
pnpm migrate
```

```bash
pnpm generate:types
```

If you add or change admin UI components, also run:

```bash
pnpm generate:importmap
```

Commit the generated files under `src/migrations`, `src/payload-types.ts` and `src/app/(payload)/admin/importMap.js`. Vercel runs pending migrations and regenerates the import map as the first steps of every build.

## Checks

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

Tests run against the database in `test.env`, apply migrations first, and include cross-site isolation checks for every role. CI runs the same three commands on every pull request.

## Environments

| Environment | Branch             | Database                |
| ----------- | ------------------ | ----------------------- |
| Production  | `main`             | Neon main branch        |
| Preview     | every pull request | Neon branch per preview |
| Local       | any                | local Postgres          |

`DEFAULT_SITE_SLUG` is set in Preview and Development so a preview URL resolves to a site. It is never set in Production.
