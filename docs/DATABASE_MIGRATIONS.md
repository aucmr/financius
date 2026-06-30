# Database Migrations Process — Financius

## Overview

Prisma Migrations track all database schema changes in version-controlled SQL files. This ensures:

- **Reproducibility**: Any developer can sync their local DB to the same state
- **Safety**: Changes are reversible via migration history
- **Clarity**: Each migration has a descriptive name and SQL file
- **Test isolation**: Development and test databases stay separate

---

## How It Works in Financius

### Directory Structure

```
prisma/
├── schema.prisma          # Source of truth for the schema
├── generated/             # Auto-generated Prisma Client code
├── seed.ts               # Seeds data (users, default categories)
└── migrations/           # Numbered migration files
    ├── 20260624143748_init/
    │   └── migration.sql
    ├── 20260629144640_add_shared_to_expense/
    │   └── migration.sql
    └── [future migrations...]
```

### Two Separate Databases

**Development Database** (`financius`)

- Used for local development
- Contains real test data and fixtures
- URL: `postgresql://postgres:postgres@fin-db:5432/financius?schema=public`
- Defined in `.env.local`

**Test Database** (`financius_test`)

- Isolated from dev data — tests never touch your real data
- Freshly migrated before integration tests run
- URL: `postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public`
- Defined in `.env.test`

---

## Migration Workflow (Step-by-Step)

### 1️⃣ **Make a Schema Change**

Edit `prisma/schema.prisma` to add/modify a field:

```prisma
model Expense {
  // ... existing fields
  shared  Boolean  @default(false)  // ← NEW FIELD
}
```

### 2️⃣ **Create the Migration**

Run:

```bash
DATABASE_URL="postgresql://postgres:postgres@fin-db:5432/financius?schema=public" \
npx prisma migrate dev --name add_shared_to_expense
```

What happens:

- Prisma detects the diff between `schema.prisma` and the current database schema
- Generates `prisma/migrations/20260629144640_add_shared_to_expense/migration.sql`
- Applies the SQL to the **dev database**
- Regenerates the Prisma Client code

**Example generated SQL:**

```sql
-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "shared" BOOLEAN NOT NULL DEFAULT false;
```

### 3️⃣ **Commit the Migration**

The migration file is now part of your codebase:

```bash
git add prisma/migrations/20260629144640_add_shared_to_expense/
git commit -m "feat: add shared expense tracking"
```

### 4️⃣ **Apply to Test Database**

Once migrations are committed, apply them to the test DB:

```bash
DATABASE_URL="postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public" \
npx prisma migrate deploy
```

What happens:

- Reads all migration files in `prisma/migrations/`
- Applies only the ones not yet applied (tracked in `_prisma_migrations` table)
- Test DB is now in sync with the migration history

### 5️⃣ **Seed Default Data**

After migrations, run the seed script to populate reference data:

```bash
DATABASE_URL="postgresql://postgres:postgres@fin-db:5432/financius?schema=public" \
npx tsx prisma/seed.ts
```

**What gets seeded:**

- 2 test users: `husband@financius.app`, `wife@financius.app` (both password: `password123`)
- 10 AREA categories (Casa, Alimentação, Saúde, etc.)
- 5 PROFILE categories (CustoFixo, Conforto, Prazer, etc.)

---

## Key Commands

### Development: Create & Apply in One Step

```bash
npm run db:migrate
# Shorthand for:
# DATABASE_URL=... npx prisma migrate dev
```

### Test Environment: Apply Existing Migrations

```bash
DATABASE_URL="postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public" \
npx prisma migrate deploy
```

### Seed Reference Data

```bash
npm run db:seed
# Shorthand for:
# DATABASE_URL=... npx tsx prisma/seed.ts
```

### View Database Schema Visually

```bash
DATABASE_URL="postgresql://postgres:postgres@fin-db:5432/financius?schema=public" \
npx prisma studio
```

### Generate Prisma Client (After Schema Changes)

```bash
npx prisma generate
```

---

## Important Rules

### ❌ Never Do This

1. **Don't manually edit migration files** — they're immutable once committed
2. **Don't share databases between dev and test** — always use separate URLs
3. **Don't run migrations directly via `psql`** — Prisma needs to track them
4. **Don't delete migrations** — they're the source of truth for schema history

### ✅ Always Do This

1. **Run `migrate dev` locally** before committing schema changes
2. **Commit migration files** along with `schema.prisma` updates
3. **Run `migrate deploy` on test DB** before running integration tests
4. **Use Prisma Client imports** from `@prisma-generated` (path alias)

---

## Phase 1 → Phase 2 Transition

When starting Phase 2, you'll need to:

1. **Update `schema.prisma`** with new models (e.g., `BudgetExpense`, expense modifications)
2. **Run migrations locally**: `npm run db:migrate --name "descriptive_change"`
3. **Test the migration**: Verify data integrity, relationships, and queries
4. **Seed new reference data** if needed (e.g., new budget templates)
5. **Apply to test DB**: `DATABASE_URL=...financius_test npx prisma migrate deploy`
6. **Verify tests still pass**: `npm test`

---

## Example: The Phase 1 Migrations

### Initial Setup (`20260624143748_init`)

- Created 5 tables: User, Category, Expense, Income, Budget
- Set up relationships and constraints

### Shared Expenses (`20260629144640_add_shared_to_expense`)

- Added `shared BOOLEAN DEFAULT false` to Expense table
- Allows expenses to be marked for month-end sharing

---

## Debugging Migrations

### "Drift detected" Error

Means your database state differs from your migration history. Solution:

```bash
DATABASE_URL=... npx prisma migrate resolve --rolled-back 20260629144640_add_shared_to_expense
# Then:
DATABASE_URL=... npx prisma migrate deploy
```

### "Cannot find migration" Error

The migration file exists but the database table is missing. Solution:

```bash
DATABASE_URL=... npx prisma db push --skip-generate
# Or reset (⚠️ destructive):
DATABASE_URL=... npx prisma migrate reset --force
```

---

## Summary for Phase 2 Prep

Before moving to Phase 2:

- ✅ Schema is version-controlled in `prisma/schema.prisma`
- ✅ All migrations live in `prisma/migrations/` (2 so far)
- ✅ Dev DB (`financius`) has all migrations applied
- ✅ Test DB (`financius_test`) has all migrations applied
- ✅ Seed script populates users and default categories
- ✅ Prisma Client is regenerated after schema changes
- ✅ All tests pass with the new schema
