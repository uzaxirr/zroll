# Zroll - CLAUDE.md

## Project Overview
Zroll is a privacy-first crypto payroll platform built on Zcash. It combines shielded payroll, portfolio tracking, tax reporting, and accounting in one product.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy (async) + PostgreSQL + Celery + Redis
- **Zcash Service**: Rust microservice (Actix-web) wrapping zingolib
- **Auth**: Clerk
- **Database**: PostgreSQL (local dev, Neon for prod)

## Monorepo Structure
```
zroll/
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── models/    # SQLAlchemy models
│   │   ├── services/  # Business logic
│   │   ├── core/      # Config, DB, auth, encryption
│   │   ├── workers/   # Celery tasks
│   │   └── main.py    # App entry point
│   ├── alembic/       # DB migrations
│   └── pyproject.toml
├── frontend/          # Next.js 14 frontend
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   ├── lib/       # Utilities, API client
│   │   └── styles/    # Global styles
│   └── package.json
├── zcash-service/     # Rust Zcash microservice
│   ├── src/
│   │   └── main.rs
│   └── Cargo.toml
├── .env               # Environment variables (DO NOT COMMIT)
└── CLAUDE.md          # This file
```

## Design System
All screens were designed in Paper and must match exactly.

### Colors
- Background: `#FAFAF8` (warm off-white)
- Text primary: `#111827` (near-black)
- Text secondary: `#6B7280`
- Text muted: `#9CA3AF`
- Accent green: `#059669` (emerald)
- Accent gold: `#F59E0B` (Zcash/ZEC)
- Error red: `#DC2626`
- Warning amber: `#D97706`
- Card background: `#FFFFFF`
- Card border: `#E5E7EB`
- Sidebar dark: `#1F2937`
- Table header bg: `#F9FAFB`
- Row border: `#F3F4F6`
- Active nav bg: `rgba(5, 150, 105, 0.1)`
- Badge green bg: `#ECFDF5`
- Badge amber bg: `#FEF3C7`
- Badge indigo bg: `#EEF2FF`

### Typography
- Headlines: Space Grotesk, Bold (700), tracking -0.02em
- Body: Inter, Regular/Medium (400/500)
- Monospace values: tabular-nums variant

### Spacing
- Page padding: 40px top, 48px sides
- Section gap: 32px
- Group gap: 16-24px
- Card padding: 24-28px
- Card border-radius: 12px
- Button border-radius: 8px
- Badge border-radius: 100px (pill)

### Sidebar
- Width: 220px (admin) / 220px (contributor)
- Background: #1F2937
- Logo: Green circle with "Z" + "zroll" text
- Active item: rgba(5,150,105,0.1) bg + #059669 text
- Inactive item: #9CA3AF text

### Admin Sidebar Items
Dashboard, Contributors, Run Payroll, History, Portfolio, Tax, Invoices, Accounting

### Contributor Sidebar Items
My Payments, Tax Summary, Viewing Keys, Portfolio, Invoices

## Key Architecture Decisions
- Zcash memo field (512 bytes) stores compressed JSON pay stubs
- FIFO cost basis engine for tax calculations
- Viewing keys enable selective disclosure for auditors
- All wallet spending keys encrypted with AES-256-GCM at rest
- Clerk handles auth; backend verifies JWTs
- Celery workers handle payroll execution, price syncing, confirmations

## API Base URL
- Backend: http://localhost:8001
- Frontend: http://localhost:3000
- Zcash Service: http://localhost:8080

## Infrastructure
- Docker Postgres runs on **port 5434** (mapped to container 5432) to avoid conflict with local Postgres
- Redis runs on port 6379
- `npm run dev:infra` starts both containers
- `npm run db:migrate` runs Alembic migrations
- `npm run db:seed` populates sample data (Acme Corp, 5 contributors, 3 months payroll)
- Backend venv: `backend/.venv/` (created with `uv venv`)

## Environment
All secrets are in `.env` at repo root. Never commit this file.

## Architecture Doc
Full architecture with screen→API→data mappings: see `/Users/uzaxirr/work/agno-docs/zroll-architecture.md`
