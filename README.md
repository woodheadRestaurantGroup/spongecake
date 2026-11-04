# Spongecake

Internal recipe database for Woodhead Restaurant Group kitchens. One branded instance per site, served from a single Next.js and Payload CMS application.

- Product requirements: [docs/PRD.md](docs/PRD.md)

## Stack

Next.js 16 (App Router) with Payload 3, Postgres (Neon in production), Vercel Blob for images, Resend for email, Tailwind CSS. Hosted on Vercel with functions in London.

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
pnpm dev
```

The front end is at http://localhost:3000 and the Payload admin at http://localhost:3000/admin. The first visit to the admin asks you to create the first user.

Without a Resend key, emails are printed to the terminal. Without a Blob token, uploads are stored under `/media`.

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

Commit the generated files under `src/migrations` and `src/payload-types.ts`. Vercel runs pending migrations as the first step of every build.

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

Tests run against the database in `test.env` and apply migrations first. CI runs the same three commands on every pull request.

## Environments

| Environment | Branch             | Database                |
| ----------- | ------------------ | ----------------------- |
| Production  | `main`             | Neon main branch        |
| Preview     | every pull request | Neon branch per preview |
| Local       | any                | local Postgres          |

`DEFAULT_SITE_SLUG` is set in Preview and Development so a preview URL resolves to a site. It is never set in Production.
