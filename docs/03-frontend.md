# Frontend

## 1. Purpose

This document defines the frontend architecture, routing rules, UI structure, state management strategy, data fetching rules, form handling, role-based UI behavior, and frontend boundaries for POS System V3.

The goal is to make the frontend usable, consistent, maintainable, role-aware, and aligned with backend business rules.

This document does not define backend API internals, database schema, authentication implementation details, or deployment setup. Those areas are handled in separate documents.

---

## 2. Current Context

POS System V3 is a web-based business application.

The current active mode is:

```txt
Restaurant / F&B
```

The frontend currently needs to support Restaurant / F&B workflows such as:

```txt
Dashboard
Cashier
Orders
Kitchen
Serving
Menu
Inventory
Payments
Analytics
Employees
Settings
Mode selection
```

V3 is designed to support multiple business modes:

```txt
Restaurant / F&B
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

The frontend must support this direction without pretending that all planned modes are fully implemented.

The frontend must be:

```txt
role-aware
mode-aware
business-scoped
responsive
clear during loading/error states
safe from frontend-only security assumptions
```

Frontend may help users interact with the system, but it must not become the source of business truth.

---

## 3. Decisions

The following frontend decisions are locked:

1. Frontend is the presentation and input layer.
2. Backend is the business decision maker.
3. Database is the final persisted source of truth.
4. Frontend must not directly access the database.
5. Frontend must not decide final price, total, payment status, role, permission, tenant scope, or workflow status.
6. Frontend must reflect backend response as final state.
7. Frontend may hide or disable UI based on permission for user experience.
8. Frontend permission checks are not security.
9. Backend must still enforce all permissions.
10. Restaurant / F&B is the active frontend mode.
11. Planned modes may appear as planned or disabled, but must not look production-ready.
12. Shared UI components must be reusable and consistent.
13. Feature-specific components must stay inside their feature folder.
14. Layout must adapt to role and active business mode.
15. Frontend state must be separated by responsibility.
16. Server state should come from backend APIs.
17. Local UI state should stay local when possible.
18. Global client state should be used only when multiple routes/features need it.
19. Forms must validate on frontend for UX and backend for correctness.
20. Loading, error, and empty states must be handled clearly.

---

## 4. Rules

### 4.1 Frontend Responsibility Rules

Frontend may:

```txt
display data
collect user input
show loading state
show error state
show empty state
show estimated totals
hide unavailable actions for UX
manage temporary cart state
manage selected mode display
call backend APIs
```

Frontend must not:

```txt
calculate final price as truth
calculate final total as truth
decide final payment status
decide final workflow transition
decide real user permission
decide tenant/business scope
decide stock deduction
write audit logs
mutate database directly
bypass backend validation
```

### 4.2 Routing Rules

Routes must be clear and feature-based.

Good:

```txt
/dashboard/orders
/dashboard/cashier
/dashboard/kitchen
/dashboard/serving
/dashboard/inventory
/dashboard/analytics
/select-mode
/customer/menu
/customer/order-status
```

Bad:

```txt
/dashboard/page1
/dashboard/stuff
/dashboard/new-feature-final
/dashboard/test
```

Route names must describe the business area.

### 4.3 Layout Rules

The dashboard layout must support:

```txt
sidebar
topbar
main content
user menu
role-aware navigation
mode-aware navigation
loading state
empty state
error state
```

Different roles may see different navigation.

Examples:

```txt
OWNER:
Dashboard, Orders, Inventory, Analytics, Employees, Settings

CASHIER:
Cashier, Orders, Payments, Shift

KITCHEN:
Kitchen Queue

SERVER:
Serving, Tables

