<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 1. Project Overview & Architecture

WebApp para casais controlarem suas finanças, com divisão mensal de gastos.

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
