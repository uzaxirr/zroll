from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from dataclasses import dataclass
from typing import Optional
import httpx

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization

settings = get_settings()
security = HTTPBearer()

_jwks_cache: Optional[dict] = None


async def _get_clerk_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.clerk.com/v1/jwks",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
        )
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


@dataclass
class AuthContext:
    user: User
    organization: Organization
    role: str  # "admin" or "contributor"


async def _dev_bypass_user(db: AsyncSession) -> AuthContext:
    """In development mode, return the first admin user from seed data."""
    result = await db.execute(
        select(User).where(User.role == "admin").limit(1)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No admin user found. Run db:seed first.",
        )
    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one()
    return AuthContext(user=user, organization=org, role=user.role.value)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    # Dev bypass: skip Clerk auth in development mode
    if settings.app_env == "development":
        auth_header = request.headers.get("authorization", "")
        if not auth_header or auth_header == "Bearer null" or auth_header == "Bearer undefined":
            return await _dev_bypass_user(db)

    # Extract token from Authorization header
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    token = auth_header.removeprefix("Bearer ")

    try:
        jwks = await _get_clerk_jwks()
        if jwks.get("keys"):
            key = jwks["keys"][0]
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not fetch JWKS",
            )
    except JWTError:
        # In dev mode, fall back to dev user on invalid token
        if settings.app_env == "development":
            return await _dev_bypass_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()
    if not user:
        # In dev mode, fall back to dev user if Clerk user not in DB
        if settings.app_env == "development":
            return await _dev_bypass_user(db)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return AuthContext(user=user, organization=org, role=user.role.value)


def require_role(role: str):
    async def role_checker(
        request: Request,
        db: AsyncSession = Depends(get_db),
    ) -> AuthContext:
        auth = await get_current_user(request, db)
        # In dev mode, bypass role check and return appropriate user
        if settings.app_env == "development" and auth.role != role:
            if role == "contributor":
                # Find a contributor user instead
                result = await db.execute(
                    select(User).where(User.role == "contributor").limit(1)
                )
                contributor_user = result.scalar_one_or_none()
                if contributor_user:
                    result = await db.execute(
                        select(Organization).where(Organization.id == contributor_user.organization_id)
                    )
                    org = result.scalar_one()
                    return AuthContext(user=contributor_user, organization=org, role="contributor")
            # If no matching user found in dev, allow anyway
            return auth
        if auth.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {role} role",
            )
        return auth

    return role_checker
