# Role & Permission System Dummy Plan

## Goal

Move from hard-coded restaurant-style roles into a business-mode-neutral access system.

Default system roles stay locked:

- OWNER
- MANAGER
- ADMIN
- OPERATOR
- STAFF
- VIEWER

Custom roles sit on top of a base system role and own a list of permission keys.

## Current UI Dummy

The Team Management page now supports:

- role library templates
- locked default roles
- custom role creation
- permission matrix
- role cloning
- role deletion for custom roles
- dummy team assignment
- localStorage persistence
- JSON import/export
- policy payload preview
- audit-style changelog

## Permission Key Shape

```txt
<scope>.<module>.<action>
```

Examples:

```txt
operations.orders.view
operations.orders.approve
finance.cashflow.export
admin.team.manage
admin.settings.update
```

## Future Backend Schema

Recommended models:

```prisma
model RoleTemplate {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  baseRole    Role
  isSystem    Boolean  @default(false)
  isLocked    Boolean  @default(false)
  description String?
  permissions RolePermission[]
  assignments UserRoleAssignment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([businessId, name])
  @@index([businessId])
}

model RolePermission {
  id             String @id @default(cuid())
  roleTemplateId String
  key            String

  roleTemplate RoleTemplate @relation(fields: [roleTemplateId], references: [id], onDelete: Cascade)

  @@unique([roleTemplateId, key])
}

model UserRoleAssignment {
  id             String @id @default(cuid())
  businessId      String
  userId          String
  roleTemplateId  String
  assignedById    String?
  assignedAt      DateTime @default(now())

  business     Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleTemplate RoleTemplate @relation(fields: [roleTemplateId], references: [id], onDelete: Cascade)

  @@unique([businessId, userId, roleTemplateId])
  @@index([businessId])
}
```

## Guard Rule

Backend should resolve access like this:

1. Get current user session.
2. Resolve businessId from user/business membership.
3. Load assigned role templates for that business.
4. Merge permission keys.
5. Check required permission key.
6. Never trust localStorage role state.

That last line exists because humans keep trying to secure apps with browser storage. A bold and cursed lifestyle.
