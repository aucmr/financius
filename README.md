# Aucmr Base

Feature-first, full-stack starter built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL (via Prisma), and authentication-ready boundaries.

## Folder Structure

```text
.
|-- app/
|   |-- (public)/
|   |   `-- page.tsx
|   |-- (auth)/
|   |   |-- sign-in/page.tsx
|   |   `-- sign-up/page.tsx
|   |-- (app)/
|   |   `-- dashboard/page.tsx
|   |-- api/
|   |   `-- health/route.ts
|   |-- globals.css
|   `-- layout.tsx
|-- components/
|   `-- ui/
|-- features/
|   |-- auth/
|   |   |-- actions/
|   |   |-- components/
|   |   |-- schemas/
|   |   `-- types/
|   |-- dashboard/
|   |   |-- actions/
|   |   |-- components/
|   |   `-- types/
|   `-- users/
|       |-- actions/
|       |-- components/
|       `-- types/
|-- lib/
|   |-- auth/
|   |-- db/
|   |-- env/
|   `-- utils/
`-- prisma/
	`-- schema.prisma
```

## Architecture Rules

1. `app/` contains route entries and layouts only.
2. `features/` contains domain code (UI, actions, validation, and types) grouped by business area.
3. `components/ui/` contains reusable cross-feature presentation primitives.
4. `lib/` contains shared cross-cutting concerns (env parsing, db client bootstrap, generic helpers).
5. `prisma/` contains persistence schema and database-specific artifacts.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy and adjust environment values:

```bash
cp .env.example .env
```

3. Start local services and app container:

```bash
docker compose up -d
```

4. Start Next.js:

```bash
npm run dev
```

## Next Steps

1. Install and configure Prisma Client and migrations.
2. Add NextAuth providers and session callbacks in `lib/auth/`.
3. Replace placeholder feature actions with real database-backed logic.
