# Zroll Backend

FastAPI + SQLAlchemy async + PostgreSQL (Neon). Clerk for auth. Celery + Redis for async jobs.

## Structure

```
app/
  main.py             # FastAPI app, CORS, router registration
  core/
    auth.py           # AuthContext, require_role() dependency
    config.py         # Settings via pydantic-settings
    database.py       # Async SQLAlchemy session
    encryption.py     # encrypt()/decrypt() for sensitive fields (wallet addresses, tax IDs)
  api/                # Route handlers (one file per domain)
    auth.py           # POST /api/auth/signup, Clerk webhooks
    dashboard.py      # GET /api/dashboard/stats
    organizations.py  # GET/PUT /api/organizations/me
    contributors.py   # GET/POST /api/contributors, PUT /api/contributors/{id}
    payroll.py        # GET/POST /api/payroll/*, history, export
    wallet.py         # GET /api/wallet/info, POST /api/wallet/viewing-keys
    contributor_portal.py  # Contributor-facing: stats, payments, portfolio, tax
    settings.py       # Additional settings endpoints
    websocket.py      # WebSocket for real-time payroll status
  models/             # SQLAlchemy ORM models
    organization.py, user.py, contributor.py, payroll.py, wallet.py, financial.py
  services/           # Business logic
    zcash.py          # Zcash node interaction (lightwalletd)
    payroll.py        # Payroll execution logic
    price.py          # ZEC price feed (CoinGecko)
    tax.py            # Tax calculation and export
    memo.py           # Zcash memo field encoding
  workers/            # Celery tasks
```

## Auth Pattern

Routes use `auth: AuthContext = Depends(require_role("admin"))` or `require_role("contributor")`.
`AuthContext` contains `.user` and `.organization`. In dev mode, auth may be bypassed with mock data.

## API Conventions

- All routes prefixed with `/api/` (e.g., `APIRouter(prefix="/api/contributors")`).
- Request bodies are Pydantic `BaseModel` subclasses.
- Optional update fields use `Optional[T] = None`. Only non-None fields are applied.
- Sensitive data (wallet addresses, tax IDs) is encrypted at rest via `encrypt()`/`decrypt()`.
- List endpoints return `{ total, items/runs/contributors }` with pagination via `page` + `limit` query params.
