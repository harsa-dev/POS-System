---
name: Retail mode demo setup
description: Retail business seed process, API-wired vs mock-only module map, and structural limits to reaching 100% retail coverage.
---

## Retail demo accounts (password: password123)
- `retail@test.com` — OWNER (id: `usr-retail-owner`, businessId: `biz-demo-retail`)
- `retail.manager@test.com` — MANAGER (can approve returns)

## Business record
- id: `biz-demo-retail`, name: "Demo Retail Store", mode: RETAIL, type: RETAIL
- 6 products, 3 suppliers seeded via `pnpm run retail:seed` (inside `artifacts/api-server`)

## Re-seeding after DB reset
1. Run main seed: `cd artifacts/api-server && DATABASE_URL="$DATABASE_URL" pnpm exec tsx prisma/seed.ts`
2. Insert retail business + user via SQL (use existing password hash from owner@test.com)
3. Run retail seed: `cd artifacts/api-server && DATABASE_URL="$DATABASE_URL" pnpm run retail:seed`

## API-wired retail modules (real Prisma persistence)
- `cashier` → `RetailApiWorkspace` in `retail-api-workspace.tsx` (wired via App.tsx)
- `catalog` → `RetailApiWorkspace` in `retail-api-workspace.tsx` (wired via App.tsx)
- `receiving` → `RetailReceivingApiWorkspace` in `retail-receiving-api-workspace.tsx`
- `returns-exchanges` → `RetailReturnsApiWorkspace` in `retail-returns-api-workspace.tsx`

## Mock-only retail modules (no backend API endpoints exist)
- `stock-opname`, `shelf-management`, `promotions` — uses `RetailWorkspace` (interactive mock in retail-workspace.tsx)
- `customers-loyalty`, `staff-shifts`, `forecasting` — uses `RetailGrowthWorkspace` (demo data only)
- `multi-location`, `omnichannel`, `audit-controls` — uses `RetailGrowthWorkspace` (demo data only)

**Why 100% is not achievable:** Stock opname, shelf management, and promotions have no DB schema or API routes. Growth/Enterprise modules (CRM, forecasting, multi-location, omnichannel) are intentional future roadmap — no schema, no routes.

## Retail API guard
`getRetailRequestContext` in `retail.ts` returns 409 if `businessContext.businessMode !== "retail"`. User must be linked to a Business with `mode = "RETAIL"`.

## Key pattern: mock fallback
All real API workspaces (cashier, catalog, receiving, returns) use a graceful mock fallback when the API returns empty or errors. Writes (checkout, status updates, returns) are disabled in mock-fallback mode.
