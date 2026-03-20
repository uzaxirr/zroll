"""Seed database with test data."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User, UserRole

settings = get_settings()


async def seed():
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        org = Organization(name="Test Company")
        session.add(org)
        await session.flush()

        admin = User(
            email="admin@test.com",
            full_name="Admin User",
            password_hash=hash_password("password123"),
            role=UserRole.admin,
            organization_id=org.id,
        )
        session.add(admin)

        contributor = User(
            email="contributor@test.com",
            full_name="Contributor User",
            password_hash=hash_password("password123"),
            role=UserRole.contributor,
            organization_id=org.id,
        )
        session.add(contributor)

        await session.commit()
        print(f"Seeded org: {org.id}")
        print(f"Seeded admin: {admin.id} (admin@test.com / password123)")
        print(f"Seeded contributor: {contributor.id} (contributor@test.com / password123)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