MANAGER:
Dashboard, Orders, Inventory, Reports, Staff
```

Frontend may hide navigation items, but backend must still protect APIs.

### 4.4 Component Rules

Reusable UI components belong in:

```txt
src/components/ui
```

Layout components belong in:

```txt
src/components/layout
```

Shared business components belong in:

```txt
src/components/shared
```

Feature-specific components belong inside feature folders.

Example:

```txt
src/features/restaurant/orders/components/order-table.tsx
src/features/restaurant/kitchen/components/kitchen-order-card.tsx
src/features/shared/invoice/components/invoice-preview.tsx
```

Do not place all components into one giant global components folder.

### 4.5 State Rules

Frontend state must be separated into:

```txt
local UI state
form state
server state
global client state
auth/current user state
```

Use local state for:

```txt
modal open/close
dropdown open/close
active tab
temporary UI toggle
```

Use form state for:

```txt
login form
create order form
payment form
inventory adjustment form
menu item form
staff form
```

Use server state for:

```txt
orders
menu items
payments
inventory
analytics
users
settings
```

Use global client state only for:

```txt
current business mode
temporary cashier cart
sidebar collapsed
theme
shared UI preference
```

Do not put all state into global store just because it feels powerful. That is how state management turns into a junk drawer with TypeScript types.

### 4.6 Data Fetching Rules

Frontend must fetch business data from backend APIs.

Frontend must not fetch from database directly.

Server state should support:

```txt
loading state
error state
empty state
refetch
pagination
filter
search
```

Frontend must avoid:

```txt
fetching all records without pagination
refetching too aggressively
duplicating the same fetch logic everywhere
trusting cached frontend data as final truth
```

Kitchen and serving pages may use polling during MVP.

Future realtime options:

```txt
SSE
WebSocket
Realtime provider
```

But realtime infrastructure is not required until polling becomes insufficient.

### 4.7 Form Rules

Frontend forms must:

```txt
validate required fields
show clear error messages
disable submit while loading
prevent double submit
reset after success if appropriate
display backend error messages safely
```

Frontend validation is for UX.

Backend validation is required for correctness.

### 4.8 Role-Based UI Rules

Frontend may hide or disable buttons based on:

```txt
role
permissions
active mode
resource status
```

Examples:

```txt
KITCHEN should not see Process Payment button.
CASHIER should not see Start Cooking button unless explicitly permitted.
SERVER should only see serving actions.
VIEWER should not see mutation buttons.
```

However:

```txt
Hidden UI is not security.
Disabled button is not security.
Route guard is not enough.
Backend must enforce permission.
```

### 4.9 Mode-Aware UI Rules

Frontend must understand active business mode.

The active mode may affect:

```txt
navigation
dashboard cards
available modules
page labels
workflow pages
empty states
```

If a mode is planned but not implemented, UI must show it clearly as:

```txt
Planned
Coming Soon
Architecture Ready
```

Do not show planned modes as if they are ready for production use.

### 4.10 Source of Truth Rules

Frontend must treat backend response as final truth.

Frontend may display estimated totals, but backend must return final totals.

Frontend may optimistically update UI only when safe.

Do not use optimistic updates for:

```txt
payment final status
stock mutation
permission changes
role changes
critical order status updates
invoice payment
```

---

## 5. Implementation Guide

### 5.1 Recommended Route Structure

Recommended route structure:

```txt
src/app/
├─ page.tsx
├─ auth/
│  ├─ login/
│  │  └─ page.tsx
│  └─ register/
│     └─ page.tsx
│
├─ select-mode/
│  └─ page.tsx
│
├─ dashboard/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ cashier/
│  │  └─ page.tsx
│  ├─ kitchen/
│  │  └─ page.tsx
│  ├─ serving/
│  │  └─ page.tsx
│  ├─ orders/
│  │  └─ page.tsx
│  ├─ menu/
│  │  └─ page.tsx
│  ├─ inventory/
│  │  └─ page.tsx
│  ├─ payments/
│  │  └─ page.tsx
│  ├─ analytics/
│  │  └─ page.tsx
│  ├─ employees/
│  │  └─ page.tsx
│  └─ settings/
│     └─ page.tsx
│
└─ customer/
   ├─ menu/
   │  └─ page.tsx
   ├─ cart/
   │  └─ page.tsx
   └─ order-status/
      └─ page.tsx
