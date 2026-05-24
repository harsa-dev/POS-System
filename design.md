# Enterprise Restaurant POS System — Design Document

# Project Overview

Enterprise-grade restaurant POS platform built for:

* operational speed
* realtime workflows
* financial integrity
* inventory safety
* responsive operational UX
* future scalability

The system supports:

* cashier operations
* kitchen operations
* serving workflows
* inventory management
* analytics
* employee management
* realtime communication

Future expansion:

* customer ordering application
* multi-restaurant support
* distributed realtime infrastructure
* PWA support
* offline-first capabilities

---

# Main Goals

## Primary Goals

* Reliable operational workflows
* Fast order handling
* Realtime synchronization
* Safe financial transactions
* Inventory integrity
* Responsive multi-device UX
* Maintainable architecture
* Scalable backend structure

## Secondary Goals

* Enterprise portfolio quality
* Clean architecture
* Strong developer experience
* Modular feature system
* Future extensibility

---

# Tech Stack

## Frontend

* React 19
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* TanStack Query
* Wouter
* Sonner
* Lucide React

## Backend

* Express 5
* Node.js
* PostgreSQL
* Prisma ORM
* SSE realtime
* JWT authentication
* bcryptjs

## Infrastructure

* pnpm workspaces
* esbuild
* Prisma Studio
* ESLint
* Prettier

---

# User Roles

## OWNER

* Full system access
* Analytics
* Employee management
* Settings
* Audit logs
* Financial oversight

## MANAGER

* Operational management
* Inventory management
* Staff monitoring
* Shift management

## CASHIER

* Checkout
* Order creation
* Payment handling
* Table assignment

## KITCHEN

* KDS access
* Order preparation
* Status updates

## SERVER

* Serving board
* Order delivery
* Table cleaning workflow

---

# Order Status Flow

```txt
PENDING_PAYMENT
→ PAID
→ PREPARING
→ READY
→ SERVED
```

Cancelled flow:

```txt
PENDING_PAYMENT
→ CANCELLED
```

---

# Feature-Based Architecture

## Frontend

```txt
features/
├── analytics/
├── attendance/
├── auth/
├── employees/
├── inventory/
├── orders/
├── payments/
├── pos/
├── serving/
├── shifts/
└── tables/
```

## Backend

```txt
routes/
├── analytics.ts
├── attendance.ts
├── auth.ts
├── employees.ts
├── inventory.ts
├── orders.ts
├── payments.ts
├── shifts.ts
├── tables.ts
└── events.ts
```

---

# Database Design

## Core Tables

* User
* Restaurant
* Order
* OrderItem
* MenuItem
* Category
* InventoryItem
* StockMovement
* Table
* Payment
* Shift
* Attendance
* AuditLog

## Important Constraints

### Unique Order Number

```txt
@@unique([restaurantId, orderNumber])
```

### Inventory Protection

* Row-level locking
* Transaction-safe stock deduction
* Negative stock prevention

---

# API Design

## REST Principles

* Resource-based endpoints
* JSON responses
* Consistent response shape
* Role-based access
* Secure cookie authentication

## Response Standard

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# Validation Rules

* Zod validation
* Backend-authoritative validation
* No client-trusted financial values
* Inventory validation before deduction
* Strong input sanitization

---

# Authorization Rules

* Role-based route protection
* Protected frontend routes
* Protected backend routes
* JWT session validation
* HttpOnly cookies

---

# Business Logic Rules

## Payments

* Payment totals come from DB
* Client totals are ignored
* Orders require valid payment flow

## Inventory

* Stock checked after row lock
* Stock deducted inside transaction
* Stock movement logged

## Orders

* Order creation atomic
* Shift cash update atomic
* Unique order number retry strategy

---

# UI Design Principles

## General Principles

* Operational-first UX
* Mobile-friendly workflows
* Responsive layouts
* Accessible controls
* Consistent spacing
* Consistent typography
* Consistent status colors
* Consistent interaction feedback

## Mobile UX

* Floating mobile cart
* Bottom-sheet modal pattern
* Safe-area support
* Sticky action footers
* Large touch targets

## Feedback System

