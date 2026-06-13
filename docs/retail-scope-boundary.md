# Retail Scope Boundary

Retail business mode is the active implementation scope.

Do not treat global frontend or backend typecheck failures from unrelated modules as Retail blockers while the project is in Retail implementation mode.

## Retail validation commands

```bash
pnpm --filter @workspace/api-server run typecheck:retail
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm --filter @workspace/pos-system build
```

## Out of scope for the Retail gate

```txt
- F&B legacy modules
- platform-admin modules
- shared financial-report dashboard cleanup
- future Retail registry placeholders not wired to active Retail flows
- raw-material mode
- service mode
```

## Current Retail gate fixes

```txt
- Retail receiving status output is normalized before returning DTOs.
- API client root explicitly exports Retail workflow helpers and related DTO types.
- Retail receiving workspace has tightened local types for scoped frontend validation.
- Frontend has a Retail-only tsconfig and typecheck:retail script.
```
