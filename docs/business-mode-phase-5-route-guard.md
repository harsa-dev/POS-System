# Business Mode Phase 5: Route Guard Migration

## Goal

Migrate business mode routing from legacy ids to the centralized business mode contract.

Legacy ids:

```txt
restaurant
service
warehouse
```

Current ids:

```txt
restaurant
retail
raw-material
custom-business
```

## Current mode state

Selectable:

```txt
restaurant
retail
raw-material
```

Planned / locked:

```txt
custom-business
```

## Current rules

- Frontend route guard is UX protection only.
- LocalStorage is not a backend security source of truth.
- Backend must still enforce authenticated business context.
- Restaurant routes require `restaurant`.
- Retail routes require `retail`.
- Raw Material routes require `raw-material`.
- Shared dashboard routes require a valid active business mode.
- Switching mode clears frontend query cache so shared routes refetch with the selected mode header.
- Legacy storage values should repair into current ids.

## Route examples

```txt
/workspace/restaurant/*       -> restaurant
/dashboard/restaurant/*              -> restaurant
/v3/retail/*                  -> retail
/v3/raw-material/*            -> raw-material
/dashboard/cashflow           -> active mode context
/dashboard/financial-reports  -> active mode context
/dashboard/customers          -> active mode context
/dashboard/invoice-generator  -> active mode context
```

## Manual checklist

```txt
1. Clear currentBusinessMode, open /dashboard -> /select-mode.
2. Set currentBusinessMode=restaurant, open /dashboard -> restaurant entry route.
3. Set currentBusinessMode=retail, open /dashboard -> retail entry route.
4. Set currentBusinessMode=raw-material, open /dashboard -> raw material entry route.
5. Open restaurant route while retail active -> /select-mode.
6. Open retail route while restaurant active -> /select-mode.
7. Open cashflow, switch mode, return to cashflow -> refetch under selected mode.
8. custom-business remains locked.
```

## Deferred

```txt
Sidebar/module filtering hardening
Select-mode next-route support
Backend persisted business-mode access
Mode switch audit log
```
