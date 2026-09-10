<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 1. Project Overview & Architecture

WebApp for couples organize their finances, with montly shared expenes stripping.

### Architecture Pattern (4 Layers)

1. **Presentation:** UI Components & Pages
2. **Application:** Business Rules & Validation
3. **Data Access:** DB Operations via Prisma Client
4. **Persistence:** PostgreSQL Engine (`schema.prisma`)

### Core Tech Stack

- **Framework:** Next.js v16 (App Router, strict TypeScript)
- **Styling & UI:** Tailwind CSS v4 + FlyonUI
- **Database & ORM:** PostgreSQL + Prisma v7
- **Authentication:** NextAuth.js v5
- **Forms & Data:** React Hook Form + Zod, Server Actions as primary mutation mechanism
- **Testing:** Vitest + React Testing Library (Unit/Integration)

## 2. Agent Guidelines

- Always verify lint, typecheck, and tests after any implementation

## 3. Button Guidelines

- Use FlyonUI `btn` as the base class for button actions.
- Use `btn btn-primary` for primary mutations and submit actions.
- Use `btn btn-soft btn-secondary` for ordinary secondary actions.
- Use an error variant for destructive actions and keep shell toggles such as menu or collapse controls as `btn-text`.
- Do not combine conflicting variants such as `btn-primary btn-ghost`.
- Icon-only buttons must use an appropriate `btn-square` or `btn-circle` modifier and an accessible name.
- Follow [.github/instructions/buttons.instructions.md](.github/instructions/buttons.instructions.md) for detailed button patterns.

## 4. Card Guidelines

- Use `card bg-base-100 shadow-md` as the standard neutral content surface.
- Use `card-body` for card content, `card-title` for headings, and `stats` for metric groups.
- Use `card-border` only when a visible border is intentional; do not repeat border and shadow utilities on every card.
- Do not nest cards or force dense tables and data rows into individual cards.
- Use a card for empty states when it improves the page surface, but do not rely on FlyonUI JavaScript-only behavior unless the runtime is initialized.
- Follow [.github/instructions/cards.instructions.md](.github/instructions/cards.instructions.md) for detailed card patterns.

## 5. Form Rules

- Use Zod as the single source of truth and keep feature schemas in `_lib/schemas.ts`.
- Use React Hook Form with `zodResolver` in Client Components.
- Use FlyonUI classes for controls and show field errors near their inputs.
- Server Actions must accept `unknown` and validate the payload again on the server.
- Derive `userId`, `householdId`, ownership and authorization from the server context.
- Consult [.github/instructions/forms.instructions.md](.github/instructions/forms.instructions.md) for complete examples and control patterns.

## 6. Main Commands

Run commands from the repository root. The project expects `DATABASE_URL` to be
available for Prisma commands and database-backed integration tests.

### Development and build

- `npm run dev`: starts the Next.js development server with hot reload.
- `npm run build`: creates the optimized production build.
- `npm run start`: serves the previously generated production build.
- `npm run typecheck`: runs TypeScript validation without emitting files.

### Lint and tests

- `npm run lint`: runs ESLint across the project.
- `npm test`: runs the complete Vitest suite once.
- `npm run test:unit`: runs the unit tests that do not require the database.
- `npm run test:integration`: runs database-backed integration tests; tests are skipped when `DATABASE_URL` is unavailable.
- `npm run test:watch`: starts Vitest in watch mode during development.
- `npm run test:coverage`: runs tests and generates coverage output.

### Prisma and database

- `npm run prisma:generate`: regenerates the Prisma Client from the schema.
- `npm run prisma:migrate -- --name <name>`: creates and applies a development migration.
- `npx prisma migrate status`: reports migration status against the configured database.
- `npx prisma validate`: validates the Prisma schema and configuration.
- `npm run prisma:seed`: applies the idempotent catalog seed.

### Git

- `git status --short`: lists modified, staged, and untracked files concisely.
- `git diff`: reviews unstaged changes.
- `git diff --cached`: reviews staged changes.
- `git diff --check`: detects whitespace errors before committing.
- `git log --oneline -n 10`: shows the latest commits in compact form.
- `git add <path>`: stages selected changes for a commit.
- `git commit -m "<message>"`: records staged changes with a descriptive message.

Do not use destructive commands such as `git reset --hard` or `git checkout --`
to discard changes unless the user explicitly requests it.
