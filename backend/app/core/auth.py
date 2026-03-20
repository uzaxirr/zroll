from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from dataclasses import dataclass
import uuid

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.organization import Organization

settings = get_settings()


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
    # Dev bypass: skip auth in development mode when no token provided
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
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise JWTError("Not an access token")

        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Missing sub claim")

        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
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

    except JWTError:
        if settings.app_env == "development":
            return await _dev_bypass_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )


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
