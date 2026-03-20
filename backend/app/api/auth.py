from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.database import get_db
from app.core.encryption import encrypt
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.auth import get_current_user, AuthContext
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.wallet import OrgWallet
from app.services.zcash import ZcashService
from jose import JWTError

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    company_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    org = Organization(name=req.company_name)
    db.add(org)
    await db.flush()

    user = User(
        email=req.email,
        full_name=req.name,
        password_hash=hash_password(req.password),
        role=UserRole.admin,
        organization_id=org.id,
    )
    db.add(user)
    await db.flush()

    # Capture IDs before commit (commit expires ORM objects)
    user_id = str(user.id)
    org_id = str(org.id)
    role = user.role.value

    await db.commit()

    # Generate Zcash testnet wallet via Rust service (non-blocking)
    zcash = ZcashService()
    try:
        keys = await zcash.generate_wallet()
        wallet = OrgWallet(
            organization_id=org_id,
            zcash_wallet_id=keys.wallet_id,
            address=encrypt(keys.unified_address),
            viewing_key_full=keys.full_viewing_key,
            viewing_key_incoming=keys.incoming_viewing_key,
        )
        db.add(wallet)
        await db.commit()
    except Exception:
        await db.rollback()
    finally:
        await zcash.close()

    access_token = create_access_token(user_id, org_id, role)
    refresh_token = create_refresh_token(user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user_id,
        "org_id": org_id,
    }


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(str(user.id), str(user.organization_id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    return {"access_token": access_token, "refresh_token": refresh_token}


@router.post("/refresh")
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(str(user.id), str(user.organization_id), user.role.value)
    return {"access_token": access_token}


@router.get("/me")
async def me(auth: AuthContext = Depends(get_current_user)):
    return {
        "id": str(auth.user.id),
        "email": auth.user.email,
        "name": auth.user.full_name,
        "role": auth.role,
        "organization": {
            "id": str(auth.organization.id),
            "name": auth.organization.name,
        },
    }
