"""Unit tests for VerifyOtpUseCase and ResetPasswordUseCase."""
from __future__ import annotations

import hashlib
import hmac as _hmac
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.auth.forgot_password import compute_otp_hmac
from app.application.auth.verify_otp import VerifyOtpUseCase, _hash_token
from app.application.auth.reset_password import (
    ResetPasswordUseCase,
    validate_password,
)
from app.domain.exceptions.password_reset import (
    OtpExpiredError,
    OtpInvalidError,
    OtpMaxAttemptsError,
    ResetTokenExpiredError,
    ResetTokenInvalidError,
)
from app.infrastructure.auth.password import PasswordHasher


# ── helpers ───────────────────────────────────────────────────────────────────

def _future(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def _past(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=minutes)


def _make_challenge(
    *,
    otp: str = "123456",
    email: str = "user@test.com",
    expired: bool = False,
    attempts: int = 0,
    consumed: bool = False,
):
    ch = MagicMock()
    ch.id = "challenge-id"
    ch.otp_hmac = compute_otp_hmac(otp, email)
    ch.expires_at = _past() if expired else _future()
    ch.attempt_count = attempts
    ch.is_consumed = consumed
    return ch


def _make_user():
    u = MagicMock()
    u.id = "user-uuid"
    u.email = "user@test.com"
    return u


def _make_token_record(*, expired: bool = False, consumed: bool = False):
    t = MagicMock()
    t.id = "token-id"
    t.user_id = "user-uuid"
    t.expires_at = _past() if expired else _future()
    t.is_consumed = consumed
    return t


# ═══════════════════════════════════════════════════════════════════════════════
# VerifyOtpUseCase
# ═══════════════════════════════════════════════════════════════════════════════

class TestVerifyOtpUseCase:
    def _make_repos(self, challenge=None, user=None):
        reset_repo = AsyncMock()
        reset_repo.get_latest_active_challenge.return_value = challenge
        reset_repo.increment_attempt.return_value = None
        reset_repo.consume_challenge.return_value = None
        reset_repo.create_reset_token.return_value = MagicMock()

        user_repo = AsyncMock()
        user_repo.get_by_email.return_value = user
        return reset_repo, user_repo

    @pytest.mark.asyncio
    async def test_valid_otp_returns_reset_token(self) -> None:
        ch = _make_challenge(otp="123456")
        user = _make_user()
        reset_repo, user_repo = self._make_repos(challenge=ch, user=user)

        uc = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)
        token = await uc.execute("user@test.com", "123456")

        assert isinstance(token, str)
        assert len(token) > 0
        reset_repo.consume_challenge.assert_awaited_once_with(ch.id)
        reset_repo.create_reset_token.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_wrong_otp_raises_otp_invalid(self) -> None:
        ch = _make_challenge(otp="123456")
        user = _make_user()
        reset_repo, user_repo = self._make_repos(challenge=ch, user=user)

        uc = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)
        with pytest.raises(OtpInvalidError):
            await uc.execute("user@test.com", "999999")

        reset_repo.increment_attempt.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_expired_otp_raises_otp_expired(self) -> None:
        ch = _make_challenge(otp="123456", expired=True)
        reset_repo, user_repo = self._make_repos(challenge=ch)

        uc = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)
        with pytest.raises(OtpExpiredError):
            await uc.execute("user@test.com", "123456")

    @pytest.mark.asyncio
    async def test_max_attempts_raises_otp_max_attempts(self) -> None:
        ch = _make_challenge(otp="123456", attempts=5)
        reset_repo, user_repo = self._make_repos(challenge=ch)

        uc = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)
        with pytest.raises(OtpMaxAttemptsError):
            await uc.execute("user@test.com", "123456")

    @pytest.mark.asyncio
    async def test_no_challenge_raises_otp_invalid(self) -> None:
        reset_repo, user_repo = self._make_repos(challenge=None)

        uc = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)
        with pytest.raises(OtpInvalidError):
            await uc.execute("user@test.com", "123456")

    @pytest.mark.asyncio
    async def test_reset_token_is_hashed_before_storage(self) -> None:
        """The raw token returned ≠ what is stored in DB."""
        ch = _make_challenge(otp="123456")
        user = _make_user()
        reset_repo, user_repo = self._make_repos(challenge=ch, user=user)

        uc = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)
        raw_token = await uc.execute("user@test.com", "123456")

        call_kwargs = reset_repo.create_reset_token.call_args.kwargs
        stored_hash = call_kwargs["token_hash"]
        assert stored_hash == hashlib.sha256(raw_token.encode()).hexdigest()
        assert stored_hash != raw_token


# ═══════════════════════════════════════════════════════════════════════════════
# validate_password
# ═══════════════════════════════════════════════════════════════════════════════

