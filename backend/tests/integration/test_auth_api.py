"""Integration tests for authentication API endpoints.

These tests use the real FastAPI app but mock the database layer.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.domain.exceptions.authentication import InvalidCredentialsError
from app.infrastructure.auth.jwt import JWTService
from app.main import app


def make_user(role: UserRole = UserRole.USER, is_active: bool = True) -> User:
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        password_hash="$hashed$",
        first_name="Test",
        last_name="User",
        role=role,
        is_active=is_active,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def make_tokens(user: User) -> tuple[str, str]:
    svc = JWTService()
    return (
        svc.encode_access_token(user.id, user.role),
        svc.encode_refresh_token(user.id),
    )


class TestLoginEndpoint:
    async def test_valid_admin_login(self, client: AsyncClient) -> None:
        user = make_user(role=UserRole.ADMIN)
        with (
            patch(
                "app.api.v1.auth.LoginUseCase.execute",
                new_callable=AsyncMock,
                return_value=MagicMock(
                    access_token="tok", refresh_token="ref", token_type="bearer"
                ),
            ),
            patch(
                "app.api.v1.auth.UserRepository.get_by_email",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/login",
                json={"email": "admin@example.com", "password": "Admin@1234!"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert "access_token" in body["data"]

    async def test_login_request_with_role_field_is_ignored(
        self, client: AsyncClient
    ) -> None:
        """The role field in the request body must be silently ignored."""
        # Even if a client sends role, it should not affect the result
        # (Pydantic schema has no role field, so it's stripped automatically)
        with (
            patch(
                "app.api.v1.auth.LoginUseCase.execute",
                new_callable=AsyncMock,
                side_effect=InvalidCredentialsError("Invalid credentials."),
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/login",
                json={"email": "x@x.com", "password": "pass", "role": "ADMIN"},
            )
        # Role is stripped; response may be 401 (no real DB) but must not be 422
        assert response.status_code != 422

    async def test_missing_email_returns_422(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={"password": "pass"},
        )
        assert response.status_code == 422

    async def test_missing_password_returns_422(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "user@example.com"},
        )
        assert response.status_code == 422


class TestMeEndpoint:
    async def test_unauthenticated_returns_401(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_invalid_token_returns_401(self, client: AsyncClient) -> None:
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    async def test_valid_token_returns_user(self, client: AsyncClient) -> None:
        user = make_user(role=UserRole.USER)
        access_token, _ = make_tokens(user)

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["email"] == user.email
        assert body["data"]["role"] == user.role.value
        assert "password" not in str(body)
        assert "password_hash" not in str(body)


class TestRefreshEndpoint:
    async def test_missing_cookie_returns_401(self, client: AsyncClient) -> None:
        response = await client.post("/api/v1/auth/refresh")
        assert response.status_code == 401


class TestAuthorizationEnforcement:
    async def test_user_token_cannot_access_admin_endpoint(
        self, client: AsyncClient
    ) -> None:
        user = make_user(role=UserRole.USER)
        access_token, _ = make_tokens(user)

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.get(
                "/api/v1/users/admin/list",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        assert response.status_code == 403

    async def test_admin_token_can_access_admin_endpoint(
        self, client: AsyncClient
    ) -> None:
        user = make_user(role=UserRole.ADMIN)
        access_token, _ = make_tokens(user)

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.get_all",
                new_callable=AsyncMock,
                return_value=[user],
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.get(
                "/api/v1/users/admin/list",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        assert response.status_code == 200


class TestRegisterEndpoint:
    async def test_successful_registration(self, client: AsyncClient) -> None:
        user = make_user(role=UserRole.USER)
        with (
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.email_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.create",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "app.infrastructure.database.session.AsyncSession.commit",
                new_callable=AsyncMock,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/register",
                json={
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "test@example.com",
                    "password": "Password@123",
                },
            )
        assert response.status_code == 201
        body = response.json()
        assert body["error"] is None
        assert "access_token" in body["data"]
        assert body["data"]["user"]["email"] == "test@example.com"

    async def test_duplicate_email_registration_fails(self, client: AsyncClient) -> None:
        with (
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.email_exists",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/register",
                json={
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "test@example.com",
                    "password": "Password@123",
                },
            )
        assert response.status_code == 409
        body = response.json()
        assert body["detail"]["code"] == "EMAIL_EXISTS"

