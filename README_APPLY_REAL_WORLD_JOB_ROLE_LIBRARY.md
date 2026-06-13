# Real-world Job Role Library Phase

Extract this ZIP from the repository root.

Files:
- artifacts/pos-system/src/features/shared/team-management/role-permission-library.ts
- artifacts/pos-system/src/features/shared/team-management/job-role-library.ts
- artifacts/pos-system/src/features/shared/team-management/role-permission-store.ts
- artifacts/pos-system/src/features/shared/team-management/team-management-page.tsx
- artifacts/pos-system/src/pages/dashboard/team-management.tsx
- docs/real-world-job-role-library.md

What changed:
- Adds real-world inspired job role presets.
- Separates system role from job title.
- Covers restaurant, retail, raw material, and service sectors.
- Adds service roles in a wider set because service businesses are broad.
- Converts a job preset into base role + permission matrix.
- Still dummy frontend/localStorage only.

Run:

```bash
cd artifacts/pos-system
pnpm build
pnpm dev
```

Open:
- /dashboard/team-management