* Sonner toast system
* Skeleton loading states
* Empty states
* Error states
* Confirm dialogs

---

# Component Rules

## Buttons

* Primary buttons use h-11
* Accessible focus states
* Consistent radius

## Cards

* rounded-3xl standard
* Consistent spacing
* Minimal visual noise

## Status Badges

* Centralized StatusBadge component
* Shared color system
* Human-readable labels

---

# Naming Convention

## Frontend

```txt
feature-name.tsx
use-feature.ts
feature-utils.ts
```

## Backend

```txt
feature.route.ts
feature.service.ts
feature.constants.ts
```

---

# Error Handling

## Backend

* Structured logging
* Generic client errors
* Detailed server logs
* Health endpoint

## Frontend

* Error states
* Toast feedback
* Graceful fallbacks
* Retry-safe UX

---

# State Management

## Current

* React state
* TanStack Query
* SSE realtime invalidation

## Future

* Broader TanStack Query adoption
* Query cache standardization
* Route-level data boundaries

---

# Realtime System Plan

## Current

* SSE endpoint
* EventSource frontend
* Realtime order updates
* Kitchen synchronization
* Serving synchronization

## Future

* Redis Pub/Sub
* Horizontal scaling
* Multi-instance broadcasting

---

# Security Rules

* HttpOnly cookies
* JWT authentication
* Role validation
* Audit logging
* Protected routes
* Backend-authoritative financial validation
* Inventory concurrency protection

---

# Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
NODE_ENV=
```

Optional:

```env
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
```

---

# Development Roadmap

## Completed

* SSE realtime
* Inventory row locking
* Mobile checkout UX
* UI consistency system
* Responsive improvements
* Toast/dialog unification
* Analytics fixes

## In Progress

* Frontend performance optimization
* Route-level code splitting
* Pagination
* Rendering optimization

## Planned

* Customer ordering app
* Multi-restaurant support
* PWA
* Offline support
* Redis scaling
* CI/CD pipeline

---

# Testing Plan

## Manual Testing

* Multi-role testing
* Multi-tab realtime testing
* Mobile testing
* Tablet testing
* Payment flow testing
* Inventory concurrency testing

## Future

* Unit testing
* Integration testing
* E2E testing
* Load testing

---

# Git Workflow

## Branching

```txt
main
feature/*
fix/*
refactor/*
```

## Commit Style

```txt
feat:
fix:
refactor:
chore:
perf:
```

---

# Deployment Checklist

Before deployment:

* Build passes
* Typecheck passes
* Prisma generate complete
* Environment variables configured
* Database schema synced
* Seed data removed from production
* Health endpoint verified

---

# Coding Rules

* No hardcoded role arrays
* No duplicated status styles
* Reusable UI patterns first
* Minimal abstraction
* Incremental changes only
* Avoid overengineering
* Keep business logic centralized

---

# Definition of Done

A feature is considered complete when:

* Logic works
* Mobile works
* Tablet works
* Desktop works
* Loading states exist
* Error states exist
* Toast feedback exists
* No TypeScript errors
* Build passes
* UX is operationally usable

---

# Long-Term Vision

The long-term goal is building a scalable restaurant operational ecosystem:

* POS system
* Customer ordering app
* Shared realtime infrastructure
* Shared database architecture
* Multi-branch support
* Enterprise operational analytics
* Cross-platform deployment

The project prioritizes:

* operational reliability
* maintainability
* scalability
* responsive usability
* real-world workflow efficiency

---

# Current Priorities

## High Priority

* Route-level code splitting
* Orders pagination
* Rendering optimization
* Menu image lazy loading
* Query architecture improvements

## Medium Priority

* Additional responsive polish
* Tablet UX improvements
* Performance tuning

## Low Priority

* Cosmetic redesigns
* Advanced animations
* Minor visual tweaks

---

# Final Notes

This project is intentionally built with enterprise-oriented architectural thinking.

The focus is not only creating features, but:

* maintaining long-term scalability
* protecting operational integrity
* building safe realtime workflows
* improving staff usability
* supporting future expansion

The system should feel:

* fast
* reliable
* operationally comfortable
* maintainable
* production-oriented
