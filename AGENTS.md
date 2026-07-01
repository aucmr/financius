# AGENTS.md — Couple's Finance Tracker

This file is the source of truth for AI coding agents working on this project.
Read it **fully** before making any changes. Follow the phases in order — do not
jump ahead. Each phase must be working and **fully tested** before the next one starts.

Supporting implementation/migration references are in [`docs/`](./docs/README.md).
Keep `AGENTS.md` at the project root.

---

## Project Overview

A personal full-stack web application for a couple to track home expenses and income, visualize financial data, and manage budgets. Built as a **shared financial pool** (no complex multi-tenancy; both users share the same categories, budgets, and dashboard).

---

## Persona and Principles

You are a senior software engineer with a lot of experience with NextJS framework, specialized at:

- 4-layer monolithic architecture: presentation (user interface - UI) -> application (business rules) -> data access (client library, ex: prisma client) -> persistence (database schema, migrations, seed data)
- Full-stack NextJS using APP router mode, and prefer Server Actions rather than API
- Automated tests with high coverage
- Unit, integration and e2e tests
- Security and maintainability best pratices

**Principles**:

- Provide objective and technical answers
- Validate syntax and best practices before suggesting code
- Prioritize solutions that follow established architectural patterns
- Suggest automated tests where applicable
- Warn about potential backward compatibility issues

---

## Tech Stack

| Layer                | Choice                       | Notes                                                  |
| :------------------- | :--------------------------- | :----------------------------------------------------- |
| **Framework**        | Next.js v15 (App Router)     | Full-stack, TypeScript, using `src/` directory         |
| **Language**         | TypeScript (strict mode)     | End-to-end type safety                                 |
| **Styling**          | Tailwind CSS v4              | Added after foundation is working                      |
| **Components**       | shadcn/ui                    | Added after foundation is working                      |
| **ORM**              | Prisma v7                    | Type-safe DB access                                    |
| **Database**         | PostgreSQL                   | Same engine in dev, test, and prod                     |
| **Auth**             | NextAuth.js **v5** (Auth.js) | Critical: v5 only — patterns differ from v4            |
| **Data fetching**    | Server Actions (primary)     | Monolithic architecture                                |
| **Charts**           | Recharts                     | Phase 3 onwards                                        |
| **Forms**            | React Hook Form + Zod        | Phase 2 onwards                                        |
| **Unit/Integration** | Vitest + RTL                 | React Testing Library for components, Vitest for logic |
| **E2E Testing**      | Playwright                   | Full browser automation for critical flows             |

---

## Architecture & Testing Strategy

### Server Actions vs API Routes

- **Server Actions** are the default for all internal mutations and queries.
- **API Routes** only for: webhooks, CSV export endpoints, future mobile client.

### Data Flow

```
Component (Client)
  └── calls Server Action  ──► Prisma ──► PostgreSQL
        └── revalidatePath() or redirect() on success
```

### Testing Definitions

- **Unit Tests (`*.test.ts/tsx`):** Pure UI components, utility functions (e.g., date formatting, currency math). No database connection.
- **Integration Tests (`*.test.ts` in actions):** Testing Server Actions against a test database to ensure data validation, Prisma insertions, and session checks work correctly.
- **E2E Tests (`*.spec.ts` in `/e2e`):** Playwright tests that spin up a real browser, log in as the Husband/Wife, and click through the UI to verify the full stack is communicating.

### Shared Pool Concept

- The database acts as a single household.
- **Categories and Budgets** are global. Neither has a `userId`. Both users share the exact same configuration.
- **Income and Expenses** have a `userId` strictly to track _who_ made the transaction, but all financial calculations aggregate data from both users.

### Rendering Strategy

- **Dashboard, reports:** Server Components (fetch at request time)
- **Forms, interactive UI:** Client Components (`'use client'`)
- **Login page:** Static generation

---

## Business Rules

### Category system

Every expense carries **two independent category dimensions**:

- **Area** — _what_ the expense is about:
  `Casa, Alimentação, Saúde, Transporte, Pessoal, Filhos, Educação, Lazer, Viagens, Outros`

- **Profile** — _how_ it is financially classified:
  `CustoFixo, Conforto, Prazer, Conhecimento, Liberdade`

