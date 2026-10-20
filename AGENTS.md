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
- **Styling & UI:** Tailwind CSS v4 + shadcn/ui (preset Nova, base-ui) + Lucide React icons + Sonner toasts
- **Database & ORM:** PostgreSQL + Prisma v7
- **Authentication:** NextAuth.js v5
- **Forms & Data:** React Hook Form + Zod, Server Actions as primary mutation mechanism
- **Testing:** Vitest + React Testing Library (Unit/Integration)

## 2. Agent Guidelines

- Always verify lint, typecheck, and tests after any implementation

## 3. Button Guidelines

- Use the shadcn `Button` from `@/src/components/ui/button`; for links styled as buttons use `<Link className={buttonVariants(...)}>`.
- Use the default variant for primary mutations and submit actions.
- Use `variant="secondary"` or `variant="outline"` for ordinary secondary actions.
- Use `variant="destructive"` for destructive actions and `variant="ghost"` for shell toggles such as menu or collapse controls.
- Icon-only buttons must use an `icon*` size and an accessible name (`aria-label` or `sr-only` text).
- Icons inside buttons use `data-icon="inline-start|inline-end"` and no sizing classes; loading states compose `Spinner` with `disabled`.
- Follow [.github/instructions/buttons.instructions.md](.github/instructions/buttons.instructions.md) for detailed button patterns.

## 4. Card Guidelines

- Use `Card` with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` and `CardFooter` as the standard content surface.
- Use `size="sm"` cards for compact metrics and a responsive grid of cards for metric groups.
- Do not nest cards or force dense tables and data rows into individual cards.
- Use `Empty` for empty states, `Alert` for callouts and `Badge` for status labels.
- Use semantic tokens (`bg-muted`, `text-muted-foreground`), never raw colors.
- Follow [.github/instructions/cards.instructions.md](.github/instructions/cards.instructions.md) for detailed card patterns.

## 5. Form Rules

- Use Zod as the single source of truth and keep feature schemas in `_lib/schemas.ts`.
- Use React Hook Form with `zodResolver` in Client Components.
- Use shadcn `FieldGroup`/`Field` with `Input`, `NativeSelect`, `Checkbox` and show field errors near their inputs.
- Use `toast` from `sonner` for success and error feedback.
- Use icons from `lucide-react`, passed as components.
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
- `npm run prisma:migrate -- --name <name>`: runs `prisma migrate dev`; in local development, it creates a migration from schema changes and applies pending migrations to the configured database.
- `npx prisma migrate deploy`: applies existing migration files that are pending. It does not create a migration or reconcile a checksum mismatch.
- `npx prisma migrate status`: reports migration status against the configured database.
- `npx prisma validate`: validates the Prisma schema and configuration.
- `npm run prisma:seed`: applies the idempotent catalog seed.

#### Required migration workflow

- Prisma Client generation is not a database migration. For every `schema.prisma` change that affects the database, create and apply a migration before considering the change complete.
- For a new migration in local development, run `npm run prisma:migrate -- --name <descriptive_name>`. Review the generated SQL and confirm the command applied it to the configured database.
- If the migration file already exists and is reviewed, apply it with `npx prisma migrate deploy` rather than creating a duplicate migration. Use `migrate deploy` for staging and production; do not use `migrate dev` against those environments.
- After applying the migration, run `npm run prisma:generate` and `npx prisma migrate status`, then run the relevant tests. A clean `migrate status` does not resolve a separate checksum error from `migrate dev`.
- If Prisma reports that an already-applied migration was modified, reports a checksum mismatch or drift, or asks to reset the database, stop. Do not run `prisma migrate reset`, edit an applied migration, or modify `_prisma_migrations` to bypass the error. Compare the migration with Git and restore the exact version that was applied if it can be identified. If not, preserve the database and report the issue for safe reconciliation; do not silently skip migration verification.

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
