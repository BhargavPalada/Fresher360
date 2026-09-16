"""Unit tests for LoginUseCase."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.auth.login import LoginUseCase
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.domain.exceptions.authentication import InactiveUserError, InvalidCredentialsError


def make_user(role: UserRole = UserRole.USER, is_active: bool = True) -> User:
    return User(
        id=uuid.uuid4(),
        email="user@example.com",
        password_hash="$hashed$",
        first_name="Test",
        last_name="User",
        role=role,
        is_active=is_active,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def mock_user_repo():
    return AsyncMock()


@pytest.fixture
def mock_password_hasher():
    m = MagicMock()
    m.verify.return_value = True
    return m


@pytest.fixture
def mock_jwt_service():
    m = MagicMock()
    m.encode_access_token.return_value = "access.token.here"
    m.encode_refresh_token.return_value = "refresh.token.here"
    return m


class TestLoginUseCase:
    async def test_valid_credentials_returns_tokens(
        self, mock_user_repo, mock_password_hasher, mock_jwt_service
    ) -> None:
        user = make_user(role=UserRole.ADMIN)
        mock_user_repo.get_by_email.return_value = user

        use_case = LoginUseCase(mock_user_repo, mock_password_hasher, mock_jwt_service)
        result = await use_case.execute("admin@example.com", "password")

        assert result.access_token == "access.token.here"
        assert result.refresh_token == "refresh.token.here"
        assert result.token_type == "bearer"

    async def test_unknown_email_raises_invalid_credentials(
        self, mock_user_repo, mock_password_hasher, mock_jwt_service
    ) -> None:
        mock_user_repo.get_by_email.return_value = None

        use_case = LoginUseCase(mock_user_repo, mock_password_hasher, mock_jwt_service)
        with pytest.raises(InvalidCredentialsError):
            await use_case.execute("unknown@example.com", "password")

    async def test_wrong_password_raises_invalid_credentials(
        self, mock_user_repo, mock_password_hasher, mock_jwt_service
    ) -> None:
        user = make_user()
        mock_user_repo.get_by_email.return_value = user
        mock_password_hasher.verify.return_value = False

        use_case = LoginUseCase(mock_user_repo, mock_password_hasher, mock_jwt_service)
        with pytest.raises(InvalidCredentialsError):
            await use_case.execute("user@example.com", "wrongpassword")

    async def test_inactive_user_raises_inactive_error(
        self, mock_user_repo, mock_password_hasher, mock_jwt_service
    ) -> None:
        user = make_user(is_active=False)
        mock_user_repo.get_by_email.return_value = user
        mock_password_hasher.verify.return_value = True

        use_case = LoginUseCase(mock_user_repo, mock_password_hasher, mock_jwt_service)
        with pytest.raises(InactiveUserError):
            await use_case.execute("inactive@example.com", "password")

    async def test_email_normalized_before_lookup(
        self, mock_user_repo, mock_password_hasher, mock_jwt_service
    ) -> None:
        user = make_user()
        mock_user_repo.get_by_email.return_value = user

        use_case = LoginUseCase(mock_user_repo, mock_password_hasher, mock_jwt_service)
        await use_case.execute("  USER@EXAMPLE.COM  ", "password")

        called_email = mock_user_repo.get_by_email.call_args[0][0]
        assert called_email == "user@example.com"

    async def test_jwt_called_with_correct_user_id_and_role(
        self, mock_user_repo, mock_password_hasher, mock_jwt_service
    ) -> None:
        user = make_user(role=UserRole.ADMIN)
        mock_user_repo.get_by_email.return_value = user

        use_case = LoginUseCase(mock_user_repo, mock_password_hasher, mock_jwt_service)
        await use_case.execute("admin@example.com", "password")

        mock_jwt_service.encode_access_token.assert_called_once_with(user.id, UserRole.ADMIN)
        mock_jwt_service.encode_refresh_token.assert_called_once_with(user.id)
