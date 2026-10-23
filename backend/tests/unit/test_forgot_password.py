"""Unit tests for the forgot_password use case."""
from __future__ import annotations

import hmac as _hmac
import hashlib
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.auth.forgot_password import (
    ForgotPasswordUseCase,
    compute_otp_hmac,
    generate_otp,
    OTP_LENGTH,
    OTP_RATE_LIMIT_COUNT,
)
from app.domain.exceptions.authentication import EmailNotFoundError


# ── helpers ───────────────────────────────────────────────────────────────────

def _make_user(email: str = "user@test.com"):
    user = MagicMock()
    user.id = "test-uuid"
    user.email = email
    return user


def _make_repos(user=None, challenge_count: int = 0):
    user_repo = AsyncMock()
    user_repo.get_by_email.return_value = user

    reset_repo = AsyncMock()
    reset_repo.count_recent_challenges.return_value = challenge_count
    reset_repo.create_otp_challenge.return_value = MagicMock()
    return user_repo, reset_repo


# ── OTP generation ─────────────────────────────────────────────────────────────

class TestGenerateOtp:
    def test_otp_has_correct_length(self) -> None:
        otp = generate_otp()
        assert len(otp) == OTP_LENGTH

    def test_otp_is_numeric(self) -> None:
        for _ in range(20):
            assert generate_otp().isdigit()

    def test_otp_is_zero_padded(self) -> None:
        # With many samples, we should eventually get one starting with 0
        otps = [generate_otp() for _ in range(200)]
        assert any(otp.startswith("0") for otp in otps) or all(len(o) == 6 for o in otps)


# ── HMAC ──────────────────────────────────────────────────────────────────────

class TestComputeOtpHmac:
    def test_same_inputs_yield_same_hmac(self) -> None:
        h1 = compute_otp_hmac("123456", "user@test.com")
        h2 = compute_otp_hmac("123456", "user@test.com")
        assert h1 == h2

    def test_different_otp_yields_different_hmac(self) -> None:
        h1 = compute_otp_hmac("123456", "user@test.com")
        h2 = compute_otp_hmac("654321", "user@test.com")
        assert h1 != h2

    def test_different_email_yields_different_hmac(self) -> None:
        h1 = compute_otp_hmac("123456", "a@test.com")
        h2 = compute_otp_hmac("123456", "b@test.com")
        assert h1 != h2

    def test_hmac_is_hex_string(self) -> None:
        h = compute_otp_hmac("000000", "x@y.com")
        assert all(c in "0123456789abcdef" for c in h)


# ── ForgotPasswordUseCase ─────────────────────────────────────────────────────

class TestForgotPasswordUseCase:
    @pytest.mark.asyncio
    async def test_sends_email_for_known_user(self) -> None:
        user = _make_user()
        user_repo, reset_repo = _make_repos(user=user)
        send_email = AsyncMock()

        uc = ForgotPasswordUseCase(
            user_repo=user_repo, reset_repo=reset_repo, send_otp_email=send_email
        )
        await uc.execute("user@test.com")

        send_email.assert_awaited_once()
        reset_repo.create_otp_challenge.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_error_for_unknown_user(self) -> None:
        user_repo, reset_repo = _make_repos(user=None)
        send_email = AsyncMock()

        uc = ForgotPasswordUseCase(
            user_repo=user_repo, reset_repo=reset_repo, send_otp_email=send_email
        )
        with pytest.raises(EmailNotFoundError):
            await uc.execute("unknown@test.com")

        send_email.assert_not_awaited()
        reset_repo.create_otp_challenge.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_rate_limited_does_not_send_email(self) -> None:
        user = _make_user()
        user_repo, reset_repo = _make_repos(user=user, challenge_count=OTP_RATE_LIMIT_COUNT)
        send_email = AsyncMock()

        uc = ForgotPasswordUseCase(
            user_repo=user_repo, reset_repo=reset_repo, send_otp_email=send_email
        )
        await uc.execute("user@test.com")

        send_email.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_email_normalised_before_use(self) -> None:
        """Email is lowercased and stripped before lookup."""
        user = _make_user(email="user@test.com")
        user_repo, reset_repo = _make_repos(user=user)
        send_email = AsyncMock()

        uc = ForgotPasswordUseCase(
            user_repo=user_repo, reset_repo=reset_repo, send_otp_email=send_email
        )
        await uc.execute("  USER@TEST.COM  ")

        user_repo.get_by_email.assert_awaited_with("user@test.com")
