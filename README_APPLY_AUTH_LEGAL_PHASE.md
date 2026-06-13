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
