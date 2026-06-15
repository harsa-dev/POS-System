# Invoice Generator Final Audit

This note captures the current Invoice Generator module state after the shared-dashboard hardening pass.

## Scope

The Invoice Generator is now treated as a shared business dashboard, not a restaurant-only dashboard. Frontend invoice records use `businessId`, while backend routes resolve access through the authenticated user's business context.

## Backend route order

Route order matters because several invoice endpoints share the `/api/invoices` prefix.

### App-level mounts

`artifacts/api-server/src/app.ts` mounts these routes before the general API router:

1. `/api` invoice mutation guard
2. `/api` invoice history/export
3. `/api` shared customers/partners routes
4. `/api` main router

This keeps the invoice guard and filtered history route ahead of the older invoice router.

### Main router mounts

`artifacts/api-server/src/routes/index.ts` mounts invoice-specific routes in this order:

1. `invoiceStatusRouter`
2. `invoiceSummaryRouter`
3. `invoiceFollowUpAnalyticsRouter`
4. `invoiceFollowUpsRouter`
5. `invoiceFollowUpRemindersRouter`
6. `invoicesRouter`

Keep this order. Nested and specialized routes must stay before the generic invoice router.

## Frontend workspace flow

`InvoiceGeneratorWorkspace` renders the module in this order:

1. `InvoiceSummaryPanel`
2. `InvoiceFollowUpRemindersPanel`
3. `InvoiceFollowUpAnalyticsPanel`
4. `InvoiceFollowUpPanel`
5. `InvoiceHistoryPanel`
6. `InvoiceGeneratorDashboard` or locked editor panel

The editor remains management-only. View-only roles can still see invoice history and follow-up operations where allowed.

## Event flow

Invoice panels coordinate through lightweight browser events:

- `invoice-generator:load-invoice` loads a history/analytics/follow-up invoice into the editor.
- `invoice-generator:refresh-summary` refreshes summary, reminders, analytics, and related panels after lifecycle or follow-up mutations.
- `invoice-generator:filter-history` applies history filters, including overdue-only filters.
- `invoice-generator:open-follow-up` opens the follow-up tracker for a specific invoice.
- `invoice-generator:filter-follow-up` drills analytics buckets into the follow-up tracker.

Do not add prop-drilling across the whole workspace unless the event flow becomes too implicit to maintain.

## Implemented capability surface

- Invoice capabilities guard.
- Backend mutation guard for create/update/cancel.
- Filtered invoice history.
- CSV/JSON invoice export support.
- Invoice load from history into editor.
- Lifecycle actions: mark sent, mark paid, cancel.
- Lifecycle summary cards.
- Overdue receivable aging.
- Overdue-only history filtering.
- Follow-up tracker with notes and statuses.
- Follow-up history timeline.
- Due reminder dashboard.
- Quick actions: resolve, snooze 3 days, escalate.
- Follow-up analytics and export.
- Analytics drilldown into tracker.

## Final polish applied

The final polish pass hardened React loader effects in:

- `invoice-follow-up-panel.tsx`
- `invoice-history-panel.tsx`

Both now use stable loader callbacks so effect dependencies are explicit and less likely to trigger hook lint drift.

## Local validation checklist

Run these before treating the invoice module as stable:

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual smoke checks:

1. Open Invoice Generator with a management user.
2. Confirm history loads.
3. Create or load an invoice.
4. Mark a draft invoice as sent.
5. Mark a sent invoice as paid.
6. Cancel a draft/sent invoice.
7. Confirm summary cards refresh.
8. Create an overdue follow-up note.
9. Confirm reminder panel updates.
10. Use quick actions: resolve, snooze, escalate.
11. Export follow-up CSV/JSON.
12. Click analytics buckets and confirm the follow-up tracker filters.
13. Open with a view-only role and confirm the editor is locked while history remains viewable.

## Known caution

The invoice follow-up backend uses raw SQL helper routes for follow-up tables and analytics. Build may pass while runtime behavior still depends on database column names and raw SQL result casing. Validate with a seeded local database, not just TypeScript.
