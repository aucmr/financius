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
