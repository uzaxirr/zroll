from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api import auth, dashboard, organizations, contributors, payroll, wallet, contributor_portal, settings, websocket

s = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Zroll API",
    description="Privacy-first crypto payroll platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[s.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(organizations.router)
app.include_router(contributors.router)
app.include_router(payroll.router)
app.include_router(wallet.router)
app.include_router(contributor_portal.router)
app.include_router(settings.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
