# SystemDemo

A clean, light-themed sample build of our full-stack workshop management platform — used for demoing the system to prospective clients. Forked from a real production system; all original client identity has been stripped and replaced with neutral demo data.

## What's in the box

Same functionality as the production app:

- **Documents** — Quotation / Invoice / Receipt / Delivery Order with conversions, payments, auto-numbering
- **Stock** — Categories, brands, DOT batch tracking for tyres, hold/release, audit history
- **Customers & Vehicles** — Multi-vehicle per customer, plate search, take-order auto-fill
- **Take Order** — Single-page order entry that auto-creates customer/vehicle and a draft invoice
- **Debtors / Payment Log** — A/R tracking with grouped customer balances
- **Suppliers / Purchase Orders / A/P Payments** — Full purchasing loop with attachments
- **Workshop Job Board** — Fullscreen TV display with WAITING / IN_PROGRESS / READY columns
- **Worker Stats** — Per-foreman performance over a date range
- **Held Stock Dashboard** — Find which draft invoice is holding a stock item
- **Demo Assistant (AI)** — Floating chat powered by Claude with read-only data tools
- **Audit Logs** — Branch-scoped trail of every mutation, login, and assistant tool call
- **Public Website** — Home / About / Services / Contact (now in light theme)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite + Tailwind CSS v4 + Pinia |
| Backend | Fastify + TypeScript (ESM) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Cache / Rate Limit | Redis 7 |
| Auth | JWT + bcryptjs |
| AI Assistant | Claude Opus 4.6 (Anthropic SDK, tool use) |
| Theme | Light + casual (warm cream background, indigo accent) |

## Getting Started

### Services (Docker)
```bash
docker run -d --name systemdemo-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=systemdemo -p 5432:5432 postgres:16-alpine

docker run -d --name systemdemo-redis -p 6379:6379 redis:7-alpine
```

### Backend
```bash
cd backend
cp .env.example .env          # edit DB, Redis, JWT, optional Anthropic key
npm install
npx prisma db push            # create tables
npm run db:seed               # base seed (branch + admin)
npx tsx prisma/seed-demo.ts   # rich demo data
npm run dev                   # http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

### Default Login
- **Email:** `admin@demo.local`
- **Password:** `admin123`

## Demo theming

The dark "Black + Gold" production theme is replaced by a light "warm cream + indigo" palette. To keep the change low-risk, the original CSS variable names (`--color-dark-*`, `--color-gold-*`) are kept — only their values changed in `frontend/src/assets/css/main.css`. Every existing Tailwind utility (`bg-dark-950`, `text-gold-500`, etc.) keeps working.

The build also surfaces a fixed **DEMO** ribbon (top-right) on every page so it's always obvious the system is a demo.

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/systemdemo"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your-jwt-secret"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
ADMIN_EMAIL="admin@demo.local"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Demo Admin"
ANTHROPIC_API_KEY="sk-ant-..."   # optional — enables Demo Assistant
```

## Notes for the demo operator

- The seed creates a branch named **SYSTEMDEMO SAMPLE BRANCH** with placeholder address, phone, SSM, and bank details. Edit them in Profile → Branch Settings during the demo if you want them to look more real.
- All staff emails use the `@demo.local` domain.
- Sample suppliers, customers, vehicles, and price points are realistic Malaysian data — safe to show clients.
- Source originally derived from a deployed workshop ERP; identity-bearing strings (company name, address, SSM, bank account, owner contact) have been replaced with generic demo equivalents.
