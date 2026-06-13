# Custom Business Service Data Plan

Planning note only. No schema file is changed in this phase.

## Scope

Future service mode needs persistent data for:

- service request
- service job
- job cost line
- quotation
- invoice tracking
- checklist item
- timeline item

The current frontend uses hard-coded data so the workspace has a realistic shape before database work starts.

## Status flow draft

```txt
REQUEST_INTAKE
JOB_PLANNING
QUOTATION_DRAFT
QUOTATION_APPROVED
IN_PROGRESS
READY_FOR_REVIEW
DELIVERED
INVOICED
PAID
CLOSED
```

Extra states later:

```txt
CANCELLED
REJECTED
```

## Table candidates later

### service_requests

Main parent record for a service workflow.

Fields to consider:

- id
- business_id
- request_code
- customer_name
- customer_segment
- category
- title
- summary
- status
- priority
- due_date
- assigned_to
- created_at
- updated_at

### service_jobs

Execution record under a service request.

Fields to consider:

- id
- request_id
- title
- assigned_to
- status
- started_at
- completed_at
- created_at
- updated_at

### service_cost_lines

Costing detail for labor, material, operational cost, or vendor cost.

Fields to consider:

- id
- job_id
- label
- category
- quantity
- unit_label
- unit_cost
- billable
- created_at
- updated_at

### service_quotations

Customer quotation generated from cost lines and pricing rules.

Fields to consider:

- id
- request_id
- quotation_code
- status
- subtotal
- discount_amount
- tax_rate
- tax_amount
- margin_rate
- total
- valid_until
- approved_at
- created_at
- updated_at

### service_invoices

Invoice and collection tracking.

Fields to consider:

- id
- request_id
- quotation_id
- invoice_code
- status
- total
- paid_amount
- due_date
- issued_at
- paid_at
- created_at
- updated_at

### service_checklist_items

Checklist for job execution.

Fields to consider:

- id
- job_id
- label
- is_done
- completed_at
- created_at
- updated_at

### service_timeline_items

Timeline for service workflow progress.

Fields to consider:

- id
- request_id
- label
- actor_name
- occurred_at
- created_at

## Later implementation order

1. Decide final general naming.
2. Add status and category enums.
3. Add request and timeline tables.
4. Add job, checklist, and cost line tables.
5. Add quotation and invoice tables.
6. Seed the current mock examples.
7. Add API routes.
8. Replace mock frontend data with API client calls.
9. Only then unlock service mode selection.

## Do not do yet

- Do not change the active Prisma schema in this phase.
- Do not touch restaurant workspace files.
- Do not make service mode selectable.
- Do not wire service jobs to shared finance until the relation strategy is decided.
