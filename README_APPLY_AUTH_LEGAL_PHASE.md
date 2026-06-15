# Auth Hardening Phase

This branch hardens the POS System auth surface incrementally.

## Covered phases

### Phase 1: Auth core helpers

- Centralizes auth helpers in `artifacts/api-server/src/lib/auth.ts`.
- Adds `requireAuth`, `requireActiveUser`, `requireActiveBusiness`, `requirePermission`, `requireAnyPermission`, `requireBusinessScope`, and `requireModeAccess`.
- Adds `sanitizeUser` so auth responses do not expose `passwordHash` or session internals.

### Phase 2: Database-backed sessions

- Moves dashboard auth from token-only cookie validation to database-backed sessions using the existing `Session` model.
- Stores only `tokenHash` in the database.
- Keeps the raw session token only in the HttpOnly cookie.
- Rejects expired sessions and deletes them during verification.
- Adds session cleanup helpers.
- Updates logout to remove the database session before clearing the cookie.

### Phase 3: Auth rate limiting

- Adds an MVP in-memory fixed-window rate limiter.
- Limits login by IP and normalized email hash.
- Limits register by IP.
- Uses safe `429 RATE_LIMITED` errors.

### Phase 4: Permission key standardization

- Standardizes permission keys to documented dot notation.
- Uses `restaurant.*` permissions for Restaurant mode workflows.
- Keeps `shared.*` permissions for shared dashboards and reporting.
- Updates restaurant security policy DTO types to match backend permission keys.
- Updates order status rules to use `restaurant.orders.*`, `restaurant.payments.*`, `restaurant.kitchen.*`, and `restaurant.serving.*` keys.

## Manual checks

```bash
cd artifacts/api-server
pnpm typecheck
pnpm build
```

Then manually test:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- Login rate limit by IP and email.
- Register rate limit by IP.
- `GET /restaurant/security/policy` returns dot-notation permission keys.
- Order status permission checks still follow the Restaurant workflow.

## Notes

The rate limiter is MVP-only and in-memory. It is acceptable for local development or a single-instance MVP. Production or serverless deployment should use a distributed limiter such as Redis or provider-level protection.
