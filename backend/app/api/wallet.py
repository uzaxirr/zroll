import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.auth import AuthContext, require_role
from app.core.database import get_db
from app.core.encryption import decrypt, encrypt
from app.models.wallet import OrgWallet, SharedViewingKey, ViewingKeyType
from app.services.zcash import ZcashService

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


class ShareViewingKeyRequest(BaseModel):
    shared_with: str
    key_type: str  # "full", "incoming", "outgoing"
    expires_at: Optional[str] = None


@router.get("/info")
async def wallet_info(
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgWallet).where(OrgWallet.organization_id == auth.organization.id)
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet configured")

    try:
        addr = decrypt(wallet.address)
        masked = f"{addr[:12]}...{addr[-8:]}" if len(addr) > 20 else addr
    except Exception:
        masked = "error decrypting"

    return {
        "address_masked": masked,
        "balance_zec": float(wallet.balance_zec),
        "pool": wallet.pool.value,
        "status": "connected" if wallet.last_synced_at else "pending_sync",
        "last_synced": wallet.last_synced_at.isoformat() if wallet.last_synced_at else None,
    }


@router.post("/viewing-keys")
async def share_viewing_key(
    req: ShareViewingKeyRequest,
    auth: AuthContext = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgWallet).where(OrgWallet.organization_id == auth.organization.id)
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="No wallet configured")

    key_type = ViewingKeyType(req.key_type)

    if key_type == ViewingKeyType.full:
        key_value = wallet.viewing_key_full
    elif key_type == ViewingKeyType.incoming:
        key_value = wallet.viewing_key_incoming
    else:
        # For outgoing, call the Rust service using wallet_id
        zcash = ZcashService()
        try:
            key_value = await zcash.export_viewing_key(
                wallet.zcash_wallet_id, "outgoing"
            )
        finally:
            await zcash.close()

    from datetime import datetime
    expires = None
    if req.expires_at:
        expires = datetime.fromisoformat(req.expires_at)

    svk = SharedViewingKey(
        org_wallet_id=wallet.id,
        shared_with=req.shared_with,
        key_type=key_type,
        key_value=key_value,
        expires_at=expires,
    )
    db.add(svk)
    await db.flush()

    return {"id": str(svk.id), "viewing_key": key_value}
