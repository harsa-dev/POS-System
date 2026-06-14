# V3 Phase 3 Mode Deep Cleanup

Status: local cleanup batch

Phase 3 audited each V3 business mode and the shared mode infrastructure after the Phase 1 and Phase 2 canonical cleanup work.

## Modes

- Active: `restaurant`, `retail`, `raw-material`
- Planned and guarded: `custom-business`
- Historical storage-only migration values: `fnb`, `warehouse`, `service`

## Restaurant

- Runtime FNB/F&B labels were removed from Restaurant source surfaces.
- `features/restaurant/modules.ts` now exports `restaurantModules`, `RestaurantModule`, and `RestaurantModuleId`.
- Restaurant POS, menu, tables, recipe, monitoring, and Retail crossover copy now uses Restaurant naming.
- The Restaurant route and feature folder remain canonical.

## Retail

- Retail route guarding remains mode-scoped under `/v3/retail/*`.
- Retail workspace copy no longer uses warehouse-mode wording for shelf workflows.
- Retail mock data now references Restaurant as the other active mode instead of old F&B screens.

## Raw Material

- Raw Material route guarding remains mode-scoped under `/v3/raw-material/*`.
- The Kandang workspace copy now describes Raw Material as an active V3 workspace instead of a planned fallback.
- Raw Material readiness copy now says `Data source` instead of `Service source`.
- Frontend inventory policy typing now matches the backend canonical policy modes: `restaurant`, `retail`, `raw-material`, and `custom-business`.

## Custom Business / Service Planned State

- Custom Business route prefixes are now treated as planned mode-scoped paths.
- Old `service` storage values are not treated as an active preview mode.
- The direct Custom Business service workspace stays non-operational and shows planned cards only.
- The Service Business shared dashboard bridge is a static planned preview and no longer calls backend service APIs from shared dashboard code.

## Shared Infrastructure

- API client mode headers now consume `BUSINESS_MODE_STORAGE_KEY` and canonical `businessModeIds` from the central business-mode contract.
- Wrong-mode nested route redirects preserve the requested route through `/select-mode?next=...`.
- Shared dashboard code no longer imports from `app/workspace/custom-business`.
- The Team Management role library uses `custom-business` as the planned sector instead of `service` as a runtime-like sector.
- Empty legacy folders `artifacts/pos-system/src/features/fnb` and `artifacts/pos-system/src/features/orders/constans` were removed after confirming they contained no files and had no source imports.

## Manual QA Checklist

1. Open `/select-mode`.
2. Clear `currentBusinessMode`, refresh a protected route, and confirm redirect to `/select-mode`.
3. Set invalid `currentBusinessMode`, refresh, and confirm safe mode selection behavior.
4. Set old `fnb`, refresh, and confirm only the storage boundary repairs to Restaurant.
5. Set old `warehouse`, refresh, and confirm only the storage boundary repairs to Raw Material.
6. Set old `service`, refresh, and confirm Service does not become an active mode.
7. Select Restaurant, refresh `/workspace/restaurant/pos`, and confirm no FNB/F&B labels.
8. Open a Restaurant dashboard route directly and confirm Restaurant mode access.
9. Select Retail, refresh `/v3/retail/cashier`, and confirm no Restaurant or Raw Material leakage.
10. Select Raw Material, refresh `/v3/raw-material/kandang`, and confirm no Restaurant or Retail leakage.
11. Open `/workspace/custom-business/service` and confirm it is guarded or planned, not production-ready.
12. Open shared dashboards and confirm Service Business bridge content does not appear during active Restaurant, Retail, or Raw Material sessions.

## Remaining Risks

- Several large mode files remain candidates for future split work, especially Retail interactive workspace, Raw Material placeholder workspace, and shared team/workforce dashboards.
- Service Business backend routes still exist as planned-workflow scaffolding; they were not removed because this phase did not rewrite backend feature availability.
- Full browser QA still needs to be run manually in the local app.
