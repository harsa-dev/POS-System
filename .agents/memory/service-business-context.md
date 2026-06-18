---
name: Service business context resolution
description: Multi-mode owners must use the service-specific resolver in all service routes to avoid getting the wrong business.
---

## Rule
All service route files must use `requireServiceBusinessContextForUser(user)` instead of `requireBusinessContextForUser(user)` when resolving business context.

## Why
`getBusinessForUser` runs `findFirst` on businesses filtered by `ownerId` for OWNER-role users — no mode filter. An owner who has both a RESTAURANT and a SERVICE business (common in the demo setup) will always get the RESTAURANT business returned first (created earlier). The service CRUD queries then run against the restaurant businessId and return empty data.

`requireServiceBusinessContextForUser` was added to `get-business-for-user.ts` and exported from the `business-context/index.ts` barrel. It adds `mode: "SERVICE"` to the Prisma `findFirst` filter.

## How to apply
Any new service route file must import `requireServiceBusinessContextForUser` (not `requireBusinessContextForUser`) from `../lib/business-context/index.js`. The 5 existing route files (`service-business.ts`, `service-business-status.ts`, `service-business-workflow.ts`, `service-business-preview.ts`, `service-business-reversal.ts`) have already been updated.

For non-owner roles the function falls back to `id: user.businessId` (no mode check needed since the user is already linked to the correct business).