class TestValidatePassword:
    def test_strong_password_is_valid(self) -> None:
        assert validate_password("Passw0rd!") == []

    def test_short_password_invalid(self) -> None:
        errors = validate_password("Ab1!")
        assert any("8" in e for e in errors)

    def test_no_uppercase_invalid(self) -> None:
        errors = validate_password("passw0rd!")
        assert any("uppercase" in e.lower() for e in errors)

    def test_no_lowercase_invalid(self) -> None:
        errors = validate_password("PASSW0RD!")
        assert any("lowercase" in e.lower() for e in errors)

    def test_no_digit_invalid(self) -> None:
        errors = validate_password("Password!")
        assert any("digit" in e.lower() for e in errors)

    def test_no_special_invalid(self) -> None:
        errors = validate_password("Password1")
        assert any("special" in e.lower() for e in errors)


# ═══════════════════════════════════════════════════════════════════════════════
# ResetPasswordUseCase
# ═══════════════════════════════════════════════════════════════════════════════

class TestResetPasswordUseCase:
    def _make_repos(self, token_record=None):
        reset_repo = AsyncMock()
        reset_repo.get_reset_token_by_hash.return_value = token_record
        reset_repo.consume_reset_token.return_value = None
        reset_repo.invalidate_all_reset_tokens_for_user.return_value = None
        reset_repo.update_user_password.return_value = None
        return reset_repo

    @pytest.mark.asyncio
    async def test_valid_reset_succeeds(self) -> None:
        token_record = _make_token_record()
        reset_repo = self._make_repos(token_record=token_record)
        hasher = PasswordHasher()

        uc = ResetPasswordUseCase(reset_repo=reset_repo, password_hasher=hasher)
        await uc.execute(
            reset_token="somerawtoken",
            new_password="NewPass0rd!",
            confirm_password="NewPass0rd!",
        )

        reset_repo.update_user_password.assert_awaited_once()
        reset_repo.consume_reset_token.assert_awaited_once_with(token_record.id)
        reset_repo.invalidate_all_reset_tokens_for_user.assert_awaited_once_with(
            token_record.user_id
        )

    @pytest.mark.asyncio
    async def test_password_mismatch_raises_value_error(self) -> None:
        token_record = _make_token_record()
        reset_repo = self._make_repos(token_record=token_record)
        hasher = PasswordHasher()

        uc = ResetPasswordUseCase(reset_repo=reset_repo, password_hasher=hasher)
        with pytest.raises(ValueError, match="do not match"):
            await uc.execute(
                reset_token="tok",
                new_password="NewPass0rd!",
                confirm_password="Different1!",
            )

    @pytest.mark.asyncio
    async def test_weak_password_raises_value_error(self) -> None:
        token_record = _make_token_record()
        reset_repo = self._make_repos(token_record=token_record)
        hasher = PasswordHasher()

        uc = ResetPasswordUseCase(reset_repo=reset_repo, password_hasher=hasher)
        with pytest.raises(ValueError):
            await uc.execute(
                reset_token="tok",
                new_password="weak",
                confirm_password="weak",
            )

    @pytest.mark.asyncio
    async def test_invalid_token_raises_reset_token_invalid(self) -> None:
        reset_repo = self._make_repos(token_record=None)
        hasher = PasswordHasher()

        uc = ResetPasswordUseCase(reset_repo=reset_repo, password_hasher=hasher)
        with pytest.raises(ResetTokenInvalidError):
            await uc.execute(
                reset_token="nonexistent",
                new_password="NewPass0rd!",
                confirm_password="NewPass0rd!",
            )

    @pytest.mark.asyncio
    async def test_expired_token_raises_reset_token_expired(self) -> None:
        token_record = _make_token_record(expired=True)
        reset_repo = self._make_repos(token_record=token_record)
        hasher = PasswordHasher()

        uc = ResetPasswordUseCase(reset_repo=reset_repo, password_hasher=hasher)
        with pytest.raises(ResetTokenExpiredError):
            await uc.execute(
                reset_token="tok",
                new_password="NewPass0rd!",
                confirm_password="NewPass0rd!",
            )

    @pytest.mark.asyncio
    async def test_new_password_is_hashed_before_storage(self) -> None:
        """The plaintext password must never be stored."""
        token_record = _make_token_record()
        reset_repo = self._make_repos(token_record=token_record)
        hasher = PasswordHasher()

        uc = ResetPasswordUseCase(reset_repo=reset_repo, password_hasher=hasher)
        plain = "NewPass0rd!"
        await uc.execute(
            reset_token="tok",
            new_password=plain,
            confirm_password=plain,
        )

        call_args = reset_repo.update_user_password.call_args
        stored_hash = call_args.args[1] if call_args.args else call_args.kwargs.get("password_hash")
        # Hash must not equal plaintext
        assert stored_hash != plain
        # Hash must verify against the original
        assert hasher.verify(plain, stored_hash)
