# 📖 Financius Project — Complete Reference Guide

## Project Status: Phase 1 ✅ Complete | Ready for Phase 2

---

## Quick Navigation

### 📋 Core Documentation

1. **[AGENTS.md](./AGENTS.md)** — The source of truth for all project requirements
   - Tech stack (Next.js 15, Prisma 7, NextAuth v5, Tailwind, Vitest, Playwright)
   - Architecture patterns (Server Actions, shared pool concept, two DB isolation)
   - Business rules (AREA + PROFILE categories, shared expenses)
   - Phase requirements and verification checklists

2. **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)** — How migrations work in this project
   - Migration workflow (edit schema → generate → apply → seed)
   - Dev vs Test DB isolation
   - Important rules (never edit migrations, always commit them)
   - Commands and debugging tips

3. **[CHANGES_APPLIED.md](./CHANGES_APPLIED.md)** — What changed in the Phase 1 update
   - Next.js downgrade (v16 → v15)
   - Expense schema enhancement (added `shared` field)
   - Seed data expansion (2 users → 2 users + 15 categories)
   - Before/after comparison

4. **[PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)** — Phase 1→2 transition summary
   - Verification checklist (all ✅)
   - What Phase 2 will build
   - Phase 2 verification plan
   - Quick command reference

---

## Project Structure

```
financius/
├── docs/
│   ├── AGENTS.md                    ← Requirements (source of truth)
│   ├── DATABASE_MIGRATIONS.md       ← How migrations work
│   ├── CHANGES_APPLIED.md           ← Recent updates applied
│   ├── PHASE_1_COMPLETE.md          ← Transition to Phase 2
│   └── REFERENCE.md                 ← This file
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/login/page.tsx    # Login form
│   │   ├── (dashboard)/             # Protected routes
│   │   │   ├── layout.tsx           # Session check + header
│   │   │   └── page.tsx             # Welcome dashboard
│   │   ├── api/auth/[...nextauth]/  # NextAuth v5 route
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Tailwind
│   │
│   ├── actions/                     # Server Actions
│   │   └── auth.test.ts             # Integration tests
│   │
│   ├── lib/
│   │   ├── prisma.ts                # Singleton Prisma client
│   │   ├── utils.ts                 # Formatters (currency, date)
│   │   └── utils.test.ts            # Unit tests
│   │
│   ├── auth.ts                      # NextAuth v5 configuration
│   └── proxy.ts                     # Route protection middleware
│
├── prisma/
│   ├── schema.prisma                # Database schema (source of truth)
│   ├── seed.ts                      # Seeds users + 15 categories
│   └── migrations/
│       ├── 20260624143748_init/     # Initial schema
│       └── 20260629144640_add_shared_to_expense/
│
├── e2e/
│   └── auth.spec.ts                 # Playwright E2E tests (7 tests)
│
├── vitest.config.ts                 # Unit + integration test config
├── playwright.config.ts             # E2E test config
├── tsconfig.json                    # TypeScript config
├── next.config.ts                   # Next.js config
├── .env.local                       # Dev: DATABASE_URL, NEXTAUTH_*
├── .env.test                        # Test: financius_test DB
├── package.json                     # Dependencies + scripts
└── README.md                        # Original setup notes
```

---

## Current Tech Stack

| Layer               | Technology     | Version   | Purpose                                 |
| ------------------- | -------------- | --------- | --------------------------------------- |
| **Framework**       | Next.js        | 15.5.19   | Full-stack, App Router, TypeScript      |
| **Language**        | TypeScript     | 5.x       | Strict mode, end-to-end type safety     |
| **Styling**         | Tailwind CSS   | 4.x       | Utility-first CSS (Phase 1: plain HTML) |
| **ORM**             | Prisma         | 7.8.0     | Type-safe DB access                     |
| **Database**        | PostgreSQL     | 18        | Container in compose.yml                |
| **Auth**            | NextAuth.js    | v5.0-beta | JWT sessions, bcrypt hashing            |
| **API**             | Server Actions | Native    | No /api routes (monolithic)             |
| **Unit Tests**      | Vitest         | 4.1.9     | Fast, Vite-powered                      |
| **Component Tests** | RTL            | 16.3.2    | React Testing Library                   |
| **E2E Tests**       | Playwright     | 1.61.1    | Browser automation                      |

---

## Database Schema (Phase 1)

### Tables Created

**User**

- `id` (CUID, primary key)
- `email` (unique)
- `password` (bcrypt hashed)
- `name`
- `createdAt`, `updatedAt`

**Category** (Shared across both users)

