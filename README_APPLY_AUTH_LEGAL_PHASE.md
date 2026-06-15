# Auth Legal Dummy Phase

Extract this ZIP from the repository root.

Why this ZIP exists:
- Login/register links and legal component were pushed to GitHub.
- The GitHub connector blocked the large App.tsx router update.
- This replacement wires /privacy, /terms, /security, and /cookies into the SPA router.

After extracting:

```bash
cd artifacts/pos-system
pnpm build
pnpm dev
```

Test:
- /login
- /register
- /privacy
- /terms
- /security
- /cookies
```

## Auth hardening note

Auth hardening is tracked in draft PR #4.

Implemented so far:
- Phase 1: centralized auth helpers, safe user response, active user/business checks, generic invalid login response.
- Phase 2: database-backed session persistence using the existing Prisma `Session` model, session token hashing, expired-session pruning on login/verification, and backend session revocation on logout.

Manual backend checks:

```bash
cd artifacts/api-server
pnpm typecheck
pnpm build
```

Auth smoke checks:
- login creates one `Session` row with `tokenHash`
- `/auth/me` works while the session row exists
- logout deletes the matching `Session` row
- `/auth/me` returns unauthorized after logout
- expired sessions are rejected and removed
