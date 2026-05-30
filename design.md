# POS System V2 - Design Architecture

## Vision

POS System V2 is evolving from a restaurant cashier system into a modular business operations platform.

The architecture is designed around:

* scalability
* operational realism
* workflow specialization
* modular business modes
* production-oriented infrastructure
* multi-user operational consistency

The objective is not simply processing transactions.

The objective is simulating how real operational systems behave across different business models under production conditions.

---

# Architectural Direction

The platform follows:

```
Shared Operational Core
+
Business-Specific Workflow Layers
```

This allows multiple business types to reuse the same foundational systems while exposing specialized workflows depending on operational needs.

---

# High-Level Architecture

```txt
Frontend (Vercel)
        ↓
API Server (Railway)
        ↓
PostgreSQL Database (Neon)
```

---

# Shared Core Architecture

Core modules are shared across all business modes.

```txt
Core Modules
├── auth
├── inventory
├── orders
├── analytics
├── finance
├── permissions
├── reporting
├── worksheets
└── notifications
```

These modules provide the operational backbone of the platform.

---

# Business Mode Architecture

Business-specific behavior is layered on top of the shared core.

```txt
Business Modes
├── restaurant
├── retail
├── raw-material
└── service
```

Each mode exposes:

* specialized dashboard layouts
* operational terminology
* workflow-specific UI
* business-specific calculations
* operational restrictions
* reporting variations

---

# Restaurant Mode

Focused on:

* kitchen workflow
* serving workflow
* dine-in operations
* table management
* recipe-based inventory
* operational queue handling

Operational priorities:

* speed
* order visibility
* synchronization
* transaction flow consistency

---

# Retail Mode

Focused on:

* barcode-oriented workflow
* fast cashier operations
* high-volume transactions
* bulk inventory
* supplier-oriented stock management

Operational priorities:

* checkout speed
* inventory turnover
* transaction throughput

---

# Raw Material / Livestock Mode

Focused on:

* weight-based inventory
* raw material processing
* stock transformation workflow
* operational batch processing
* dynamic pricing logic

Operational priorities:

* inventory precision
* stock conversion tracking
* operational cost allocation

---

# Service Mode (Planned)

Focused on:

* service pricing
* operational costing
* invoice workflow
* service reporting
* operational expense allocation

Operational priorities:

* billing
* scheduling
* profitability tracking

---

# Frontend Architecture

## Principles

* feature-oriented structure
* reusable operational components
* centralized API communication
* scalable routing structure
* domain separation
* operational dashboard-first design

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

# UI Philosophy

The UI prioritizes:

* operational clarity
* speed
* information density
* low-friction workflows
* responsive operational layouts

The interface is intentionally designed around operational efficiency rather than decorative minimalism.

Because staff handling active transactions generally do not emotionally care whether a button has glassmorphism.

---

# Worksheet Architecture

Worksheets act as operational partitions.

Purpose:

* branch separation
* warehouse segmentation
* business-unit isolation
* reporting separation
* operational grouping

---

## Worksheet Flow

```txt
Workspace
    ↓
Worksheet
    ↓
Operational Data
```

Examples:

* restaurant branches
* warehouse divisions
* business experiments
* temporary operational campaigns

---

# POS Layout Engine

The cashier interface supports configurable operational layouts.

Capabilities:

* product grouping
* custom sections
* operational ordering
* category segmentation
* workflow optimization

Purpose:

* reduce cashier friction
* improve operational speed
* support different business workflows

---

# Product System Architecture

Products support multiple operational types.

```txt
Product Types
├── raw-material
├── semi-finished
├── finished-product
├── service
├── bundle
└── formula-based
```

---

# Inventory Architecture

The inventory system supports:

* quantity tracking
* weighted inventory
* stock transformation
* recipe deduction
* formula products
* bundle products
* warehouse separation

---

# Inventory Integrity

Concurrent inventory operations use transaction-safe workflows.

Uses:

```sql
FOR UPDATE
```

inside database transactions.

Purpose:

* prevent overselling
* maintain stock consistency
* support multi-user concurrency

---

# Financial System Architecture

The financial subsystem supports:

* operational cashflow
* financial summaries
* profit & loss reports
* invoice workflows
* operational expense tracking
* HPP calculations

---

# HPP Calculator Engine

The HPP engine supports multiple operational calculation modes.

```txt
Calculation Modes
├── retail/F&B
├── marketplace
├── COD/advertising
├── manufacturing
├── production transformation
├── service business
└── market-price analysis
```

---

# Analytics System

The analytics subsystem focuses on operational decision-making.

Capabilities:

* sales tracking
* profitability analysis
* busy-hour analysis
* marketing insights
* inventory analysis
* operational trends

---

# Team & Permission System

Supports:

* role-based access
* operational restrictions
* permission presets
* sensitive financial masking
* feature-level restrictions

---

# Authentication Architecture

## Strategy

* cookie-based authentication
* JWT sessions
* HTTP-only cookies
* cross-origin production compatibility

---

# Security Decisions

```txt
httpOnly = true
secure = true (production)
sameSite = none
```

Purpose:

* prevent XSS cookie access
* allow Railway ↔ Vercel communication
* maintain persistent sessions

---

# Backend Architecture

## Principles

* thin route handlers
* centralized auth logic
* service-oriented operational logic
* transaction safety
* scalable domain separation

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

The frontend is gradually migrating toward a centralized domain-based API architecture.

```txt
src/lib/api/
├── api-client.ts
├── auth-api.ts
├── menu-api.ts
├── order-api.ts
├── inventory-api.ts
└── index.ts
```

---

# API Layer Responsibilities

The centralized API layer handles:

* base URL resolution
* request normalization
* error normalization
* authentication consistency
* media URL resolution
* deployment-safe communication

---

# API Migration Strategy

Migration is intentionally incremental.

Legacy compatibility remains temporarily supported through:

```ts
apiFetch()
```

Purpose:

* avoid operational instability
* reduce deployment risk
* maintain workflow continuity

---

# Deployment Architecture

## Frontend

* Hosted on Vercel
* CDN delivery
* static asset optimization

---

## Backend

* Hosted on Railway
* stateless API server
* environment-based configuration

---

## Database

* Neon PostgreSQL
* SSL-secured
* cloud-hosted

---

# Real-Time Direction

Current operational updates use polling/SSE-style foundations.

Planned future direction:

* WebSocket infrastructure
* event-driven updates
* live kitchen synchronization
* live cashier synchronization
* operational notifications

---

# Scalability Goals

## Near-Term

* operational stability
* API migration completion
* improved dashboard performance
* multi-user testing

---

## Mid-Term

* multi-branch operations
* WebSocket infrastructure
* advanced analytics
* background job processing

---

## Long-Term

* SaaS architecture
* multi-tenant infrastructure
* mobile applications
* distributed operational services

---

# Engineering Philosophy

This project prioritizes:

```txt
Operational realism over tutorial perfection.
```

The architecture intentionally focuses on:

* deployment
* operational complexity
* concurrency
* debugging
* scalability
* infrastructure behavior
* real business workflows

The objective is learning how systems behave after leaving localhost.

Because production environments enjoy inventing new emotional damage every deployment cycle.
