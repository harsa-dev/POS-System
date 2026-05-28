# POS System V2 - Design Architecture

## Vision

Modern restaurant POS system focused on:

* Scalability
* Reliability
* Real-world workflow
* Enterprise-inspired architecture
* Production-ready deployment

The goal is not just making a cashier app.
The goal is simulating how real operational systems behave under multiple users and concurrent transactions.

---

# Core Architecture

```txt
Frontend (Vercel)
        ↓
API Server (Railway)
        ↓
PostgreSQL Database (Neon)
```

---

# Frontend Architecture

## Principles

* Modular feature-based structure
* Reusable UI components
* Centralized API layer
* Production-oriented routing
* State separation

---

## Frontend Structure

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

## UI Philosophy

* Fast operational workflow
* Minimal clicks
* Information density
* Responsive layouts
* Dashboard-first navigation

Restaurant staff do not care about artistic minimalism while handling 30 orders simultaneously. Functional clarity wins.

---

# Backend Architecture

## Principles

* Thin route handlers
* Centralized auth logic
* Database transaction safety
* Structured logging
* Stateless API server

---

## Backend Structure

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

# Authentication Design

## Strategy

* Cookie-based session auth
* HTTP-only cookies
* JWT session token
* Cross-origin production support

---

## Security Decisions

```txt
httpOnly = true
secure = true (production)
sameSite = none
```

Purpose:

* prevent XSS cookie access
* allow Railway ↔ Vercel communication
* maintain persistent login sessions

---

# Database Design

## ORM

Prisma ORM

## Database

PostgreSQL (Neon)

---

## Core Entities

```txt
User
Restaurant
Order
OrderItem
MenuItem
InventoryItem
Table
Attendance
Payment
```

---

# Concurrency & Data Integrity

## Inventory Locking

Uses:

```sql
FOR UPDATE
```

inside transactions to prevent race conditions during concurrent order creation.

Purpose:

* prevent overselling
* maintain stock consistency
* support multi-user operations

---

# Real-Time Direction

Current implementation uses polling/SSE-style foundations.

Planned:

* WebSocket architecture
* event-driven updates
* live kitchen synchronization

---

# Deployment Architecture

## Frontend

* Hosted on Vercel
* Static asset optimization
* CDN distribution

## Backend

* Hosted on Railway
* Environment-based configuration
* Production port binding

## Database

* Neon PostgreSQL
* Cloud-hosted
* SSL secured

---

# Centralized API Layer

## Problem

Originally, frontend API requests were scattered across the application using direct `fetch()` calls.

This caused:

* duplicated request logic
* inconsistent error handling
* repeated authentication configuration
* deployment debugging difficulty
* inconsistent API response parsing

As the system grew, maintaining operational consistency became increasingly painful. Because apparently debugging one broken fetch call wasn't emotionally sufficient.

---

# API Layer Architecture

Frontend requests are now gradually migrating toward a centralized domain-based API layer.

Structure:

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

# API Client Responsibilities

`api-client.ts` acts as the single transport layer for frontend ↔ backend communication.

Responsibilities:

* base URL resolution
* cross-origin credential handling
* normalized JSON parsing
* API error normalization
* request/response logging
* media URL resolution
* network failure handling

---

# Domain API Modules

Each domain exposes typed helper methods.

Example:

```ts
authApi.login()
menuApi.createMenuItem()
orderApi.createOrder()
inventoryApi.getItems()
```

Purpose:

* reduce duplicated logic
* improve maintainability
* isolate business domains
* simplify future scaling

---

# Error Normalization

The API layer introduces normalized frontend API errors through:

```ts
ApiError
```

Handled cases include:

* network failures
* invalid JSON responses
* backend validation errors
* non-2xx HTTP responses
* malformed API payloads

This allows frontend UI components to remain simpler and more operationally consistent.

---

# Media URL Resolution

Because frontend and backend are deployed on separate domains:

```txt
Frontend → Vercel
Backend → Railway
```

relative media paths alone were insufficient.

Example problematic response:

```txt
/api/media/example.png
```

The frontend now resolves relative backend media paths into fully-qualified backend URLs during rendering.

Purpose:

* support distributed deployment environments
* maintain compatibility with existing database records
* preserve local blob previews
* avoid backend URL hardcoding

---

# Migration Strategy

The API migration is intentionally incremental.

Legacy compatibility remains supported through:

```ts
apiFetch()
```

This allows gradual migration without rewriting operational workflows all at once.

Migration priority:

1. Auth
2. Read-only analytics
3. Tables & settings
4. Inventory & employees
5. Orders & POS flows
6. Upload-sensitive menu operations

Reason:

Operationally critical systems should migrate only after the API layer proves stable in lower-risk domains.

---

# Engineering Direction

The architecture is gradually evolving toward:

* domain-oriented frontend services
* centralized operational logic
* scalable multi-user workflows
* production-grade maintainability

The objective is not framework perfection.

The objective is surviving real operational complexity without the entire system emotionally collapsing after one deployment.


---

# Production Problems Solved

## Infrastructure

* pnpm monorepo deployment
* Prisma production generation
* Railway container lifecycle
* Node.js version compatibility

## Networking

* CORS
* Cross-site cookies
* Environment variable separation
* API base URL management

## Database

* Prisma schema synchronization
* Seed automation
* UUID/text mismatch debugging
* Connection pooling

---

# Centralized API Layer

## Reason

Originally, API calls were scattered across the frontend.

This created:

* maintenance difficulty
* deployment issues
* duplicated logic

Solution:

```txt
src/lib/api.ts
```

Centralized fetch wrapper.

---

# Scalability Goals

## Near-Term

* Stable production operations
* Multi-user testing
* Improved dashboard performance
* Better state management

## Mid-Term

* Multi-restaurant support
* Background job system
* WebSocket infrastructure
* Advanced analytics

## Long-Term

* SaaS architecture
* Subscription billing
* Native mobile app
* Distributed service architecture

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
* real operational workflow

Because software engineering is mostly:

```txt
Fixing systems that worked perfectly five minutes ago.
```
