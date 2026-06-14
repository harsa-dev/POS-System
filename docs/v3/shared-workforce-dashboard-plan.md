# Shared Workforce & Operations Dashboard Plan

This document prepares the shared dashboard modules requested for V3 without changing the Prisma schema yet.

The current implementation is intentionally hardcoded and UI-only. It exists to validate navigation, layout, module grouping, and future data contracts before backend and schema work begins.

## Implemented UI-Only Dashboards

The shared dashboard layer now includes these demo dashboards:

- HPP Calculator
- Shift Reports
- Team Management
- Shift Overview
- Employee Performance
- Audit Log
- Approval Center
- Employee Contracts
- Employee Attendance
- Payroll

These dashboards live under the current runtime structure:

```txt
artifacts/pos-system/src/features/shared/workforce-operations/
artifacts/pos-system/src/pages/dashboard/
```

The advanced Team Management role and permission workspace now lives in:

```txt
artifacts/pos-system/src/features/shared/team-management/
artifacts/pos-system/src/pages/dashboard/team-management.tsx
```

This follows the existing project structure while staying aligned with the V3 target direction where shared business management modules eventually belong under `business/`.

## Current Rule

Do not update Prisma schema yet.

Allowed now:

- hardcoded UI
- dummy data tables
- dashboard route wiring
- sidebar registry wiring
- data-contract planning docs
- localStorage-backed Team Management role and permission simulation
- frontend API contract definitions that are not wired into runtime yet
- read-only Team Management backend snapshot API

Not allowed yet:

- new Prisma models
- new migrations
- payroll calculations from real employee data
- attendance device integrations
- approval mutation APIs
- audit log writes
- schema-level contract storage
- Team Management mutation APIs

## Team Management Frontend Phases

### Phase 1: Panel Refactor

The existing Team Management dashboard was split into focused frontend components without changing behavior:

- overview cards
- job role preset panel
- draft role builder
- permission matrix
- role registry
- assignment/import-export panel
- access changelog

The route remains `/dashboard/team-management`.

Storage remains localStorage-backed through `role-permission-store.ts`.

No backend API or Prisma schema changes were introduced.

### Phase 2: Local UX Upgrade

The Team Management dashboard now has a stronger local UX layer while still remaining frontend-only:

- searchable member table
- member status filter
- member role filter
- member overview counts
- assignment impact preview
- assigned-user count per role
- two-step custom role delete confirmation
- warning when deleting a role that is assigned to members

Deleting an assigned custom role still uses the existing dummy behavior: affected members are reassigned to Viewer in localStorage.

This is intentionally not real employee management yet. The purpose is to validate UX, role-risk flow, and future API contracts before committing to schema work. Revolutionary restraint, apparently.

### Phase 3: Store Stabilization

The local role permission store now sanitizes localStorage and imported JSON before using it in the UI.

- invalid roles are dropped
- invalid permissions are filtered against the current permission registry
- broken member role references fall back to Viewer
- invalid logs are dropped
- selected role/member/assignment IDs fall back when deleted or missing

### Phase 4: API Contract Boundary

Team Management now has frontend-only API contract files:

```txt
artifacts/pos-system/src/features/shared/team-management/team-management-contract.ts
artifacts/pos-system/src/features/shared/team-management/team-management-api.ts
```

The UI is still not wired to these API calls. These files define the future backend surface for snapshot, roles, members, role assignment, status update, and audit-log reads.

Reference doc:

```txt
docs/v3/team-management-phase-4-api-contract.md
```

### Phase 5: Read-only Snapshot API

The backend now exposes the first Team Management read-only route:

```txt
GET /api/team-management/snapshot
```

This endpoint maps existing `User`, canonical `Role`, current business context, and recent `AuditLog` rows into the Team Management snapshot DTO.

It does not write data, create custom roles, assign roles, change member status, or create new Prisma tables.

Reference doc:

```txt
docs/v3/team-management-phase-5-readonly-snapshot-api.md
```

## Future Data Contract Draft

### HPP Calculator

Future source candidates:

- recipe item cost
- raw material purchase price history
- packaging cost
- direct labor allocation
- overhead allocation
- output unit quantity
- target margin
- suggested selling price

Possible future entities:

- `CostingScenario`
- `CostingInput`
- `CostingResult`

### Shift Reports

Future source candidates:

- shift opening cash
- shift closing cash
- expected cash
- revenue by payment method
- cash variance
- shift notes
- supervisor approval
- cashflow sync state

Possible future entities:

- existing `Shift`
- existing `Payment`
- future `ShiftApproval`

### Team Management

Future source candidates:

- existing `User`
- employee profile
- role
- department
- employment status
- workload target
- account access state
- permission assignment history
- audit event history

Possible future entities:

- existing `User`
- existing `Permission`
- existing `RolePermission`
- existing `AuditLog`
- `EmployeeProfile`
- `Department`
- `EmployeeRoleAssignment`

### Shift Overview

Future source candidates:

- roster schedule
- assigned employees
- open slots
- availability
- leave requests
- coverage risk

Possible future entities:

- `Roster`
- `RosterSlot`
- `EmployeeAvailability`
- `LeaveRequest`

### Employee Performance

Future source candidates:

- attendance reliability
- task completion
- cash variance
- stock correction accuracy
- manager review
- customer-facing service metrics

Possible future entities:

- `EmployeePerformanceSnapshot`
- `PerformanceMetric`
- `PerformanceReview`

### Audit Log

Future source candidates:

- actor id
- actor role snapshot
- module name
- action type
- entity type
- entity id
- before/after diff
- severity
- request metadata

Possible future entities:

- `AuditLog`
- `AuditLogDiff`

### Approval Center

Future source candidates:

- request type
- requester
- approver
- status
- amount threshold
- reason
- approval notes
- audit reference

Possible future entities:

- `ApprovalRequest`
- `ApprovalStep`
- `ApprovalPolicy`

### Employee Contracts

Future source candidates:

- employee id
- contract type
- start date
- end date
- salary term reference
- document URL
- approval state
- renewal reminder

Possible future entities:

- `EmployeeContract`
- `ContractDocument`

### Employee Attendance

Future source candidates:

- employee id
- shift id
- check-in time
- check-out time
- status
- late minutes
- correction reason
- supervisor approval

Possible future entities:

- `AttendanceRecord`
- `AttendanceCorrection`

### Payroll

Future source candidates:

- employee contract salary
- attendance summary
- allowances
- deductions
- overtime
- payroll approval
- payslip generation
- cashflow journal entry

Possible future entities:

- `PayrollRun`
- `PayrollItem`
- `Payslip`
- `PayrollAdjustment`

## Implementation Notes

These dashboards should remain presentation-only until the V3 foundation is stable.

When backend work starts later, implement one module at a time:

1. Team Management
2. Attendance
3. Shift Overview
4. Payroll
5. Approval Center
6. Audit Log
7. Employee Contracts
8. Employee Performance
9. HPP Calculator
10. Shift Reports

This order reduces dependency chaos. Payroll depends on contracts and attendance. Approval depends on permissions and audit. HPP depends on inventory, recipe, purchase, and cost allocation. Software, as usual, punishes impatience.
