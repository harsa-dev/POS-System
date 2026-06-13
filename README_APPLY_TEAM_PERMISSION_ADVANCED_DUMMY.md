# Team Management Advanced Role Permission Dummy

Extract this ZIP from the repository root.

Files:
- artifacts/pos-system/src/features/shared/team-management/role-permission-library.ts
- artifacts/pos-system/src/features/shared/team-management/role-permission-store.ts
- artifacts/pos-system/src/features/shared/team-management/team-management-page.tsx
- artifacts/pos-system/src/pages/dashboard/team-management.tsx
- docs/role-permission-system-dummy.md

What changed:
- Adds localStorage persistence for dummy role/permission state.
- Adds role create/update/clone/delete.
- Adds permission matrix with all/view-only/none quick controls.
- Adds role assignment to dummy team members.
- Adds policy payload preview for backend.
- Adds import/export JSON.
- Adds audit-style changelog.
- Keeps default system roles locked.

Run:

```bash
cd artifacts/pos-system
pnpm build
pnpm dev
```

Open:
- /dashboard/team-management
