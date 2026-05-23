# Restaurant POS System

A full-stack restaurant point-of-sale system migrated from Next.js/Vercel to Vite + React + Express on the Replit pnpm workspace stack.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — build & run the API server (port 8080)
- `pnpm --filter @workspace/pos-system run dev` — run the Vite frontend (port 20639)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `cd artifacts/api-server && pnpm exec tsx prisma/seed.ts` — seed demo data
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Wouter
- API: Express 5 (port 8080)
- DB: PostgreSQL + Prisma v7 (with `@prisma/adapter-pg`)
- Auth: JWT sessions via `jose` + `bcryptjs`, stored in HttpOnly cookies
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/pos-system/src/` — React frontend
  - `App.tsx` — root with AuthContext + Wouter router + all routes
  - `components/auth/` — login + register forms
  - `components/dashboard/` — shell, sidebar, topbar
  - `pages/dashboard/` — all dashboard page wrappers
  - `features/` — domain logic (orders, menu, etc.)
- `artifacts/api-server/src/` — Express backend
  - `routes/` — all API routes (auth, menu, orders, tables, inventory, shifts, employees, attendance, analytics, misc)
  - `lib/prisma.ts` — Prisma client with pg adapter
  - `lib/auth.ts` — JWT helpers + requireRole + getCurrentUser
- `artifacts/api-server/prisma/schema.prisma` — DB schema source of truth
- `artifacts/api-server/prisma/seed.ts` — demo data seeder

## Architecture decisions

- Prisma v7 requires `@prisma/adapter-pg` + explicit pg Pool; `PrismaClient` must be imported via `createRequire` (not ESM named import) because `@prisma/client` only exports CJS
- Vite proxies `/api` → `http://localhost:8080` for development (see `vite.config.ts`)
- Cookies use `sameSite: "lax"` in dev, `sameSite: "none" + secure` in production
- API server is on port 8080 (external 3000); Vite frontend is on port 20639 (external 80 via Replit preview)
- All dashboard routes are protected by `ProtectedRoute` which checks AuthContext

## Product

A complete restaurant POS with: login/register, dashboard overview, checkout/order creation, order management, menu management, table management, KDS (kitchen display), analytics, payments, inventory, employee management, attendance, shifts, settings, serving view, and audit logs.

## Demo accounts (password: `password123`)

- `owner@test.com` — OWNER role (full access)
- `manager@test.com` — MANAGER role
- `cashier@test.com` — CASHIER role

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Prisma v7 ESM import fails with "not an export named PrismaClient" — use `createRequire` pattern (see `src/lib/prisma.ts`)
- The `features/` folder contains server-side service files with `@prisma/client` imports — these are NOT imported by React components and are leftover from Next.js migration
- esbuild externalizes `@prisma/client` and `@prisma/adapter-pg` — they must be resolvable at runtime from node_modules
- Run seed script after any DB reset to restore demo accounts and sample data
- `geist` font package shows a "missing peer next@>=13.2.0" warning — this is harmless, the font works fine without Next.js

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
