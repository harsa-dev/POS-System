---
name: Service business demo setup
description: Scripts and state for the service business demo data in this project.
---

## Setup steps (idempotent)
1. `pnpm --filter @workspace/api-server run service:ensure-business`  
   Creates `service-demo-business-owner-demo-1` (SERVICE mode, owned by `owner@test.com`). Safe to re-run.

2. `pnpm --filter @workspace/api-server run service:seed`  
   Seeds 3 requests, 3 jobs, 6 cost lines, 3 quotes, 2 invoices, 6 checklist items, 5 timeline items into the SERVICE business. Uses upsert — safe to re-run.

## Current DB state (after Phase 1)
- `business-demo-1` → Demo Restaurant (RESTAURANT mode, `owner@test.com`)
- `service-demo-business-owner-demo-1` → Service Demo Business (SERVICE mode, `owner@test.com`)
- `biz-demo-retail` → (RETAIL, `retail@test.com`) — separate owner

## Phase 1 complete — service workspace is fully API-wired
All 10 frontend files were updated/created (see phase1-service-workspace-changelog.md). No mock data remains in the service workspace. All previous placeholder panels have been replaced with real data views.
