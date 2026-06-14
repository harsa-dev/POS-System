# V3 Phase 2 Quality Cleanup

Status: local cleanup batch

This phase keeps the V3 canonical mode architecture from `docs/v3-canonical-business-modes.md` intact and focuses on removing type drift, duplicated parsing logic, and confirmed dead frontend files.

## Scope Completed

- Backend TypeScript drift was fixed around upload typing, request parameter narrowing, audit log ownership fields, inventory stock movement writes, order status stock movement writes, and restaurant role checks.
- Frontend API response parsing was centralized in `artifacts/pos-system/src/lib/api/read-api-envelope.ts`.
- Order, table, menu, invoice, and payment API clients now use the shared envelope reader instead of carrying duplicate local parser blocks.
- The unused duplicate mobile hook `artifacts/pos-system/src/hooks/use-mobile.tsx` was removed after confirming the active import resolves to `artifacts/pos-system/src/hooks/use-mobile.ts`.

## Canonical Mode Rules Preserved

- Active modes remain `restaurant`, `retail`, and `raw-material`.
- `custom-business` remains planned and guarded.
- Old IDs such as `fnb`, `warehouse`, and `service` are not accepted as normal backend API mode values.
- The `currentBusinessMode` storage key remains the frontend storage boundary for mode selection.

## Verification Notes

Run these checks after this cleanup batch:

```bash
pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm --filter @workspace/pos-system run typecheck:service
pnpm --filter @workspace/pos-system run build
pnpm business-mode:check
pnpm restaurant:check
pnpm retail:check
pnpm raw-material:check
pnpm typecheck
```

If local package-manager execution is blocked, use repo-local TypeScript and build commands as supplemental checks and document the exact limitation.

## Manual QA Checklist

1. Open `/select-mode`.
2. Select Restaurant and refresh the Restaurant workspace.
3. Open a Restaurant route directly.
4. Select Retail and refresh the Retail workspace.
5. Open a Retail route directly.
6. Select Raw Material and refresh the Raw Material workspace.
7. Open a Raw Material route directly.
8. Try an invalid `currentBusinessMode` value.
9. Try an empty `currentBusinessMode` value.
10. Try planned Custom Business and confirm it remains guarded or planned.
11. Try old `/dashboard/fnb/*` routes and confirm they are not normal active routes.
12. Confirm no runtime UI label presents FNB as canonical.