```

This structure may be adjusted gradually.

Do not break stable routes only to make folders look cleaner.

---

### 5.2 Layout Structure

Recommended layout components:

```txt
src/components/layout/
├─ dashboard-layout.tsx
├─ sidebar.tsx
├─ topbar.tsx
├─ mobile-nav.tsx
├─ user-menu.tsx
└─ mode-switcher.tsx
```

Dashboard layout should:

```txt
load current user
load active mode
generate navigation by role and mode
render sidebar/topbar
protect private pages at UX level
show loading state while auth is loading
```

API-level protection remains backend responsibility.

---

### 5.3 Navigation Strategy

Navigation should be generated from configuration.

Example concept:

```ts
type NavigationItem = {
  label: string;
  href: string;
  icon?: string;
  modes: BusinessMode[];
  permissions: PermissionKey[];
};
```

Example:

```ts
const navigationItems = [
  {
    label: "Kitchen",
    href: "/dashboard/kitchen",
    modes: ["RESTAURANT"],
    permissions: ["restaurant.kitchen.view"],
  },
  {
    label: "Invoice",
    href: "/dashboard/invoice",
    modes: ["RESTAURANT", "RETAIL", "RAW_MATERIAL", "SERVICE"],
    permissions: ["shared.invoice.view"],
  },
];
```

Navigation filtering:

```txt
current user
active mode
permission list
feature availability
```

Do not hardcode navigation separately in many components.

---

### 5.4 UI Components

Reusable UI components:

```txt
Button
Input
Textarea
Select
Checkbox
Dialog
Modal
Card
Table
Badge
Tabs
Dropdown
Toast
Skeleton
EmptyState
ErrorState
LoadingState
StatusBadge
DataTable
```

Recommended structure:

```txt
src/components/ui/
├─ button.tsx
├─ input.tsx
├─ card.tsx
├─ dialog.tsx
├─ table.tsx
├─ badge.tsx
├─ toast.tsx
└─ skeleton.tsx
```

Shared utility UI:

```txt
src/components/shared/
├─ loading-state.tsx
├─ empty-state.tsx
├─ error-state.tsx
├─ confirm-dialog.tsx
└─ page-header.tsx
```

Feature-specific UI:

```txt
src/features/restaurant/orders/components/
├─ order-table.tsx
├─ order-card.tsx
├─ order-status-badge.tsx
└─ order-action-buttons.tsx
```

---

### 5.5 Server State Strategy

Use a consistent data fetching strategy.

Recommended options:

```txt
TanStack Query
SWR
Next.js server fetching where appropriate
```

For interactive dashboard pages, TanStack Query is a good fit.

Server state examples:

```txt
orders
kitchen orders
serving orders
menu items
inventory items
payments
reports
employees
settings
```

Server state should define:

```txt
query key
fetch function
loading state
error state
empty state
refetch behavior
stale time if needed
```

Example query keys:

```txt
["orders", restaurantId, filters]
["kitchen-orders", restaurantId]
["serving-orders", restaurantId]
["menu-items", restaurantId]
["inventory-items", restaurantId]
```

Do not use vague keys like:

```txt
["data"]
["list"]
["stuff"]
```

Humanity has suffered enough from vague names.

---

### 5.6 Local and Global State Strategy

Use local state for simple UI:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

Use global state only when needed across pages/features.

Possible global states:

```txt
currentBusinessMode
temporary cashier cart
sidebar collapsed
theme
```

Recommended lightweight store:

```txt
Zustand
```

Avoid putting server data into global client store unless there is a clear reason.

Server data belongs in server state tools.

---

### 5.7 Cashier Cart State

Cashier cart may be stored as temporary client state.

Cart may include:

```txt
menuItemId
name
unitPrice display
quantity
notes
```

Important:

```txt
Frontend cart price is only display/estimate.
Backend must calculate final price from database.
```

On submit, frontend should send:

```txt
menuItemId
quantity
notes
tableId
customerName
```

Backend returns:

```txt
price snapshot
subtotal
tax
service charge
discount
total
order status
```

---

### 5.8 Form Handling

Recommended form tools:

```txt
React Hook Form
Zod
```

Frontend form should:

```txt
validate obvious errors
show field-level error
disable submit while submitting
prevent duplicate submit
reset on success if needed
show backend error safely
```

Example form areas:

```txt
login
register
create order
process payment
create menu item
update inventory
create employee
settings update
```

Backend validation must still exist.

---

### 5.9 Loading, Error, and Empty States

Every data page must handle:

```txt
loading
error
empty
success
```

Examples:

Kitchen loading:

```txt
Loading kitchen orders...
```

Kitchen empty:

```txt
No paid orders waiting for kitchen.
```

Kitchen error:

```txt
Failed to load kitchen orders. Please try again.
```

Do not show blank pages without explanation.

Blank UI is not minimalist. It is just unhelpful with confidence.

---

### 5.10 Status Display

Use consistent status badges.

Restaurant order statuses:

```txt
WAITING_CASHIER_APPROVAL
WAITING_PAYMENT
PAID
PREPARING
READY
SERVED
COMPLETED
CANCELLED
REJECTED
REFUNDED
```

Status badge should map:

```txt
status
label
description
visual variant
available actions
```

Do not write status label mapping separately in every page.

---

### 5.11 Action Buttons

Action buttons must be based on:

```txt
current status
user permission
active mode
business rule
backend-supported action
```

Example:

```txt
PAID order + KITCHEN permission:
Show "Start Preparing"

