"""Integration tests for admin users management API endpoints.

GET   /api/v1/users/admin/list
PATCH /api/v1/users/admin/{user_id}/role
POST  /api/v1/users/admin/create
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.infrastructure.auth.jwt import JWTService


def make_user(
    role: UserRole = UserRole.USER,
    email: str = "test@example.com",
    first_name: str = "Test",
    last_name: str = "User",
    is_active: bool = True,
) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="$hashed$",
        first_name=first_name,
        last_name=last_name,
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


class TestAdminUserManagement:
    async def test_admin_can_list_users(self, client: AsyncClient) -> None:
        admin = make_user(role=UserRole.ADMIN, email="admin@test.com")
        regular_user = make_user(role=UserRole.USER, email="user@test.com")
        access_token, _ = make_tokens(admin)

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=admin,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.get_all",
                new_callable=AsyncMock,
                return_value=[admin, regular_user],
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.get(
                "/api/v1/users/admin/list",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert len(body["data"]) == 2
        assert body["data"][0]["email"] == "admin@test.com"
        assert body["data"][1]["email"] == "user@test.com"

    async def test_regular_user_cannot_list_users(self, client: AsyncClient) -> None:
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

    async def test_admin_can_update_user_role(self, client: AsyncClient) -> None:
        admin = make_user(role=UserRole.ADMIN)
        target_user = make_user(role=UserRole.USER, email="target@test.com")
        updated_user = make_user(role=UserRole.ADMIN, email="target@test.com")
        access_token, _ = make_tokens(admin)

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=admin,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.update_role",
                new_callable=AsyncMock,
                return_value=updated_user,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.patch(
                f"/api/v1/users/admin/{target_user.id}/role",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"role": "ADMIN"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert body["data"]["role"] == "ADMIN"

    async def test_admin_update_nonexistent_user_returns_404(self, client: AsyncClient) -> None:
        admin = make_user(role=UserRole.ADMIN)
        access_token, _ = make_tokens(admin)
        random_id = uuid.uuid4()

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=admin,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.update_role",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.patch(
                f"/api/v1/users/admin/{random_id}/role",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"role": "ADMIN"},
            )

        assert response.status_code == 404
        body = response.json()
        assert body["detail"]["code"] == "USER_NOT_FOUND"

    async def test_admin_can_create_new_user(self, client: AsyncClient) -> None:
        admin = make_user(role=UserRole.ADMIN)
        new_user = make_user(
            role=UserRole.ADMIN,
            email="newadmin@test.com",
            first_name="New",
            last_name="Admin",
        )
        access_token, _ = make_tokens(admin)

        with (
            patch(
                "app.application.auth.get_current_user.GetCurrentUserUseCase.execute",
                new_callable=AsyncMock,
                return_value=admin,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.email_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.create",
                new_callable=AsyncMock,
                return_value=new_user,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/users/admin/create",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "first_name": "New",
                    "last_name": "Admin",
                    "email": "newadmin@test.com",
                    "password": "Password@123",
                    "role": "ADMIN",
                },
            )

        assert response.status_code == 201
        body = response.json()
        assert body["error"] is None
        assert body["data"]["email"] == "newadmin@test.com"
        assert body["data"]["role"] == "ADMIN"
