"""Pytest fixtures for all tests."""
from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.infrastructure.auth.jwt import JWTService
from app.infrastructure.auth.password import PasswordHasher
from app.main import app
from app.infrastructure.database.session import Base, get_db

# ── Test DB ───────────────────────────────────────────────────────────────────

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/fresher360_test"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Domain fixtures ───────────────────────────────────────────────────────────

@pytest.fixture
def admin_user() -> User:
    return User(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash="$hashed$",
        first_name="Admin",
        last_name="Test",
        role=UserRole.ADMIN,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def regular_user() -> User:
    return User(
        id=uuid.uuid4(),
        email="user@test.com",
        password_hash="$hashed$",
        first_name="John",
        last_name="Doe",
        role=UserRole.USER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def inactive_user() -> User:
    return User(
        id=uuid.uuid4(),
        email="inactive@test.com",
        password_hash="$hashed$",
        first_name="Inactive",
        last_name="User",
        role=UserRole.USER,
        is_active=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ── Infrastructure fixtures ───────────────────────────────────────────────────

@pytest.fixture
def password_hasher() -> PasswordHasher:
    return PasswordHasher()


@pytest.fixture
def jwt_service() -> JWTService:
    return JWTService()


# ── HTTP client (no real DB) ──────────────────────────────────────────────────

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