PREPARING order + KITCHEN permission:
Show "Mark Ready"

READY order + SERVER permission:
Show "Mark Served"
```

Frontend may hide unavailable buttons, but backend must still reject invalid actions.

---

### 5.12 Responsive Design

Frontend should support:

```txt
desktop
tablet
mobile
```

Important views:

```txt
Cashier: desktop/tablet optimized
Kitchen: tablet/large screen optimized
Serving: mobile/tablet friendly
Owner dashboard: desktop optimized
Customer ordering: mobile-first
```

Customer-facing pages must be mobile-friendly.

Staff dashboard should remain usable on tablet.

---

### 5.13 Accessibility

Frontend should follow basic accessibility rules:

```txt
buttons must be buttons
inputs must have labels
dialogs must be keyboard usable
focus states must be visible
color must not be the only status signal
forms must show readable error messages
```

Do not create clickable divs when a button exists. HTML already solved this. Astonishing, I know.

---

### 5.14 Frontend Security

Frontend must avoid:

```txt
dangerouslySetInnerHTML
storing auth token in localStorage
logging sensitive data
exposing private env variables
trusting NEXT_PUBLIC variables for secrets
rendering unsafe user-generated HTML
```

Never expose:

```txt
DATABASE_URL
JWT_SECRET
SESSION_SECRET
PAYMENT_SECRET_KEY
STORAGE_SECRET_KEY
```

Only use `NEXT_PUBLIC_*` for values safe to expose to the browser.

---

## 6. Anti-Patterns

Do not:

- Put business logic inside React components
- Calculate final order total in frontend as source of truth
- Trust frontend cart price
- Trust frontend user role
- Trust frontend permissions
- Trust localStorage for real mode access
- Hide a button and call it security
- Directly query database from frontend
- Duplicate API fetching logic everywhere
- Store all server data in global client store
- Render huge tables without pagination
- Use one giant dashboard component for everything
- Put all components in a single global components folder
- Create fake planned mode pages and mark them complete
- Break stable Restaurant pages for folder purity
- Show blank pages without loading/error/empty state
- Use random status labels in each page
- Use frontend-only validation
- Use optimistic updates for critical payment/stock/status changes
- Expose secrets with `NEXT_PUBLIC_*`
- Use `dangerouslySetInnerHTML` for user-generated content without sanitization

---

## 7. Checklist

Frontend is acceptable when:

- [ ] Routes are clear and feature-based.
- [ ] Layout adapts to role and active mode.
- [ ] Navigation is generated consistently.
- [ ] UI components are reusable and consistent.
- [ ] Feature-specific components live inside feature folders.
- [ ] Server state comes from backend APIs.
- [ ] Forms validate user input for UX.
- [ ] Backend errors are displayed clearly.
- [ ] Loading states exist.
- [ ] Error states exist.
- [ ] Empty states exist.
- [ ] Frontend does not act as final source of truth.
- [ ] Backend response is treated as final state.
- [ ] Role-based UI is implemented for UX only.
- [ ] Planned modes are clearly marked as planned.
- [ ] Customer-facing pages are mobile-friendly.
- [ ] No sensitive secret is exposed to the browser.
- [ ] Stable Restaurant / F&B pages remain working.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 09-security.md
- appendices/permission-keys.md
- appendices/status-transitions.md
- appendices/implementation-rules.md