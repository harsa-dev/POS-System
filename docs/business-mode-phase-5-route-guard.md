# Business Mode Phase 5: Route Guard Migration

## Goal

Migrate business mode routing from the old legacy mode ids to the new centralized business mode contract.

Old ids:

```txt
fnb
retail
service
warehouse
```

New ids:

```txt
restaurant
retail
raw-material
custom-business
```

The goal is not to open every planned workspace. The goal is to make route protection understand the new registry while keeping old localStorage values from breaking existing users.

## What changed

- Route guard now reads business mode state from the centralized business mode storage helper.
- Legacy `fnb` storage values are normalized to `restaurant`.
- Invalid, empty, or non-selectable planned modes redirect to `/select-mode`.
- Restaurant/F&B operational routes now require `restaurant` instead of `fnb`.
- Raw Material Kandang route is guarded behind `raw-material`, which is currently planned and not selectable.
- Dashboard entry route now comes from the business mode registry instead of hardcoded legacy mode checks.

## Rules

- Frontend route guard is UX protection only.
- LocalStorage is not a security source of truth.
- Planned modes must not become active workspaces through manual URL entry.
- Restaurant/F&B remains the only selectable operational workspace.
- Legacy localStorage values should be repaired, not allowed to break navigation.

## Anti-patterns avoided

- No hardcoded legacy `fnb` checks for restaurant routes.
- No planned Retail/Raw Material/Custom Business dashboard masquerading as a finished feature.
- No localStorage-only security claim.
- No route access to planned Raw Material workspace from direct URL.
- No database rename from `restaurantId` to `businessId` in this phase.

## Manual test checklist

1. Clear `currentBusinessMode`, then open `/dashboard`.
   - Expected: redirect to `/select-mode`.
2. Set `currentBusinessMode=fnb`, then open `/dashboard`.
   - Expected: value is repaired to `restaurant`, then restaurant workspace loads.
3. Set `currentBusinessMode=restaurant`, then open `/dashboard`.
   - Expected: redirect to restaurant POS workspace.
4. Set `currentBusinessMode=retail`, then open `/dashboard`.
   - Expected: redirect to `/select-mode` because Retail is planned.
5. Set `currentBusinessMode=raw-material`, then open `/v3/raw-material/kandang`.
   - Expected: redirect to `/select-mode` because Raw Material is planned.
6. Open `/workspace/restaurant/pos` with `currentBusinessMode=restaurant`.
   - Expected: workspace loads.
7. Open `/workspace/restaurant/pos` with `currentBusinessMode=custom-business`.
   - Expected: redirect to `/select-mode`.

## Deferred

- Sidebar/module filtering by active business mode.
- Backend persisted business mode access.
- Audit log for mode changes.
- Real mode-specific workflows for Retail, Raw Material, and Custom Business.
