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

## Privacy Architecture: Viewing-Key-Only Mode

Zroll uses a viewing-key-only architecture. The server holds a Unified Full Viewing Key (UFVK) that can **view** all transactions but **cannot spend** funds. Transaction history is read directly from the Zcash blockchain, not stored in a database.

### How it works

1. Admin creates a Zcash wallet in Zodl (or any Zcash wallet)
2. Admin derives a UFVK from their seed phrase using the CLI tool below
3. Admin pastes the UFVK into Zroll settings
4. Zroll syncs with the Zcash network via the UFVK to read transaction history
5. No transaction data is persisted. Balances and history are fetched on-demand from chain.

### Deriving your Viewing Key

The `derive-ufvk` CLI tool converts your 24-word seed phrase into a UFVK. The seed phrase never leaves your machine.

```bash
cd zcash-service
cargo run --bin derive-ufvk
```

```
Enter your 24-word seed phrase (space-separated):
> tag fall return dizzy eagle hockey ...

Network? [m]ainnet or [t]estnet (default: mainnet):
> t

Unified Full Viewing Key (UFVK):
uviewtest15gj34du0xyrnv43vrz2p9...
```

Paste the UFVK into Zroll Settings. The server can now view all transactions for this wallet.

### Verifying your Viewing Key

To verify the UFVK can read transactions:

```bash
cd zcash-service
cargo run --bin verify-ufvk
```

This syncs with the Zcash testnet and displays the wallet balance and all transactions with memos.

### View Transactions API

```bash
curl -X POST http://localhost:8080/view/transactions \
  -H "Content-Type: application/json" \
  -d '{"ufvk": "uviewtest1...", "birthday": 3860000}'
```

Returns balance and all transactions with decoded pay stub memos, read directly from chain.

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
