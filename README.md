# Zroll

Privacy-first crypto payroll platform built on Zcash.

## Prerequisites

- Python 3.11+
- Node.js 20+
- Rust (latest stable)
- Docker and Docker Compose

## Quick Start

### 1. Start infrastructure (Postgres + Redis)

```bash
npm run dev:infra
```

This starts PostgreSQL on port 5434 and Redis on port 6379 via Docker.

### 2. Set up the backend

```bash
cd backend
uv venv .venv
source .venv/bin/activate
uv pip install -e .
```

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Seed sample data

```bash
npm run db:seed
```

### 5. Start development servers

```bash
# All services at once (requires concurrently)
npm run dev

# Or individually:
npm run dev:backend   # FastAPI on http://localhost:8001
npm run dev:frontend  # Next.js on http://localhost:3000
npm run dev:zcash     # Rust service on http://localhost:8080
npm run dev:worker    # Celery worker
```

## Project Structure

```
zroll/
├── backend/           # FastAPI + SQLAlchemy + Celery
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── models/    # SQLAlchemy models
│   │   ├── services/  # Business logic
│   │   ├── core/      # Config, DB, auth
│   │   └── workers/   # Celery tasks
│   ├── alembic/       # Database migrations
│   └── scripts/       # Seed scripts
├── frontend/          # Next.js 14 + TypeScript + Tailwind
├── zcash-service/     # Rust Zcash microservice
├── docker-compose.yml # Postgres + Redis
└── .env               # Environment variables
```

## Environment

All configuration is in `.env` at the repo root. See `.env` for available variables.

## Database

- PostgreSQL 16 via Docker (port 5434)
- Managed with Alembic migrations
- Models in `backend/app/models/`

### Useful commands

```bash
npm run db:migrate  # Run pending migrations
npm run db:seed     # Seed sample data
npm run db:reset    # Drop all, re-migrate, re-seed
npm run stop        # Stop Docker containers
```
