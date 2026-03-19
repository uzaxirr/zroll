#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Zroll Dev Setup ==="

# 1. Check prerequisites
echo ""
echo "[1/6] Checking prerequisites..."
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 not found"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: node not found"; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "ERROR: cargo (Rust) not found"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
echo "  python3 $(python3 --version 2>&1 | awk '{print $2}')"
echo "  node $(node --version)"
echo "  cargo $(cargo --version | awk '{print $2}')"
echo "  docker $(docker --version | awk '{print $3}' | tr -d ',')"

# 2. Start infrastructure
echo ""
echo "[2/6] Starting Postgres + Redis..."
docker compose up -d
sleep 2

# 3. Backend setup
echo ""
echo "[3/6] Setting up backend..."
cd backend
if [ ! -d ".venv" ]; then
  echo "  Creating virtual environment..."
  uv venv .venv
fi
source .venv/bin/activate
echo "  Installing dependencies..."
uv pip install -e . --quiet 2>/dev/null || uv pip install -e .
cd "$SCRIPT_DIR"

# 4. Frontend setup
echo ""
echo "[4/6] Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install
else
  echo "  node_modules exists, skipping install"
fi
cd "$SCRIPT_DIR"

# 5. Run migrations + seed
echo ""
echo "[5/6] Running database migrations..."
cd backend
source .venv/bin/activate
alembic upgrade head 2>/dev/null && echo "  Migrations applied" || echo "  Migrations already up to date"
cd "$SCRIPT_DIR"

# 6. Start all services
echo ""
echo "[6/6] Starting all services..."
echo ""
echo "  Starting Zcash service on :8080..."
cd zcash-service && cargo run --bin zcash-service &
ZCASH_PID=$!
cd "$SCRIPT_DIR"

echo "  Starting backend on :8001..."
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8001 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

echo "  Starting frontend on :3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo "=== All services starting ==="
echo ""
echo "  Frontend:      http://localhost:3000"
echo "  Backend API:   http://localhost:8001"
echo "  Zcash service: http://localhost:8080"
echo "  Postgres:      localhost:5434"
echo "  Redis:         localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
trap "echo ''; echo 'Stopping services...'; kill $ZCASH_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose down; echo 'Done.'" EXIT

wait
