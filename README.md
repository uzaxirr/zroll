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

## Railway Deployment

The app is deployed on Railway with the following services:

| Service | Description | URL |
|---------|-------------|-----|
| Backend | FastAPI + Alembic migrations | https://backend-production-47c7.up.railway.app |
| Frontend | Next.js 14 (standalone) | https://frontend-production-7963.up.railway.app |
| Worker | Celery worker (background jobs) | Internal |
| Beat | Celery beat (scheduled tasks) | Internal |
| Postgres | PostgreSQL database | Managed by Railway |
| Redis | Redis cache + message broker | Managed by Railway |

### Deploying

Deploy individual services using Railway CLI:

```bash
# Backend (also deploys for worker/beat since same codebase)
cd zroll
railway service backend
railway up backend/ --path-as-root --detach

# Frontend
railway service frontend
railway up frontend/ --path-as-root --detach

# Worker
railway service worker
railway up backend/ --path-as-root --detach

# Beat
railway service beat
railway up backend/ --path-as-root --detach
```

The `--path-as-root` flag is required so the Dockerfile is found at the archive root.

### Environment Variables

Each service needs its own environment variables configured in the Railway dashboard. Key variables:

- **Backend/Worker/Beat**: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `WALLET_ENCRYPTION_KEY`, `ZCASH_SERVICE_URL`
- **Frontend**: `NEXT_PUBLIC_API_URL`

### Deployment Gotchas

1. **`--path-as-root` is mandatory.** Without it, `railway up backend/` archives files with `backend/` as a prefix, so Railway can't find the Dockerfile at the root. Always pass `--path-as-root`.

2. **`RAILWAY_DOCKERFILE_PATH` cannot be deleted via CLI.** If you set this env var and need to remove it, delete it from the Railway dashboard. Setting it to an empty string or a non-existent file will break builds.

3. **Frontend: `npm ci` vs `npm install`.** The Dockerfile uses `npm install --legacy-peer-deps` to handle peer dep conflicts. `npm ci` may fail with ERESOLVE errors.

4. **Worker and Beat share the backend Dockerfile.** Both services deploy the same `backend/` codebase. The start command is overridden via `RAILWAY_START_COMMAND` env var in Railway (e.g., `celery -A app.workers.celery_app worker` for worker, `celery -A app.workers.celery_app beat` for beat).

5. **`NEXT_PUBLIC_*` env vars need `ARG` in Dockerfile.** Railway injects env vars as Docker build args, but you must declare `ARG NEXT_PUBLIC_*` before `ENV NEXT_PUBLIC_*=$NEXT_PUBLIC_*` in the Dockerfile. Without the `ARG` declaration, the variable resolves to empty string and API calls fail at runtime.

6. **Alembic migrations run on backend startup.** The backend Dockerfile CMD runs `alembic upgrade head` before starting uvicorn. If the migration fails, the container won't start. Check logs if the backend service is crash-looping.

7. **`.dockerignore` matters.** Without it, `node_modules` (frontend) and `.venv` (backend) get uploaded, bloating the build context and potentially causing 500 errors on upload.

## Environment (Local)

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
