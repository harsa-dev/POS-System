# POS System V2

Production-ready modern POS (Point of Sale) system with:

* Multi-role authentication
* Real-time order workflow
* Inventory management
* Kitchen & serving dashboard
* Analytics
* Restaurant management
* Fullstack monorepo architecture

Built for portfolio, scalability, and real-world business simulation. Because apparently building a simple cashier app wasn't enough suffering.

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

## Backend

* Node.js
* Express
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Cookie-based session auth

## Infrastructure

* Vercel (Frontend)
* Railway (Backend)
* Neon PostgreSQL
* pnpm Workspace Monorepo

---

# Features

## Authentication

* Login
* Register
* Logout
* Session cookie authentication
* Role-based access

## POS Features

* Create order
* Order queue
* Kitchen workflow
* Serving workflow
* Payment processing
* Table management

## Inventory

* Inventory tracking
* Stock deduction
* Transaction-safe updates
* Inventory movement history

## Analytics

* Sales overview
* Revenue tracking
* Order statistics
* Dashboard summary

## Enterprise-Oriented Features

* Audit-style logging
* Database transactions
* Inventory row locking
* Production deployment setup
* Multi-user support

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

# Environment Variables

## Backend (.env)

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=
PORT=
```

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

## Run frontend

```bash
pnpm --filter @workspace/pos-system dev
```

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

## Seed database

```bash
pnpm --dir artifacts/api-server exec tsx prisma/seed.ts
```

---

# Production Deployment

## Frontend

Deploy using:

* Vercel

## Backend

Deploy using:

* Railway

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

* pnpm workspace compatibility
* Prisma Node.js version compatibility
* Railway container port binding
* Cross-origin cookie authentication
* Vercel deployment protection
* Prisma production schema sync
* PostgreSQL UUID/Text mismatch
* CORS configuration

In other words:

```txt
Everything that can psychologically damage a developer.
```

---

# Future Improvements

* WebSocket real-time updates
* Offline POS mode
* Multi-tenant restaurant support
* Advanced analytics
* Mobile application
* Receipt printing
* Tax engine
* Payment gateway integration
* Kitchen display optimization
* Monitoring & observability

---

# License

Personal portfolio & educational project.
