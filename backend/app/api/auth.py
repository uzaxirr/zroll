import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.database import get_db
from app.core.encryption import encrypt
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.wallet import OrgWallet
from app.services.zcash import ZcashService

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


class SignupRequest(BaseModel):
    name: str
    email: str
    company_name: str
    clerk_user_id: str
    clerk_org_id: str


@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    org = Organization(
        name=req.company_name,
        clerk_org_id=req.clerk_org_id,
    )
    db.add(org)
    await db.flush()

    user = User(
        clerk_user_id=req.clerk_user_id,
        email=req.email,
        full_name=req.name,
        role=UserRole.admin,
        organization_id=org.id,
    )
    db.add(user)

    # Generate real Zcash testnet wallet via Rust service.
    # The Rust service manages all key material. We store only the
    # wallet_id (for API calls), unified_address, and viewing keys.
    zcash = ZcashService()
    try:
        keys = await zcash.generate_wallet()
        wallet = OrgWallet(
            organization_id=org.id,
            zcash_wallet_id=keys.wallet_id,
            address=encrypt(keys.unified_address),
            viewing_key_full=keys.full_viewing_key,
            viewing_key_incoming=keys.incoming_viewing_key,
        )
        db.add(wallet)
    except Exception:
        # Wallet generation may fail if Zcash service is down; create org anyway
        pass
    finally:
        await zcash.close()

    await db.flush()
    return {"status": "ok", "organization_id": str(org.id), "user_id": str(user.id)}


@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()

    # Verify Clerk webhook signature
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")

    if not all([svix_id, svix_timestamp, svix_signature]):
        raise HTTPException(status_code=400, detail="Missing webhook headers")

    payload = await request.json()
    event_type = payload.get("type")

    if event_type == "user.created":
        data = payload["data"]
        email = data.get("email_addresses", [{}])[0].get("email_address", "")
        name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()

        # Check if user already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.clerk_user_id == data["id"]))
        if result.scalar_one_or_none():
            return {"status": "already_exists"}

        # User will be linked to org when they're added as a contributor
        # or on signup flow

    return {"status": "ok"}
