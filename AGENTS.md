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

## Tech Stack

| Layer                | Choice                       | Notes                                                  |
| :------------------- | :--------------------------- | :----------------------------------------------------- |
| **Framework**        | Next.js v15 (App Router)     | Full-stack, TypeScript, using `src/` directory         |
| **Language**         | TypeScript (strict mode)     | End-to-end type safety                                 |
| **Styling**          | Tailwind CSS v4              | Added after foundation is working                      |
| Components           | shadcn/ui                    | Added after foundation is working                      |
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

### Default vs user categories

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

---

## PHASE 1 — Foundation (Current Focus)

**Goal:** Database connected, NextAuth v5 working, test environments configured, and a simple protected dashboard rendering. Plain HTML + Tailwind only.

### Step 1 — Setup Testing Infrastructure

Install `vitest`, `@testing-library/react`, and `@playwright/test`. Create a separate test database URL in `.env.test` to ensure integration tests do not wipe your development data.

### Step 2 — NextAuth v5 & Prisma v7 Setup

Implement the singleton Prisma client, `auth.ts` root configuration, NextAuth Route Handlers, and Middleware to protect `/` and expose `/login`.

### Step 3 — Database Seed

Seed "Husband" and "Wife" user accounts in `prisma/seed.ts` so authentication can be verified.

### Step 4 — Login & Dashboard Views

Create a basic client-side form using `signIn("credentials", { redirect: false })`. Handle routing to `/` manually. The Dashboard should display a welcome message with the authenticated user's name.

### Phase 1 Verification Checklist

- [ ] **Unit:** `src/lib/utils.test.ts` verifies any basic text/data parsing functions.
- [ ] **Integration:** `src/actions/auth.test.ts` verifies that the `authorize` function in NextAuth rejects invalid credentials and accepts valid ones against the test DB.
- [ ] **E2E:** `e2e/auth.spec.ts` automatically opens a browser, navigates to `/login`, fills in credentials, clicks submit, and asserts that the URL changes to `/` and the user's name is visible.
- [ ] **Manual:** `npx prisma studio` shows both user accounts. Unauthenticated visits to `/` redirect to `/login`.

---

## PHASE 2 — Core Features (After Phase 1 is verified)

**Goal:** Implement Server Actions for creating global Categories and logging Expenses/Income. Plain HTML forms only.

### Phase 2 Verification Checklist

- [ ] **Unit:** Tests for pure UI components (e.g., verifying the category dropdown renders the correct options). Tests for currency formatters.
- [ ] **Integration:** Tests for the `createExpense` Server Action. Ensure it correctly formats the `Decimal` type, enforces the Area/Profile dual-category rule, and throws an error if unauthenticated.
- [ ] **E2E:** A Playwright script that logs in, navigates to "Add Expense", fills out the form, submits, and verifies the new expense appears on the dashboard list.

---

## PHASE 3 — UI Polish (After Phase 2 is verified)

**Goal:** Introduce shadcn/ui components, complex interactive forms, and validation with Zod.

### Phase 3 Verification Checklist

- [ ] **Unit:** Tests to ensure Zod schemas catch missing or malformed inputs (e.g., negative amounts) before hitting the server.
- [ ] **Integration:** Ensure the Server Actions correctly parse and return Zod validation errors to the client.
- [ ] **E2E:** Verify that shadcn Modals/Dialogs open correctly, and that toast notifications appear upon successful data insertion.

---

## PHASE 4 — Advanced Features (After Phase 3 is verified)

**Goal:** Implement global Budgets, Data Visualization with Recharts, and Month-end Dashboard analytics.

### Phase 4 Verification Checklist

- [ ] **Unit:** Complex math testing. Test the functions that aggregate joint expenses and calculate remaining budget percentages.
- [ ] **Integration:** Test the `Budget` Server Actions. Ensure the `@@unique([categoryId, month, year])` constraint successfully rejects duplicate budgets.
- [ ] **E2E:** A complete month-end flow test. Playwright logs in, views the shared dashboard, verifies the aggregated charts render (checking for SVG nodes), and asserts that the "Total Household Spend" correctly matches the sum of both Husband and Wife's expenses.