- `id` (CUID, primary key)
- `name` (unique per kind)
- `kind` (AREA | PROFILE enum)
- `type` (EXPENSE | INCOME enum)
- `color` (hex, for UI)
- `icon` (emoji)
- Relations: `expensesAsArea`, `expensesAsProfile`, `budgets`

**Expense** (Tracked per user)

- `id` (CUID, primary key)
- `description`, `amount`, `date`
- `areaCategoryId`, `profileCategoryId` (required, dual categorization)
- `userId` (tracks who spent)
- `notes`, `recurring`, `shared` (default: false)
- `createdAt`, `updatedAt`

**Income** (Tracked per user, no categories)

- `id` (CUID, primary key)
- `description`, `amount`, `date`
- `userId` (tracks who earned)
- `notes`, `recurring`
- `createdAt`, `updatedAt`

**Budget** (Shared across both users)

- `id` (CUID, primary key)
- `categoryId`, `amount`, `month`, `year`
- Unique constraint: `[categoryId, month, year]`

### Migrations Applied

1. **20260624143748_init** — Initial schema
   - Created all 5 tables
   - Set up relationships and constraints

2. **20260629144640_add_shared_to_expense** — Shared expense tracking
   - Added `shared BOOLEAN DEFAULT false` to Expense

---

## Default Categories (Seeded)

### AREA Categories (10)

| #   | Name        | Icon | Purpose               |
| --- | ----------- | ---- | --------------------- |
| 1   | Casa        | 🏠   | Home/rent/utilities   |
| 2   | Alimentação | 🍽️   | Groceries/restaurants |
| 3   | Saúde       | 🏥   | Medical/health care   |
| 4   | Transporte  | 🚗   | Car/fuel/transit      |
| 5   | Pessoal     | 👤   | Personal items        |
| 6   | Filhos      | 👶   | Children-related      |
| 7   | Educação    | 📚   | Courses/books         |
| 8   | Lazer       | 🎮   | Entertainment         |
| 9   | Viagens     | ✈️   | Trips/vacations       |
| 10  | Outros      | 📦   | Miscellaneous         |

### PROFILE Categories (5)

| #   | Name         | Icon | Purpose               |
| --- | ------------ | ---- | --------------------- |
| 1   | CustoFixo    | 📋   | Fixed/necessary costs |
| 2   | Conforto     | ☕   | Nice-to-have comforts |
| 3   | Prazer       | 🎉   | Entertainment/fun     |
| 4   | Conhecimento | 🧠   | Learning/growth       |
| 5   | Liberdade    | 🦅   | Discretionary/freedom |

**Every expense requires BOTH**: one AREA + one PROFILE category.  
**Income has NO categories**.

---

## Test Suite Summary

### Unit Tests (6 tests, `src/lib/utils.test.ts`)

```bash
npm test
```

- `formatCurrency`: Converts numbers to BRL (R$)
- `formatDate`: Converts Date to PT-BR locale
- `monthName`: Returns Portuguese month names

### Integration Tests (4 tests, `src/actions/auth.test.ts`)

```bash
npm test
```

- `authorize` with missing credentials → null
- `authorize` with wrong email → null
- `authorize` with wrong password → null
- `authorize` with correct credentials → user object

### E2E Tests (7 tests, `e2e/auth.spec.ts`)

```bash
npm run test:e2e
```

- Unauthenticated / redirects to /login
- Login page is accessible
- Invalid credentials show error
- Husband login succeeds
- Wife login succeeds
- Logged-in user visiting /login redirects to /
- Sign out redirects to /login

---

## Available Commands

### Development

```bash
npm run dev              # Start Next.js dev server (port 3000)
```

### Testing

```bash
npm test                # Run all unit + integration tests
npm run test:watch      # Watch mode
npm run test:e2e        # Run Playwright tests
```

### Database

```bash
npm run db:migrate      # Create & apply migrations (dev DB only)
npm run db:seed         # Seed users + categories
npx prisma studio      # Visual database editor
```

### Build & Deploy

```bash
npm run build           # Production build
npm start              # Run production server
```

---

## Authentication

### Credentials (Seeded)

```
Email: husband@financius.app
Password: password123

Email: wife@financius.app
Password: password123
```

### How It Works

1. User enters email/password on `/login`
2. Next.js client calls `signIn("credentials", { ... })`
3. NextAuth v5 calls `authorize()` in `src/auth.ts`
4. Prisma queries User, bcrypt checks password
5. If match: JWT token issued (cookie/session)
6. Middleware (`src/proxy.ts`) checks token on every request
7. Unauthenticated requests to `/` redirected to `/login`