Both are required on every expense. Income **DOESN'T** use **ANY** categories.
Both sets (AREA and PROFILE) live in the same `Category` table, separated by the `kind` field.

### User categories

- Users can add new categories to either set
- Categories with attached expenses cannot be deleted (`onDelete: Restrict`)

### Shared expenses

- Every expense has a `shared` boolean (default `false`)
- `shared: true` = expense is split between husband and wife at month end
- Monthly shared report filters `shared: true` and shows the total to divide

---

## Data Models (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "./generated"
}

datasource db {
  provider = "postgresql"
}

enum CategoryKind {
  AREA    // Casa, Alimentação, Saúde...
  PROFILE // CustoFixo, Conforto, Prazer...
}

enum TransactionType {
  EXPENSE
  INCOME
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed with bcrypt
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  expenses  Expense[]
  income    Income[]
}

model Category {
  id        String          @id @default(cuid())
  name      String
  kind      CategoryKind
  type      TransactionType
  color     String
  icon      String?
  createdAt DateTime        @default(now())
  updatedAt DateTime @updatedAt

  expensesAsArea    Expense[] @relation("ExpenseAreaCategory")
  expensesAsProfile Expense[] @relation("ExpenseProfileCategory")
  budgets           Budget[]

  @@unique([name, kind])
}

model Expense {
  id                String   @id @default(cuid())
  description       String
  amount            Decimal  @db.Decimal(10, 2)
  date              DateTime
  areaCategoryId    String
  profileCategoryId String
  userId            String   // Tracks who made the purchase
  notes             String?
  recurring         Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  areaCategory    Category @relation("ExpenseAreaCategory",    fields: [areaCategoryId],    references: [id], onDelete: Restrict)
  profileCategory Category @relation("ExpenseProfileCategory", fields: [profileCategoryId], references: [id], onDelete: Restrict)
  user            User     @relation(fields: [userId], references: [id])
}

model Income {
  id          String   @id @default(cuid())
  description String
  amount      Decimal  @db.Decimal(10, 2)
  date        DateTime
  userId      String   // Tracks who earned the income
  notes       String?
  recurring   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
}

model Budget {
  id         String   @id @default(cuid())
  categoryId String
  amount     Decimal  @db.Decimal(10, 2)
  month      Int
  year       Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@unique([categoryId, month, year])
}

```

---

## Project Structure

```text
app/
├── e2e/                          # Playwright end-to-end tests
│   └── auth.spec.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── actions/                  # Server Actions (Backend logic)
│   │   ├── auth.test.ts          # Integration tests for actions
|   │   ├── expenses.ts
|   │   ├── income.ts
|   │   ├── categories.ts
|   │   └── budgets.ts
│   ├── app/
|   │   ├── (auth)/
|   │   │   └── login/
|   │   │       └── page.tsx
|   │   ├── api/
|   │   │   ├── auth/
|   │   │   │   └── [...nextauth]/
|   │   │   │       └── route.ts      # NextAuth v5 route handler
|   │   │   └── export/
|   │   │       └── route.ts
|   │   ├── (app)/
|   │   │   ├── layout.tsx            # Protected layout — redirects to /login if no session
|   │   │   ├── dashboard/
|   │   │   │   └── page.tsx
|   │   │   ├── expenses/
|   │   │   │   ├── page.tsx
|   │   │   │   └── [id]/page.tsx
|   │   │   ├── income/
|   │   │   │   ├── page.tsx
|   │   │   │   └── [id]/page.tsx
|   │   │   ├── categories/
|   │   │   │   └── page.tsx          # Manage Area + Profile categories
|   │   │   ├── budgets/
|   │   │   │   └── page.tsx
|   │   │   ├── reports/
|   │   │   │   └── page.tsx
|   │   │   └── shared/
|   │   │       └── page.tsx          # Month-end shared expenses report
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   ├── lib/
|   │   ├── prisma.ts
|   │   ├── auth.ts                   # NextAuth v5 config (source of truth for auth)
|   │   ├── validations/
|   │   │   ├── expense.ts
|   │   │   ├── income.ts
|   │   │   └── budget.ts
|   │   └── utils/
|   │       ├── currency.ts
|   │       ├── date.ts
│   │       └── utils.test.ts         # Unit tests for utilities
│   └── middleware.ts
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── .env.local
├── .env.test                     # Env vars for the test database
└── package.json

```
