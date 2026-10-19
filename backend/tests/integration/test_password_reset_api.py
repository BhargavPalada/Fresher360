"""Integration tests for the forgot-password flow API endpoints.

These tests use the real FastAPI app but mock the database layer and email
delivery exactly like the existing test_auth_api.py does.
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.application.auth.forgot_password import compute_otp_hmac
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_user(email: str = "test@example.com") -> User:
    return User(
        id=__import__("uuid").uuid4(),
        email=email,
        password_hash="$hashed$",
        first_name="Test",
        last_name="User",
        role=UserRole.USER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _future(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def _past(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=minutes)


def _make_challenge(otp: str, email: str = "test@example.com", expired: bool = False, attempts: int = 0):
    ch = MagicMock()
    ch.id = __import__("uuid").uuid4()
    ch.otp_hmac = compute_otp_hmac(otp, email)
    ch.expires_at = _past() if expired else _future()
    ch.attempt_count = attempts
    ch.is_consumed = False
    return ch


def _make_token_record(user_id, expired: bool = False) -> MagicMock:
    t = MagicMock()
    t.id = __import__("uuid").uuid4()
    t.user_id = user_id
    t.expires_at = _past() if expired else _future()
    t.is_consumed = False
    return t


# ── POST /api/v1/auth/forgot-password ─────────────────────────────────────────

class TestForgotPasswordEndpoint:
    async def test_known_email_returns_200_generic_message(
        self, client: AsyncClient
    ) -> None:
        user = _make_user()
        with (
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.get_by_email",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.count_recent_challenges",
                new_callable=AsyncMock,
                return_value=0,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.create_otp_challenge",
                new_callable=AsyncMock,
                return_value=MagicMock(),
            ),
            patch(
                "app.infrastructure.email.email_service.send_otp_email",
                new_callable=AsyncMock,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "test@example.com"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert "verification code" in body["data"]["message"].lower()

    async def test_unknown_email_returns_same_generic_200(
        self, client: AsyncClient
    ) -> None:
        """Account enumeration protection: same response for unknown email."""
        with (
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.get_by_email",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.count_recent_challenges",
                new_callable=AsyncMock,
                return_value=0,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "nobody@example.com"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None

    async def test_invalid_email_returns_422(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "not-an-email"},
        )
        assert response.status_code == 422

    async def test_missing_email_returns_422(self, client: AsyncClient) -> None:
        response = await client.post("/api/v1/auth/forgot-password", json={})
        assert response.status_code == 422

    async def test_rate_limited_still_returns_200(
        self, client: AsyncClient
    ) -> None:
        user = _make_user()
        with (
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.get_by_email",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.count_recent_challenges",
                new_callable=AsyncMock,
                return_value=99,  # way over limit
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "test@example.com"},
            )
        assert response.status_code == 200  # generic — no disclosure


# ── POST /api/v1/auth/verify-reset-otp ───────────────────────────────────────

class TestVerifyResetOtpEndpoint:
    async def test_valid_otp_returns_reset_token(self, client: AsyncClient) -> None:
        user = _make_user()
        otp = "123456"
        challenge = _make_challenge(otp)

        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_latest_active_challenge",
                new_callable=AsyncMock,
                return_value=challenge,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.consume_challenge",
                new_callable=AsyncMock,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.create_reset_token",
                new_callable=AsyncMock,
                return_value=MagicMock(),
            ),
            patch(
                "app.infrastructure.database.repositories.user_repository.UserRepository.get_by_email",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/verify-reset-otp",
                json={"email": "test@example.com", "otp": otp},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert "reset_token" in body["data"]

    async def test_wrong_otp_returns_400(self, client: AsyncClient) -> None:
        challenge = _make_challenge("123456")
        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_latest_active_challenge",
                new_callable=AsyncMock,
                return_value=challenge,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.increment_attempt",
                new_callable=AsyncMock,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/verify-reset-otp",
                json={"email": "test@example.com", "otp": "999999"},
            )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "OTP_INVALID"

    async def test_expired_otp_returns_400(self, client: AsyncClient) -> None:
        challenge = _make_challenge("123456", expired=True)
        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_latest_active_challenge",
                new_callable=AsyncMock,
                return_value=challenge,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/verify-reset-otp",
                json={"email": "test@example.com", "otp": "123456"},
            )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "OTP_EXPIRED"

    async def test_max_attempts_returns_429(self, client: AsyncClient) -> None:
        challenge = _make_challenge("123456", attempts=5)
        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_latest_active_challenge",
                new_callable=AsyncMock,
                return_value=challenge,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/verify-reset-otp",
                json={"email": "test@example.com", "otp": "123456"},
            )
        assert response.status_code == 429

    async def test_non_numeric_otp_returns_422(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/verify-reset-otp",
            json={"email": "test@example.com", "otp": "abcdef"},
        )
        assert response.status_code == 422

    async def test_otp_too_short_returns_422(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/verify-reset-otp",
            json={"email": "test@example.com", "otp": "12345"},
        )
        assert response.status_code == 422


# ── POST /api/v1/auth/reset-password ─────────────────────────────────────────

class TestResetPasswordEndpoint:
    async def test_valid_reset_returns_200(self, client: AsyncClient) -> None:
        import uuid
        user_id = uuid.uuid4()
        token_record = _make_token_record(user_id)

        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_reset_token_by_hash",
                new_callable=AsyncMock,
                return_value=token_record,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.update_user_password",
                new_callable=AsyncMock,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.consume_reset_token",
                new_callable=AsyncMock,
            ),
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.invalidate_all_reset_tokens_for_user",
                new_callable=AsyncMock,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/reset-password",
                json={
                    "reset_token": "some-valid-raw-token",
                    "new_password": "NewPass0rd!",
                    "confirm_password": "NewPass0rd!",
                },
            )

        assert response.status_code == 200
        body = response.json()
        assert body["error"] is None
        assert "successfully" in body["data"]["message"].lower()

    async def test_mismatched_passwords_returns_422(
        self, client: AsyncClient
    ) -> None:
        with patch("app.dependencies.get_db"):
            response = await client.post(
                "/api/v1/auth/reset-password",
                json={
                    "reset_token": "tok",
                    "new_password": "NewPass0rd!",
                    "confirm_password": "Different1!",
                },
            )
        assert response.status_code == 422

    async def test_invalid_token_returns_400(self, client: AsyncClient) -> None:
        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_reset_token_by_hash",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/reset-password",
                json={
                    "reset_token": "invalid-token",
                    "new_password": "NewPass0rd!",
                    "confirm_password": "NewPass0rd!",
                },
            )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "RESET_TOKEN_INVALID"

    async def test_expired_token_returns_400(self, client: AsyncClient) -> None:
        import uuid
        token_record = _make_token_record(uuid.uuid4(), expired=True)
        with (
            patch(
                "app.infrastructure.database.repositories.password_reset_repository.PasswordResetRepository.get_reset_token_by_hash",
                new_callable=AsyncMock,
                return_value=token_record,
            ),
            patch("app.dependencies.get_db"),
        ):
            response = await client.post(
                "/api/v1/auth/reset-password",
                json={
                    "reset_token": "tok",
                    "new_password": "NewPass0rd!",
                    "confirm_password": "NewPass0rd!",
                },
            )
        assert response.status_code == 400
        assert response.json()["detail"]["code"] == "RESET_TOKEN_EXPIRED"

    async def test_weak_password_returns_422(self, client: AsyncClient) -> None:
        with patch("app.dependencies.get_db"):
            response = await client.post(
                "/api/v1/auth/reset-password",
                json={
                    "reset_token": "tok",
                    "new_password": "weak",
                    "confirm_password": "weak",
                },
            )
        assert response.status_code in (422, 400)

    async def test_missing_reset_token_returns_422(
        self, client: AsyncClient
    ) -> None:
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"new_password": "NewPass0rd!", "confirm_password": "NewPass0rd!"},
        )
        assert response.status_code == 422
