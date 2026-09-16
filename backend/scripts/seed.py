"""Seed script — creates initial ADMIN and USER accounts.

Usage:
    python scripts/seed.py

All seed values come from environment variables.
The operation is IDEMPOTENT: running it twice will not create duplicates.
Passwords are hashed with Argon2id before insertion.

Required env vars:
    SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_FIRST_NAME, SEED_ADMIN_LAST_NAME
    SEED_USER_EMAIL,  SEED_USER_PASSWORD,  SEED_USER_FIRST_NAME,  SEED_USER_LAST_NAME
"""
from __future__ import annotations

import asyncio
import logging
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import get_settings
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.infrastructure.auth.password import PasswordHasher
from app.infrastructure.database.repositories.user_repository import UserRepository

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()
hasher = PasswordHasher()


async def seed_user(
    repo: UserRepository,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role: UserRole,
) -> None:
    if not password:
        logger.error(f"Password for {email} is empty — set the env var and retry.")
        sys.exit(1)

    if await repo.email_exists(email):
        logger.info(f"SKIP: {email} already exists.")
        return

    user = User.create(
        email=email,
        password_hash=hasher.hash(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
    )
    await repo.create(user)
    logger.info(f"CREATED: {email} ({role.value})")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        repo = UserRepository(session)

        await seed_user(
            repo,
            email=settings.SEED_ADMIN_EMAIL,
            password=settings.SEED_ADMIN_PASSWORD,
            first_name=settings.SEED_ADMIN_FIRST_NAME,
            last_name=settings.SEED_ADMIN_LAST_NAME,
            role=UserRole.ADMIN,
        )

        await seed_user(
            repo,
            email=settings.SEED_USER_EMAIL,
            password=settings.SEED_USER_PASSWORD,
            first_name=settings.SEED_USER_FIRST_NAME,
            last_name=settings.SEED_USER_LAST_NAME,
            role=UserRole.USER,
        )

    await engine.dispose()
    logger.info("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