---

## Database Isolation Strategy

### Development Database

```
URL: postgresql://postgres:postgres@fin-db:5432/financius?schema=public
Location: .env.local (DATABASE_URL)
Usage: Local development, manual testing, fixture data
Risk: Safe — test data is only local
```

### Test Database

```
URL: postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public
Location: .env.test (DATABASE_URL)
Usage: Integration tests (vitest), E2E tests (playwright)
Risk: Safe — isolated, migrated fresh before tests
```

**Key Rule**: Never mix these two databases. Tests ALWAYS use `financius_test`.

---

## Phase 1 Verification Checklist ✅

- [x] Next.js 15 (stable LTS)
- [x] Prisma 7 with PostgreSQL adapter
- [x] NextAuth v5 with JWT + bcrypt
- [x] Database migrations tracked in git
- [x] Dev/Test DB isolation
- [x] Users table + 15 default categories
- [x] Login page with client-side form
- [x] Protected dashboard with welcome
- [x] Route protection via proxy.ts
- [x] 6 unit tests ✅
- [x] 4 integration tests ✅
- [x] 7 E2E tests ✅
- [x] Build successful
- [x] Seed script working

---

## What Phase 2 Will Add

**Goal**: Core expense/income logging

### Features

- Expense creation with AREA + PROFILE categorization
- Shared expense marking (for month-end splitting)
- Income creation (no categories)
- View all expenses/income for current month
- Edit/delete expenses and income

### Server Actions

- `createExpense(description, amount, date, areaCategoryId, profileCategoryId, shared)`
- `updateExpense(id, ...)`
- `deleteExpense(id)`
- `createIncome(description, amount, date)`
- `updateIncome(id, ...)`
- `deleteIncome(id)`
- `getExpenses(month, year, filters)`
- `getIncome(month, year)`

### Validation

- Zod schemas for all inputs
- Currency amounts (positive only)
- Valid category IDs
- Date range validation

### Testing

- Unit tests for Zod schemas
- Integration tests for each Server Action
- E2E tests for expense/income workflows

---

## Debugging Tips

### "shared field not found" error

```bash
# Regenerate Prisma client after schema change
npx prisma generate
```

### Test DB out of sync

```bash
# Re-apply all migrations
DATABASE_URL="postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public" \
npx prisma migrate deploy
```

### Can't login after changes

```bash
# Re-seed users + categories
npm run db:seed
```

### Build fails

```bash
# Check TypeScript
npx tsc --noEmit

# Rebuild node_modules
rm -rf node_modules && npm install
```

---

## Git Workflow

### Phase 1 → Phase 2 Transition

1. Make sure Phase 1 is frozen (all tests passing)
2. Create new branch: `git checkout -b phase-2`
3. Follow AGENTS.md Phase 2 steps
4. Write tests first (TDD), then implement
5. Commit migrations along with code changes
6. PR/review before merging to main

### Important

- **Always commit** `prisma/migrations/` files
- **Never edit** migration files after commit
- **Run `npm run db:migrate`** before committing schema changes
- **Test locally** against both dev and test DBs

---

## Key Files at a Glance

| File                   | Purpose                       | Phase |
| ---------------------- | ----------------------------- | ----- |
| `src/auth.ts`          | NextAuth v5 config            | 1     |
| `src/proxy.ts`         | Route protection              | 1     |
| `src/lib/prisma.ts`    | Singleton client              | 1     |
| `prisma/schema.prisma` | DB schema (source of truth)   | 1+    |
| `prisma/seed.ts`       | Reference data                | 1+    |
| `prisma/migrations/`   | Version-controlled DB changes | 1+    |
| `.env.local`           | Dev environment               | 1+    |
| `.env.test`            | Test environment              | 1+    |
| `src/actions/`         | Server Actions (main API)     | 2+    |
| `src/lib/validations/` | Zod schemas                   | 2+    |

---

## Need Help?

1. **Schema questions?** → See `AGENTS.md` "Data Models" section
2. **Migration questions?** → Read `DATABASE_MIGRATIONS.md`
3. **What changed?** → Check `CHANGES_APPLIED.md`
4. **Phase 2 ready?** → Review `PHASE_1_COMPLETE.md`
5. **Command reference?** → Scroll to "Available Commands" above

---

**Last Updated**: June 29, 2026  
**Phase**: 1 Complete ✅ | Ready for Phase 2  
**Test Status**: 17/17 tests passing (10 unit + 7 E2E)  
**Build Status**: ✅ Successful
