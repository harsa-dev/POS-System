# Enterprise Restaurant POS System

Modern full-stack restaurant POS system designed for scalable restaurant operations, real-time kitchen workflow, inventory tracking, analytics, employee management, and future customer ordering integration.

Built with:

* React
* Vite
* Express
* PostgreSQL
* Prisma
* shadcn/ui
* TanStack Query
* Server-Sent Events (SSE)

Focused on:

* maintainable architecture
* enterprise-grade workflows
* responsive UI/UX
* realtime operational systems
* financial and inventory integrity
* mobile-first operational usability
* scalable frontend/backend structure

---

# Features

## POS & Checkout

* Real-time order creation
* Cash / QRIS / Card payment flow
* Floating mobile cart access
* Tablet-optimized checkout layout
* Sticky checkout footer for mobile keyboards
* Safe-area support for iOS devices
* Tax and service calculation
* Receipt-ready order flow

## Kitchen Display System (KDS)

* Real-time incoming orders via SSE
* Live order status synchronization
* Kitchen workflow tracking
* Animated order transitions
* Sound notifications
* Connection status indicator

## Serving Board

* Real-time serving updates
* Ready-to-serve order tracking
* Table cleaning workflow
* Order serving status management

## Inventory Management

* Stock tracking
* Ingredient usage tracking
* Recipe-based stock deduction
* Low-stock monitoring
* Inventory movement history
* Concurrency-safe stock deduction
* Row-level PostgreSQL locking

## Analytics

* Revenue analytics
* Payment method breakdown
* Best-selling items
* Inventory insights
* Low-stock analytics
* Order statistics
* Responsive analytics dashboard

## Employee System

* Employee management
* Attendance tracking
* Shift management
* Role-based permissions
* Password reset flow
* Activity tracking

## Operational Safety

* Atomic database transactions
* Unique order number enforcement
* Inventory integrity protection
* Financial integrity validation
* Audit logging
* Protected routes
* JWT authentication
* HttpOnly cookie sessions

---

# Tech Stack

## Frontend

* React 19
* Vite
* TypeScript 5.9
* Tailwind CSS
* shadcn/ui
* Framer Motion
* TanStack Query
* Wouter
* Sonner
* Lucide React

## Backend

* Express 5
* Node.js 24
* Prisma 7
* PostgreSQL
* SSE realtime architecture
* JWT authentication
* bcryptjs

## Tooling

* pnpm workspaces
* esbuild
* Prisma Studio
* ESLint
* Prettier

---

# Architecture

## Frontend Structure

```txt
artifacts/pos-system/src/
├── components/
├── features/
├── hooks/
├── lib/
├── pages/
├── providers/
└── types/
```

## Backend Structure

```txt
artifacts/api-server/src/
├── routes/
├── lib/
├── middleware/
├── constants/
├── types/
└── utils/
```

## Database

* PostgreSQL
* Prisma ORM
* Transaction-safe order flow
* Row-level locking for inventory integrity
* Unique constraints for order numbers

---

# Realtime System

The application uses Server-Sent Events (SSE) for operational realtime updates.

Realtime features:

* Kitchen order updates
* Serving board synchronization
* Live status changes
* Auto reconnect handling
* Connection indicators
* Polling fallback strategy

Architecture:

* `/api/events`
* EventSource frontend
* TanStack Query invalidation
* Centralized event constants

Future scaling:

* Redis Pub/Sub adapter
* Horizontal scaling support

---

# UI/UX Principles

* Responsive desktop/tablet/mobile layouts
* Operational-first interface design
* Mobile checkout optimization
* Touch-friendly controls
* Skeleton loading states
* Empty states
* Error states
* Toast feedback system
* Consistent status badges
* Consistent spacing and border radius
* Safe-area support
* Responsive viewport handling
* Smooth but subtle animations

---

# Security & Integrity

## Authentication

* JWT session tokens
* HttpOnly cookies
* Protected routes
* Role-based authorization

## Financial Integrity

* Server-authoritative payment totals
* Atomic order transactions
* Shift cash tracking
* Audit logging

## Inventory Integrity

* PostgreSQL row-level locking
* Concurrency-safe stock deduction
* Negative stock prevention
* Inventory movement traceability

---

# Performance Optimizations

Implemented:

* Mobile checkout optimization
* Responsive viewport fixes
* Safe-area support
* Skeleton loading states
* Unified toast system
* Route-level UX improvements

Planned:

* Route-level code splitting
* Lazy image loading
* Orders pagination
* Rendering optimization
* Bundle splitting
* Query architecture improvements

---

# Development Commands

## Frontend

```bash
pnpm --filter @workspace/pos-system run dev
```

## Backend

```bash
pnpm --filter @workspace/api-server run dev
```

## Build

```bash
pnpm build
```

## Typecheck

```bash
pnpm typecheck
```

## Prisma Generate

```bash
pnpm run generate
```

## Prisma Studio

```bash
pnpm prisma studio
```

## Database Push (Development Only)

```bash
pnpm --filter @workspace/db run push
```

## Seed Database

```bash
cd artifacts/api-server && pnpm exec tsx prisma/seed.ts
```

---

# Demo Accounts

Password:

```txt
password123
```

Accounts:

* [owner@test.com](mailto:owner@test.com)
* [manager@test.com](mailto:manager@test.com)
* [cashier@test.com](mailto:cashier@test.com)

---

# Current Status

Current completed systems:

* Realtime SSE infrastructure
* Transaction-safe order flow
* Mobile checkout optimization
* UI consistency system
* Responsive operational UX
* Inventory locking protection
* Analytics improvements
* Health endpoint
* Unified toast/dialog system

---

# Long-Term Vision

Future roadmap:

* Customer ordering application
* Shared database architecture
* Multi-restaurant support
* Redis realtime scaling
* PWA/offline mode
* Push notifications
* Advanced analytics
* Queue management
* AI operational insights
* Enterprise deployment pipeline

---

# Notes

This project is designed as a long-term enterprise-grade restaurant operational platform, not just a CRUD portfolio application.

The focus is:

* operational reliability
* maintainability
* scalability
* responsive usability
* real-world workflow efficiency
