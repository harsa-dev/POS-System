# Real-world Job Role Library

## Why this exists

System roles are not the same as job titles.

System roles:

- OWNER
- MANAGER
- ADMIN
- OPERATOR
- STAFF
- VIEWER

Job titles:

- Restaurant General Manager
- Retail Cashier
- Weighing Operator
- Field Service Technician
- Billing Admin

A job title should map into:

1. base system role
2. permission preset
3. business sector
4. department
5. responsibility text

## Reference Basis

This dummy library is inspired by public occupation classification systems and common industry role structures:

- SOC / OOH-style occupational families
- ISCO-style occupation classification
- ESCO / NOC-style occupation catalogs
- Restaurant kitchen brigade structure for F&B kitchen hierarchy

## Sectors covered

### Restaurant

Includes:

- Restaurant General Manager
- Shift Supervisor
- Cashier / POS Operator
- Server / Waiter
- Host / Reservation Staff
- Head Chef / Kitchen Manager
- Line Cook / Cook
- Dishwasher / Kitchen Porter

### Retail

Includes:

- Retail Store Manager
- Retail Shift Lead
- Retail Cashier
- Sales Associate
- Stock Clerk
- Inventory Controller
- Buyer / Purchasing Staff

### Raw Material / Production

Includes:

- Raw Material Operations Manager
- Intake / Receiving Operator
- Weighing Operator
- Quality Control Inspector
- Warehouse Staff
- Production / Processing Operator
- Maintenance Technician

### Service Business

Includes:

- Service Operations Manager
- Receptionist / Front Desk
- Customer Service Representative
- Dispatcher / Scheduler
- Field Service Technician
- Cleaning / Housekeeping Staff
- General Maintenance Worker
- Consultant / Specialist
- Account Manager
- Billing / Invoice Admin

## Implementation rule

Never hard-code business-specific titles into the auth enum.

Use:

```txt
User.baseRole = OWNER | MANAGER | ADMIN | OPERATOR | STAFF | VIEWER
RoleTemplate.name = real job title or custom title
RolePermission.key = permission key
UserRoleAssignment = business scoped assignment
```

Yes, this means "Cashier" should not be an enum. Stunning progress. Humanity survives another refactor.
