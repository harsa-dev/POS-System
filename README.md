# POS System V2

Modern modular business operations platform built for real-world workflow simulation, scalability, and production-oriented architecture.

This project started as a restaurant POS system.

Then the scope escaped containment.

Now it is evolving toward a modular operational platform capable of supporting multiple business types through a shared operational core.

Because apparently building a simple cashier app was too emotionally stable.

---

# Vision

Build a scalable operational platform capable of handling:

* restaurant operations
* retail workflows
* raw-material businesses
* inventory-heavy businesses
* service-based workflows
* financial reporting
* multi-user operations
* real-world deployment complexity

The goal is not tutorial perfection.

The goal is understanding how operational systems behave under pressure, concurrency, deployment environments, and multiple business workflows.

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* Wouter
* TanStack Query
* Sonner

---

## Backend

* Node.js
* Express
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Cookie-based session auth

---

## Infrastructure

* Vercel (Frontend)
* Railway (Backend)
* Neon PostgreSQL
* pnpm Workspace Monorepo

---

# Core Features

## Authentication & Access Control

* Login
* Register
* Logout
* HTTP-only cookie authentication
* JWT session management
* Role-based access
* Team permission system
* Feature restriction system

---

## POS Operations

* Create order
* Order queue
* Kitchen workflow
* Serving workflow
* Payment processing
* Table management
* Shift workflow
* Open order tracking
* Cashier synchronization

---

## Inventory System

* Inventory tracking
* Stock deduction
* Transaction-safe updates
* Inventory movement history
* Recipe-based inventory
* Formula & bundle products
* Product grouping
* Weight-based inventory support
* Multi-type product workflow

---

## Analytics & Reporting

* Sales overview
* Revenue tracking
* Order statistics
* Dashboard summaries
* Marketing insights
* Busy-hour analytics
* Profit analysis
* Financial summaries
* Operational reporting

---

## Financial System

* Cashflow management
* Financial reporting
* Profit & loss reports
* Invoice generation
* Cash transaction tracking
* Operational expense tracking
* HPP (Cost of Goods Sold) calculator
* Margin analysis

---

## Team & Operational Management

* Team management
* Permission presets
* Operational access restrictions
* Shift reports
* Worksheet management
* Branch separation
* Warehouse segmentation

---

## Enterprise-Oriented Features

* Audit-style logging
* Database transactions
* Inventory row locking
* Production deployment setup
* Multi-user support
* Centralized API layer
* Modular operational architecture

---

# Business Modes

The platform is designed around a shared operational core with specialized business workflows.

---

## Restaurant / Cafe Mode

Focused on:

* kitchen workflow
* serving workflow
* table operations
* recipe inventory
* dine-in operations
* order queue management

---

## Retail / Supermarket Mode

Focused on:

* barcode workflow
* fast checkout
* bulk inventory
* supplier-oriented stock flow
* high-volume transactions

---

## Raw Material / Livestock Mode

Focused on:

* weight-based inventory
* raw-material stock tracking
* production transformation workflow
* dynamic pricing workflow
* operational batch processing

---

## Service Business Mode (Planned)

Focused on:

* service costing
* operational expense calculation
* invoice workflows
* service-based operational reporting

---

# Advanced Operational Features

## Worksheet Architecture

Worksheets act as operational partitions for:

* branches
* warehouses
* business units
* reporting isolation
* operational segmentation

This allows the system to simulate multi-branch and multi-workspace operational behavior.

---

## Loyalty & Customer System

* customer tiers
* loyalty programs
* automatic discount systems
* transaction-based progression
* customer purchase tracking

---

## HPP Calculator Engine

Supports:

* retail/F&B calculations
* marketplace workflows
* manufacturing workflows
* service pricing
* advertising/COD calculations
* operational cost allocation
* production estimation

---

## POS Layout Engine

* configurable product grouping
* category segmentation
* operational product layouts
* dynamic cashier workflow arrangement

---

## Printer & Receipt System

* printer configuration
* receipt customization
* thermal printer workflow
* operational print formatting

---

# Monorepo Structure

```txt
.
├── artifacts/
│   ├── api-server/
│   ├── pos-system/
│   └── mockup-sandbox/
├── packages/
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

# Frontend Structure

```txt
src/
├── components/
├── features/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── providers/
├── routes/
└── types/
```

---

# Backend Structure

```txt
src/
├── lib/
├── routes/
├── middleware/
├── services/
├── utils/
└── prisma/
```

---

# Centralized API Layer

The frontend architecture is gradually migrating toward a centralized domain-based API layer.

```txt
src/lib/api/
├── api-client.ts
├── auth-api.ts
├── menu-api.ts
├── order-api.ts
├── inventory-api.ts
└── index.ts
```

Purpose:

* centralized request handling
* normalized API errors
* scalable frontend architecture
* deployment consistency
* operational maintainability

---

# Environment Variables

## Backend (.env)

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
PORT=
```

---

## Frontend (.env)

```env
VITE_API_URL=
```

---

# Local Development

## Install dependencies

```bash
pnpm install
```

---

## Run frontend

```bash
pnpm --filter @workspace/pos-system dev
```

---

## Run backend

```bash
pnpm --filter @workspace/api-server dev
```

---

# Database Setup

## Push Prisma schema

```bash
pnpm --dir artifacts/api-server exec prisma db push
```

---

## Seed database

```bash
pnpm --dir artifacts/api-server exec tsx prisma/seed.ts
```

---

# Production Deployment

## Frontend

Deploy using:

* Vercel

---

## Backend

Deploy using:

* Railway

---

## Database

Use:

* Neon PostgreSQL

---

# Demo Accounts

```txt
Owner:
owner@test.com
password123

Manager:
manager@test.com
password123

Cashier:
cashier@test.com
password123
```

---

# Known Challenges During Production Deployment

## Infrastructure

* pnpm workspace compatibility
* Prisma Node.js version compatibility
* Railway container port binding
* Prisma production generation

---

## Networking

* Cross-origin cookie authentication
* CORS configuration
* Vercel deployment protection
* API base URL management

---

## Database

* PostgreSQL UUID/Text mismatch
* Prisma production schema sync
* transaction handling
* connection pooling

---

## Frontend Complexity

* API migration refactors
* state synchronization
* multi-user operational consistency
* dashboard scaling
* inventory concurrency

In other words:

```txt
Everything that can psychologically damage a developer.
```

---

# Future Improvements

## Infrastructure

* WebSocket real-time updates
* SSE optimization
* Background job system
* Monitoring & observability

---

## Platform Direction

* Offline POS mode
* Multi-tenant architecture
* SaaS billing system
* Native mobile application
* Distributed services architecture

---

## Operational Systems

* Advanced analytics
* Tax engine
* Payment gateway integration
* Smart inventory forecasting
* Kitchen display optimization
* AI-assisted operational insights

---

# Engineering Philosophy

This project prioritizes:

```txt
Operational realism over tutorial perfection.
```

The objective is understanding:

* deployment
* debugging
* production infrastructure
* authentication
* transactions
* operational finance
* concurrency
* business workflows
* real operational complexity

Because software engineering is mostly:

```txt
Fixing systems that worked perfectly five minutes ago.
```

---

# License

Personal portfolio & educational project.
