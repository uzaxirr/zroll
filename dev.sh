#!/usr/bin/env bash
set -euo pipefail

# ─── Colors & Labels ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDS=()

# ─── Cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${DIM}Shutting down all services...${RESET}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  docker compose -f "$ROOT/docker-compose.yml" down 2>/dev/null || true
  echo -e "${GREEN}All services stopped.${RESET}"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ─── Log prefixer ────────────────────────────────────────────────────────────
# Usage: some_command | prefix "LABEL" "COLOR"
prefix() {
  local label="$1"
  local color="$2"
  local pad
  pad=$(printf "%-10s" "$label")
  while IFS= read -r line; do
    echo -e "${color}${BOLD}${pad}${RESET} ${DIM}│${RESET} $line"
  done
}

# ─── Header ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  Zroll Dev Environment${RESET}"
echo -e "${DIM}  ─────────────────────${RESET}"
echo ""

# ─── 1. Docker services (Postgres + Redis) ──────────────────────────────────
echo -e "${MAGENTA}${BOLD}DOCKER${RESET}     ${DIM}│${RESET} Starting Postgres + Redis..."
docker compose -f "$ROOT/docker-compose.yml" up -d 2>&1 | prefix "DOCKER" "$MAGENTA"

# Wait for health
echo -e "${MAGENTA}${BOLD}DOCKER${RESET}     ${DIM}│${RESET} Waiting for healthy containers..."
for i in $(seq 1 30); do
  pg_healthy=$(docker inspect --format='{{.State.Health.Status}}' zroll-postgres 2>/dev/null || echo "starting")
  rd_healthy=$(docker inspect --format='{{.State.Health.Status}}' zroll-redis 2>/dev/null || echo "starting")
  if [[ "$pg_healthy" == "healthy" && "$rd_healthy" == "healthy" ]]; then
    echo -e "${MAGENTA}${BOLD}DOCKER${RESET}     ${DIM}│${RESET} ${GREEN}Postgres + Redis healthy${RESET}"
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo -e "${MAGENTA}${BOLD}DOCKER${RESET}     ${DIM}│${RESET} ${YELLOW}Timed out waiting for containers (continuing anyway)${RESET}"
  fi
  sleep 1
done

# ─── 2. Backend ──────────────────────────────────────────────────────────────
echo -e "${BLUE}${BOLD}BACKEND${RESET}    ${DIM}│${RESET} Starting FastAPI on :8001..."
(
  cd "$ROOT/backend"
  if [[ -d ".venv" ]]; then
    source .venv/bin/activate
  fi
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload 2>&1
) | prefix "BACKEND" "$BLUE" &
PIDS+=($!)

# ─── 3. Celery Worker ────────────────────────────────────────────────────────
echo -e "${YELLOW}${BOLD}WORKER${RESET}     ${DIM}│${RESET} Starting Celery worker..."
(
  cd "$ROOT/backend"
  if [[ -d ".venv" ]]; then
    source .venv/bin/activate
  fi
  celery -A app.workers.celery_app:celery_app worker --loglevel=info --concurrency=2 2>&1
) | prefix "WORKER" "$YELLOW" &
PIDS+=($!)

# ─── 4. Celery Beat (scheduled tasks) ───────────────────────────────────────
echo -e "${RED}${BOLD}BEAT${RESET}       ${DIM}│${RESET} Starting Celery beat scheduler..."
(
  cd "$ROOT/backend"
  if [[ -d ".venv" ]]; then
    source .venv/bin/activate
  fi
  celery -A app.workers.celery_app:celery_app beat --loglevel=info 2>&1
) | prefix "BEAT" "$RED" &
PIDS+=($!)

# ─── 5. Frontend ─────────────────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}FRONTEND${RESET}   ${DIM}│${RESET} Starting Next.js on :3000..."
(
  cd "$ROOT/frontend"
  npm run dev 2>&1
) | prefix "FRONTEND" "$CYAN" &
PIDS+=($!)

# ─── Ready ───────────────────────────────────────────────────────────────────
sleep 2
echo ""
echo -e "${DIM}  ─────────────────────${RESET}"
echo -e "  ${GREEN}${BOLD}Frontend${RESET}  → ${BOLD}http://localhost:3000${RESET}"
echo -e "  ${BLUE}${BOLD}Backend${RESET}   → ${BOLD}http://localhost:8001${RESET}"
echo -e "  ${MAGENTA}${BOLD}API Docs${RESET}  → ${BOLD}http://localhost:8001/docs${RESET}"
echo -e "  ${YELLOW}${BOLD}Worker${RESET}    → Celery (2 workers)"
echo -e "  ${RED}${BOLD}Beat${RESET}      → Price sync (60s), Wallet sync (300s), Confirmations (75s)"
echo -e "${DIM}  ─────────────────────${RESET}"
echo -e "  ${DIM}Press Ctrl+C to stop all services${RESET}"
echo ""

# ─── Wait for all ────────────────────────────────────────────────────────────
wait
